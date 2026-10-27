/**
 * ServiceTitan REST client, for the HVAC division (one tenant).
 *
 * Auth is OAuth2 client credentials (a bearer token that lives ~15 min) plus an
 * `ST-App-Key` header on every call. Paths are versioned per module:
 * `/{module}/v2/tenant/{tenantId}/{path}`, and lists come back as
 * `{ page, pageSize, hasMore, data }`.
 *
 * Env: ST_ENV (`production`, else the integration sandbox), ST_CLIENT_ID,
 * ST_CLIENT_SECRET, ST_APP_KEY, ST_TENANT_ID. The same app credentials as the
 * internal booking tool's HVAC tab.
 */

const MAX_RETRIES = 5;
const REQUEST_TIMEOUT_MS = 30_000;
const PAGE_SIZE = 500;

export type StCredentials = {
  clientId: string;
  clientSecret: string;
  appKey: string;
  tenantId: string;
  production: boolean;
};

export type StPage<T> = {
  page: number;
  pageSize: number;
  hasMore: boolean;
  data: T[];
};

export class StApiError extends Error {
  constructor(
    public status: number,
    public endpoint: string,
    public body: string,
  ) {
    super(`ServiceTitan API ${status} on ${endpoint}: ${body.slice(0, 300)}`);
    this.name = "StApiError";
  }
}

/** ServiceTitan timestamps are ISO 8601 in UTC (`…Z`). */
export function parseStTimestamp(value: string | undefined | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Money and quantities come back as strings on invoices and as numbers elsewhere. */
export function stNumber(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

export class StClient {
  private token: { value: string; expiresAt: number } | null = null;

  constructor(private readonly creds: StCredentials) {
    if (!creds.clientId || !creds.clientSecret || !creds.appKey || !creds.tenantId) {
      throw new Error("StClient: client id, client secret, app key and tenant id are required");
    }
  }

  static fromEnv(): StClient {
    const clientId = process.env.ST_CLIENT_ID;
    const clientSecret = process.env.ST_CLIENT_SECRET;
    const appKey = process.env.ST_APP_KEY;
    const tenantId = process.env.ST_TENANT_ID;
    if (!clientId || !clientSecret || !appKey || !tenantId) {
      throw new Error(
        "Missing ST_CLIENT_ID / ST_CLIENT_SECRET / ST_APP_KEY / ST_TENANT_ID in env",
      );
    }
    const production = (process.env.ST_ENV ?? "").toLowerCase().startsWith("prod");
    return new StClient({ clientId, clientSecret, appKey, tenantId, production });
  }

  private get authUrl() {
    return this.creds.production
      ? "https://auth.servicetitan.io/connect/token"
      : "https://auth-integration.servicetitan.io/connect/token";
  }

  private get apiBase() {
    return this.creds.production
      ? "https://api.servicetitan.io"
      : "https://api-integration.servicetitan.io";
  }

  async get<T = unknown>(
    module: string,
    path: string,
    params: Record<string, string | number | undefined> = {},
  ): Promise<T> {
    const url = new URL(
      `${this.apiBase}/${module}/v2/tenant/${this.creds.tenantId}/${path.replace(/^\//, "")}`,
    );
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
    return this.fetchWithRetry<T>(url.toString());
  }

  /**
   * Walk a list oldest change first, from `fromCursor` on. Each request asks for
   * rows modified on or after the newest `modifiedOn` seen so far, starting
   * again at page 1, so rows edited during the walk move to the end of the
   * list instead of shifting unread rows onto a page we already read. Rows on
   * the boundary come back twice; the runner drops the repeats by id. A page
   * that is entirely one timestamp would never move the cursor, so then we
   * step to the next page instead.
   */
  async *paginate<T extends { modifiedOn?: string | null }>(
    module: string,
    path: string,
    fromCursor: Date,
    extraParams: Record<string, string | number | undefined> = {},
  ): AsyncGenerator<T[], void, void> {
    let cursor = fromCursor;
    let page = 1;
    while (true) {
      const r = await this.get<StPage<T>>(module, path, {
        ...extraParams,
        modifiedOnOrAfter: cursor.toISOString(),
        sort: "+ModifiedOn",
        page,
        pageSize: PAGE_SIZE,
      });
      const rows = r.data ?? [];
      if (rows.length === 0) return;
      yield rows;
      if (!r.hasMore) return;

      let max = cursor;
      for (const row of rows) {
        const ts = parseStTimestamp(row.modifiedOn);
        if (ts && ts > max) max = ts;
      }
      if (max.getTime() > cursor.getTime()) {
        cursor = max;
        page = 1;
      } else {
        page += 1;
      }
    }
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt) return this.token.value;
    const res = await fetch(this.authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.creds.clientId,
        client_secret: this.creds.clientSecret,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new StApiError(res.status, "connect/token", body);
    }
    const j = (await res.json()) as { access_token: string; expires_in?: number };
    // Refresh a minute before ServiceTitan expires it.
    const ttlMs = (Number(j.expires_in) || 900) * 1000;
    this.token = { value: j.access_token, expiresAt: Date.now() + ttlMs - 60_000 };
    return this.token.value;
  }

  private async fetchWithRetry<T>(url: string, attempt = 0): Promise<T> {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${await this.getToken()}`,
          "ST-App-Key": this.creds.appKey,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, Math.min(30_000, 500 * 2 ** attempt)));
        return this.fetchWithRetry<T>(url, attempt + 1);
      }
      throw err;
    }

    if (res.ok) return (await res.json()) as T;

    // A token revoked early: drop it and try once more with a fresh one.
    if (res.status === 401 && attempt === 0) {
      this.token = null;
      return this.fetchWithRetry<T>(url, attempt + 1);
    }

    const retriable = res.status === 429 || res.status >= 500;
    if (retriable && attempt < MAX_RETRIES) {
      const retryAfter = res.headers.get("retry-after");
      const delayMs = retryAfter
        ? Number(retryAfter) * 1000
        : Math.min(30_000, 500 * 2 ** attempt);
      await new Promise((r) => setTimeout(r, delayMs));
      return this.fetchWithRetry<T>(url, attempt + 1);
    }

    const body = await res.text().catch(() => "");
    throw new StApiError(res.status, url, body);
  }
}
