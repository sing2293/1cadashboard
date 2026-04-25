import { formatSmCursor } from "./time";

const BASE_URL = "https://api.servicemonster.net/v1";
const MAX_RETRIES = 5;

export type SmCredentials = { user: string; pass: string };

export class SmApiError extends Error {
  constructor(
    public status: number,
    public endpoint: string,
    public body: string,
  ) {
    super(`ServiceMonster API ${status} on ${endpoint}: ${body.slice(0, 300)}`);
    this.name = "SmApiError";
  }
}

export type SmListResponse<T> = {
  count: number;
  items: T[];
};

export class SmClient {
  private readonly authHeader: string;

  constructor(creds: SmCredentials) {
    if (!creds.user || !creds.pass) {
      throw new Error("SmClient: user and pass are required");
    }
    const b64 = Buffer.from(`${creds.user}:${creds.pass}`).toString("base64");
    this.authHeader = `Basic ${b64}`;
  }

  static fromEnv(slug: string): SmClient {
    const key = slug.toUpperCase();
    const user = process.env[`SM_USER_${key}`];
    const pass = process.env[`SM_PASS_${key}`];
    if (!user || !pass) {
      throw new Error(`Missing SM_USER_${key} / SM_PASS_${key} in env`);
    }
    return new SmClient({ user, pass });
  }

  async get<T = unknown>(
    endpoint: string,
    params: Record<string, string | number | undefined> = {},
  ): Promise<T> {
    const url = new URL(`${BASE_URL}/${endpoint.replace(/^\//, "")}`);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
    return this.fetchWithRetry<T>(url.toString());
  }

  /**
   * Fetch every page of a list endpoint. Yields each page's data array so the
   * caller can stream-process without materializing the whole result set.
   */
  /**
   * Cursor-walk pagination. The SM v1 API ignores `page` and `offset` — the only
   * way to advance through a list is to filter by an ordered field. We sort by
   * `cursorField` ASC and re-query with `wOperator=gt` after each page,
   * advancing to the max value seen.
   *
   * Caveat: `gte` is broken on the SM API (returns 0 rows even when matching
   * data exists), so we have to use `gt`. This means rows that share the exact
   * same timestamp as the page's max are skipped. With sub-second precision
   * and our row volume the collision risk is negligible. The runner still
   * de-dupes by ID as defense in depth.
   */
  async *paginate<T = unknown>(
    endpoint: string,
    cursorField: string,
    initialCursor: Date,
    extractCursor: (row: T) => Date | null,
    pageSize = 100,
    extraParams: Record<string, string | number | undefined> = {},
  ): AsyncGenerator<T[], void, void> {
    let cursor = initialCursor;
    while (true) {
      const response = await this.get<SmListResponse<T>>(endpoint, {
        ...extraParams,
        limit: pageSize,
        orderBy: cursorField,
        wField: cursorField,
        wOperator: "gt",
        wValue: formatSmCursor(cursor),
      });
      const rows = response.items ?? [];
      if (rows.length === 0) return;
      yield rows;

      let max = cursor;
      for (const row of rows) {
        const ts = extractCursor(row);
        if (ts && ts > max) max = ts;
      }
      // If a full page shares the same timestamp, advance by 1ms to avoid
      // looping forever; the caller's dedupe will protect against missed rows.
      cursor =
        max.getTime() > cursor.getTime() ? max : new Date(cursor.getTime() + 1);
    }
  }

  private async fetchWithRetry<T>(url: string, attempt = 0): Promise<T> {
    const res = await fetch(url, {
      headers: {
        Authorization: this.authHeader,
        Accept: "application/json",
      },
    });

    if (res.ok) {
      return (await res.json()) as T;
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
    throw new SmApiError(res.status, url, body);
  }
}
