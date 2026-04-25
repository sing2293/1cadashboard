import { getRecentRuns, getSyncStatus } from "@/lib/queries/admin";
import { fmtInt, Section, StatusPill } from "../../_components";

export const dynamic = "force-dynamic";

const fmtTime = (d: Date | null) => {
  if (!d) return "—";
  return d.toISOString().replace("T", " ").slice(0, 19) + "Z";
};

export default async function SyncStatusPage() {
  const [status, runs] = await Promise.all([getSyncStatus(), getRecentRuns(50)]);

  const grouped = new Map<string, typeof status>();
  for (const r of status) {
    const key = r.companySlug;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Sync status
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Latest run + cursor per company × resource. Refresh to see updates.
        </p>

        {Array.from(grouped.entries()).map(([slug, rows]) => (
          <Section key={slug} title={`${rows[0].companyName} (${slug})`} padded={false}>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-2 py-2">Resource</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Last finished</th>
                  <th className="px-2 py-2 text-right">Records</th>
                  <th className="px-2 py-2">Cursor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {rows.map((r) => (
                  <tr key={`${r.companyId}-${r.resource}`}>
                    <td className="px-2 py-2 text-zinc-900 dark:text-zinc-100 font-medium">
                      {r.resource}
                    </td>
                    <td className="px-2 py-2">
                      <StatusPill status={r.lastStatus} />
                    </td>
                    <td className="px-2 py-2 text-zinc-700 dark:text-zinc-300 font-mono text-xs">
                      {fmtTime(r.lastFinishedAt)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {fmtInt(r.lastUpserted)}
                    </td>
                    <td className="px-2 py-2 text-zinc-700 dark:text-zinc-300 font-mono text-xs">
                      {fmtTime(r.cursorAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        ))}

        <Section title="Recent runs" padded={false}>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">Company</th>
                <th className="px-2 py-2">Resource</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Started</th>
                <th className="px-2 py-2">Finished</th>
                <th className="px-2 py-2 text-right">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="px-2 py-2 text-zinc-500 font-mono text-xs">
                    {r.id}
                  </td>
                  <td className="px-2 py-2">{r.companySlug}</td>
                  <td className="px-2 py-2">{r.resource}</td>
                  <td className="px-2 py-2">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-2 py-2 text-zinc-700 dark:text-zinc-300 font-mono text-xs">
                    {fmtTime(r.startedAt)}
                  </td>
                  <td className="px-2 py-2 text-zinc-700 dark:text-zinc-300 font-mono text-xs">
                    {fmtTime(r.finishedAt)}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {fmtInt(r.recordsUpserted)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>
    </main>
  );
}
