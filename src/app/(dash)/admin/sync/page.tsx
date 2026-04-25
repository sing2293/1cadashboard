import { getRecentRuns, getSyncStatus } from "@/lib/queries/admin";
import { fmtInt, Section, StatusPill, PageHeader } from "../../_components";

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
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title="Sync status"
          subtitle="Latest run + cursor per company × resource"
        />

        {Array.from(grouped.entries()).map(([slug, rows]) => (
          <Section key={slug} title={`${rows[0].companyName} (${slug})`} padded={false}>
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="text-left text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-50/60 dark:bg-zinc-900/40">
                <tr>
                  <th className="px-6 py-2.5 font-medium">Resource</th>
                  <th className="px-6 py-2.5 font-medium">Status</th>
                  <th className="px-6 py-2.5 font-medium">Last finished</th>
                  <th className="px-6 py-2.5 font-medium text-right">Records</th>
                  <th className="px-6 py-2.5 font-medium">Cursor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {rows.map((r) => (
                  <tr
                    key={`${r.companyId}-${r.resource}`}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-6 py-2.5 text-zinc-900 dark:text-zinc-100 font-medium">
                      {r.resource}
                    </td>
                    <td className="px-6 py-2.5">
                      <StatusPill status={r.lastStatus} />
                    </td>
                    <td className="px-6 py-2.5 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                      {fmtTime(r.lastFinishedAt)}
                    </td>
                    <td className="px-6 py-2.5 text-right tabular-nums">
                      {fmtInt(r.lastUpserted)}
                    </td>
                    <td className="px-6 py-2.5 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                      {fmtTime(r.cursorAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </Section>
        ))}

        <Section title="Recent runs" subtitle="Last 50" padded={false}>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="text-left text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-50/60 dark:bg-zinc-900/40">
              <tr>
                <th className="px-6 py-2.5 font-medium">#</th>
                <th className="px-6 py-2.5 font-medium">Company</th>
                <th className="px-6 py-2.5 font-medium">Resource</th>
                <th className="px-6 py-2.5 font-medium">Status</th>
                <th className="px-6 py-2.5 font-medium">Started</th>
                <th className="px-6 py-2.5 font-medium">Finished</th>
                <th className="px-6 py-2.5 font-medium text-right">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {runs.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="px-6 py-2.5 text-zinc-500 font-mono text-xs">
                    {r.id}
                  </td>
                  <td className="px-6 py-2.5">{r.companySlug}</td>
                  <td className="px-6 py-2.5">{r.resource}</td>
                  <td className="px-6 py-2.5">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-6 py-2.5 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                    {fmtTime(r.startedAt)}
                  </td>
                  <td className="px-6 py-2.5 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                    {fmtTime(r.finishedAt)}
                  </td>
                  <td className="px-6 py-2.5 text-right tabular-nums">
                    {fmtInt(r.recordsUpserted)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Section>
      </div>
    </main>
  );
}
