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
  async *paginate<T = unknown>(
    endpoint: string,
    params: Record<string, string | number | undefined> = {},
    pageSize = 100,
  ): AsyncGenerator<T[], void, void> {
    let page = 1;
    while (true) {
      const response = await this.get<SmListResponse<T>>(endpoint, {
        ...params,
        limit: pageSize,
        page,
      });
      const rows = response.items ?? [];
      if (rows.length === 0) return;
      yield rows;
      if (rows.length < pageSize) return;
      page += 1;
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
