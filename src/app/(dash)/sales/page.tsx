import { resolveCompany } from "@/lib/queries/company";
import { parseRange } from "@/lib/queries/range";
import { getLeadSources, getSalesKpis } from "@/lib/queries/sales";
import {
  fmtInt,
  fmtMoney,
  KpiCard,
  Section,
  PageHeader,
} from "../_components";

export const dynamic = "force-dynamic";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; range?: string }>;
}) {
  const sp = await searchParams;
  const company = await resolveCompany(sp.company);
  if (!company) return <main className="p-10">No company seeded.</main>;

  const range = parseRange(sp.range);
  const [kpis, sources] = await Promise.all([
    getSalesKpis(company.id, range),
    getLeadSources(company.id, range.days),
  ]);

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title={`${company.name} · Sales`}
          subtitle={`Pipeline + new accounts · ${range.label.toLowerCase()}`}
        />

        <section className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard
            label="New leads"
            value={fmtInt(kpis.newLeads)}
            tone="violet"
            delay={0}
          />
          <KpiCard
            label="New prospects"
            value={fmtInt(kpis.newProspects)}
            tone="indigo"
            delay={60}
          />
          <KpiCard
            label="New customers"
            value={fmtInt(kpis.newCustomers)}
            tone="emerald"
            delay={120}
          />
          <KpiCard
            label="Estimates issued"
            value={fmtInt(kpis.estimateCount)}
            tone="sky"
            delay={180}
          />
          <KpiCard
            label="Pipeline value"
            value={fmtMoney(kpis.estimateValueOutstanding)}
            tone="amber"
            delay={240}
          />
        </section>

        <Section
          title="New accounts by lead source"
          subtitle={range.label}
          padded={false}
        >
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead className="text-left text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-50/60 dark:bg-zinc-900/40">
              <tr>
                <th className="px-6 py-2.5 font-medium">Source</th>
                <th className="px-6 py-2.5 font-medium text-right">New accounts</th>
                <th className="px-6 py-2.5 font-medium text-right">
                  Lifetime invoice revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-6 text-zinc-500 text-center">
                    No new accounts in this range.
                  </td>
                </tr>
              ) : (
                sources.map((row) => (
                  <tr
                    key={row.source}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-6 py-2.5 text-zinc-900 dark:text-zinc-100">
                      {row.source}
                    </td>
                    <td className="px-6 py-2.5 text-right tabular-nums">
                      {fmtInt(row.count)}
                    </td>
                    <td className="px-6 py-2.5 text-right font-medium tabular-nums">
                      {fmtMoney(row.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </Section>
      </div>
    </main>
  );
}
