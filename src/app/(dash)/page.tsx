import { resolveCompany } from "@/lib/queries/company";
import {
  getKpis,
  getMonthlyRevenue,
  getTopAccounts,
} from "@/lib/queries/executive";
import {
  fmtInt,
  fmtMoney,
  KpiCard,
  pctDelta,
  Section,
  BarChart,
} from "./_components";

export const dynamic = "force-dynamic";

export default async function ExecutivePage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const { company: slug } = await searchParams;
  const company = await resolveCompany(slug);
  if (!company) {
    return (
      <main className="px-6 py-10 text-zinc-700">
        No company seeded yet — run <code>pnpm db:seed</code>.
      </main>
    );
  }

  const now = new Date();
  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - 30);
  const range = { from, to: now };

  const [kpis, monthly, top] = await Promise.all([
    getKpis(company.id, range),
    getMonthlyRevenue(company.id, 12),
    getTopAccounts(company.id, range, 10),
  ]);

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {company.name} · Executive
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Last 30 days · {range.from.toISOString().slice(0, 10)} →{" "}
          {range.to.toISOString().slice(0, 10)}
        </p>

        <section className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard
            label="Revenue"
            value={fmtMoney(kpis.revenue)}
            hint={pctDelta(kpis.revenue, kpis.revenuePrev)}
          />
          <KpiCard label="Invoices" value={fmtInt(kpis.invoices)} />
          <KpiCard label="Avg invoice" value={fmtMoney(kpis.avgInvoice)} />
          <KpiCard label="New customers" value={fmtInt(kpis.newCustomers)} />
          <KpiCard label="Outstanding AR" value={fmtMoney(kpis.outstandingAr)} />
        </section>

        <Section title="Revenue by month (last 12 months)">
          <div className="text-zinc-900 dark:text-zinc-100">
            <BarChart
              ariaLabel="Revenue by month"
              format={fmtMoney}
              data={monthly.map((m) => ({
                label: m.month.slice(5),
                value: m.revenue,
                tooltip: `${m.month}: ${fmtMoney(m.revenue)} (${m.invoices} invoices)`,
              }))}
            />
          </div>
        </Section>

        <Section title="Top accounts (last 30 days)" padded={false}>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-2 py-2">Account</th>
                <th className="px-2 py-2 text-right">Invoices</th>
                <th className="px-2 py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {top.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-2 py-4 text-zinc-500">
                    No invoices in the last 30 days.
                  </td>
                </tr>
              ) : (
                top.map((row) => (
                  <tr key={row.smId}>
                    <td className="px-2 py-2 text-zinc-900 dark:text-zinc-100">
                      {row.accountName ?? "—"}
                    </td>
                    <td className="px-2 py-2 text-right text-zinc-700 dark:text-zinc-300">
                      {fmtInt(row.invoices)}
                    </td>
                    <td className="px-2 py-2 text-right font-medium text-zinc-900 dark:text-zinc-100">
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
