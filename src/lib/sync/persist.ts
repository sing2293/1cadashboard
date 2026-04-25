/**
 * Run an async fn over `items` with bounded concurrency. Tuned for Prisma
 * upserts against Neon's pooled connection: each upsert is ~2 round trips
 * (~150ms over the wire), so 20 in flight gives ~1s per 100-row page.
 */
export async function concurrentMap<T, R>(
  items: readonly T[],
  fn: (item: T) => Promise<R>,
  concurrency = 20,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    results.push(...(await Promise.all(chunk.map(fn))));
  }
  return results;
}
