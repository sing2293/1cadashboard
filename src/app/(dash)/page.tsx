import { resolveCompany } from "@/lib/queries/company";
import { parseRange } from "@/lib/queries/range";
import {
  getKpis,
  getMonthlyRevenue,
  getTopAccounts,
} from "@/lib/queries/executive";
import {
  fmtInt,
  fmtMoney,
  fmtMoneyCompact,
  KpiCard,
  pctDelta,
  Section,
  BarChart,
  PageHeader,
} from "./_components";

export const dynamic = "force-dynamic";

export default async function ExecutivePage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; range?: string }>;
}) {
  const sp = await searchParams;
  const company = await resolveCompany(sp.company);
  if (!company) {
    return (
      <main className="px-6 py-10 text-zinc-700">
        No company seeded yet — run <code>pnpm db:seed</code>.
      </main>
    );
  }

  const range = parseRange(sp.range);
  const [kpis, monthly, top] = await Promise.all([
    getKpis(company.id, range),
    getMonthlyRevenue(company.id, 12),
    getTopAccounts(company.id, range, 10),
  ]);

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title={`${company.name} · Executive`}
          subtitle={`${range.label} · ${range.from
            .toISOString()
            .slice(0, 10)} → ${range.to.toISOString().slice(0, 10)}`}
        />

        <section className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard
            label="Revenue"
            value={fmtMoney(kpis.revenue)}
            hint={pctDelta(kpis.revenue, kpis.revenuePrev)}
            tone="emerald"
            delay={0}
          />
          <KpiCard
            label="Invoices"
            value={fmtInt(kpis.invoices)}
            tone="indigo"
            delay={60}
          />
          <KpiCard
            label="Avg invoice"
            value={fmtMoney(kpis.avgInvoice)}
            tone="sky"
            delay={120}
          />
          <KpiCard
            label="New customers"
            value={fmtInt(kpis.newCustomers)}
            tone="violet"
            delay={180}
          />
          <KpiCard
            label="Outstanding AR"
            value={fmtMoney(kpis.outstandingAr)}
            tone="rose"
            delay={240}
          />
        </section>

        <Section
          title="Revenue by month"
          subtitle="Last 12 months · invoiced revenue"
        >
          <BarChart
            ariaLabel="Revenue by month"
            tone="emerald"
            format={fmtMoneyCompact}
            data={monthly.map((m) => ({
              label: m.month.slice(5),
              value: m.revenue,
              tooltip: `${m.month}: ${fmtMoney(m.revenue)} (${m.invoices} invoices)`,
            }))}
          />
        </Section>

        <Section
          title="Top accounts"
          subtitle={`By invoiced revenue · ${range.label.toLowerCase()}`}
          padded={false}
        >
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-50/60 dark:bg-zinc-900/40">
              <tr>
                <th className="px-6 py-2.5 font-medium">Account</th>
                <th className="px-6 py-2.5 font-medium text-right">Invoices</th>
                <th className="px-6 py-2.5 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {top.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-6 text-zinc-500 text-center">
                    No invoices in this range.
                  </td>
                </tr>
              ) : (
                top.map((row) => (
                  <tr
                    key={row.smId}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-6 py-2.5 text-zinc-900 dark:text-zinc-100 truncate max-w-md">
                      {row.accountName ?? "—"}
                    </td>
                    <td className="px-6 py-2.5 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">
                      {fmtInt(row.invoices)}
                    </td>
                    <td className="px-6 py-2.5 text-right font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
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
