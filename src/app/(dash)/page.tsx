import Link from "next/link";
import { resolveCompany } from "@/lib/queries/company";
import { parseRange } from "@/lib/queries/range";
import {
  getKpis,
  getMonthlyRevenue,
  getTopAccounts,
} from "@/lib/queries/executive";
import { getCompaniesOverview } from "@/lib/queries/overview";
import {
  fmtInt,
  fmtMoney,
  fmtMoneyCompact,
  KpiCard,
  pctDelta,
  Section,
  BarChart,
  DonutChart,
  PageHeader,
  type Tone,
} from "./_components";

export const dynamic = "force-dynamic";

const COMPANY_TONES: Record<string, Tone> = {
  "1cleanair": "indigo",
  homedepot: "emerald",
  enviroduct: "violet",
};

const COMPANY_HEX: Record<string, string> = {
  "1cleanair": "#6366f1",
  homedepot: "#10b981",
  enviroduct: "#8b5cf6",
  default: "#71717a",
};

export default async function ExecutivePage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; range?: string }>;
}) {
  const sp = await searchParams;
  const range = parseRange(sp.range);

  // No company filter (or "all") → cross-company overview.
  if (!sp.company || sp.company === "all") {
    const { companies, totals } = await getCompaniesOverview(range);

    const slices = companies
      .filter((c) => c.revenue > 0)
      .map((c) => ({
        label: c.name,
        value: c.revenue,
        tone: COMPANY_TONES[c.slug] ?? ("indigo" as Tone),
        href: `/?company=${c.slug}&range=${range.preset}`,
      }));

    return (
      <main className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <PageHeader
            title="All companies"
            subtitle={`${range.label} · click a company to drill in`}
          />

          <section className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              label="Total revenue"
              value={fmtMoney(totals.revenue)}
              tone="emerald"
              delay={0}
            />
            <KpiCard
              label="Invoices"
              value={fmtInt(totals.invoices)}
              tone="indigo"
              delay={60}
            />
            <KpiCard
              label="New customers"
              value={fmtInt(totals.newCustomers)}
              tone="violet"
              delay={120}
            />
            <KpiCard
              label="Outstanding AR"
              value={fmtMoney(totals.outstandingAr)}
              tone="rose"
              delay={180}
            />
          </section>

          <Section
            title="Revenue split"
            subtitle={`${range.label} · click a slice or row to open that company`}
          >
            <DonutChart
              ariaLabel="Revenue per company"
              centerLabel="Total revenue"
              centerValue={fmtMoney(totals.revenue)}
              slices={slices}
            />
          </Section>

          <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {companies.map((c, i) => (
              <Link
                key={c.slug}
                href={`/?company=${c.slug}&range=${range.preset}`}
                className="fade-up group rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition"
                style={{ animationDelay: `${240 + i * 60}ms` }}
              >
                <div className="relative px-5 pt-5 pb-4">
                  <span
                    className="absolute left-0 top-3 bottom-3 w-1 rounded-r"
                    style={{
                      backgroundColor:
                        COMPANY_HEX[c.slug] ?? COMPANY_HEX.default,
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                      {c.name}
                    </h3>
                    <span className="text-xs text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition">
                      Open →
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Revenue
                      </div>
                      <div className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                        {fmtMoney(c.revenue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Invoices
                      </div>
                      <div className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                        {fmtInt(c.invoices)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Avg invoice
                      </div>
                      <div className="text-sm font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                        {fmtMoney(c.avgInvoice)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Outstanding AR
                      </div>
                      <div className="text-sm font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                        {fmtMoney(c.outstandingAr)}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        </div>
      </main>
    );
  }

  // Specific company → single-company executive view.
  const company = await resolveCompany(sp.company);
  if (!company) {
    return (
      <main className="px-6 py-10 text-zinc-700">
        Unknown company. <Link href="/">Back to overview.</Link>
      </main>
    );
  }

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
