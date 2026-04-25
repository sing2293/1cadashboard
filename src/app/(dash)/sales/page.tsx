import { resolveCompany } from "@/lib/queries/company";
import { getLeadSources, getSalesKpis } from "@/lib/queries/sales";
import { fmtInt, fmtMoney, KpiCard, Section } from "../_components";

export const dynamic = "force-dynamic";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const { company: slug } = await searchParams;
  const company = await resolveCompany(slug);
  if (!company) return <main className="p-10">No company seeded.</main>;

  const [kpis, sources] = await Promise.all([
    getSalesKpis(company.id),
    getLeadSources(company.id, 90),
  ]);

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {company.name} · Sales
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Last 30 days (KPIs) · last 90 days (sources)
        </p>

        <section className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard label="New leads (30d)" value={fmtInt(kpis.newLeads30)} />
          <KpiCard
            label="New prospects (30d)"
            value={fmtInt(kpis.newProspects30)}
          />
          <KpiCard
            label="New customers (30d)"
            value={fmtInt(kpis.newCustomers30)}
          />
          <KpiCard label="Open estimates" value={fmtInt(kpis.estimateCount)} />
          <KpiCard
            label="Pipeline value"
            value={fmtMoney(kpis.estimateValueOutstanding)}
          />
        </section>

        <Section
          title="New accounts by lead source (last 90 days)"
          padded={false}
        >
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-2 py-2">Source</th>
                <th className="px-2 py-2 text-right">New accounts</th>
                <th className="px-2 py-2 text-right">Lifetime invoice revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-2 py-4 text-zinc-500">
                    No new accounts in the last 90 days.
                  </td>
                </tr>
              ) : (
                sources.map((row) => (
                  <tr key={row.source}>
                    <td className="px-2 py-2 text-zinc-900 dark:text-zinc-100">
                      {row.source}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {fmtInt(row.count)}
                    </td>
                    <td className="px-2 py-2 text-right font-medium">
                      {fmtMoney(row.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Section>
      </div>
    </main>
  );
}
