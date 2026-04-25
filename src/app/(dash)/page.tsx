import Link from "next/link";
import { resolveCompany } from "@/lib/queries/company";
import { parseRange } from "@/lib/queries/range";
import {
  getKpis,
  getMonthlyRevenue,
  getTopAccounts,
} from "@/lib/queries/executive";
import {
  getCompaniesOverview,
  getMonthlyRevenueByCompany,
  getOverviewCategories,
} from "@/lib/queries/overview";
import {
  AreaChart,
  BarChart,
  DonutChart,
  KpiCard,
  PageHeader,
  RingGauge,
  Section,
  fmtInt,
  fmtMoney,
  fmtMoneyCompact,
  pctDelta,
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

const CATEGORY_TONE: Record<string, Tone> = {
  duct: "indigo",
  "dryer-vent": "sky",
  carpet: "violet",
  upholstery: "fuchsia",
  hvac: "emerald",
  sealing: "teal",
  sanitization: "amber",
  insulation: "rose",
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
    const [{ companies, totals }, monthly, categories] = await Promise.all([
      getCompaniesOverview(range),
      getMonthlyRevenueByCompany(12),
      getOverviewCategories(range, 6),
    ]);

    const slices = companies
      .filter((c) => c.revenue > 0)
      .map((c) => ({
        label: c.name,
        value: c.revenue,
        tone: COMPANY_TONES[c.slug] ?? ("indigo" as Tone),
        href: `/?company=${c.slug}&range=${range.preset}`,
      }));

    const areaSeries = monthly.series.map((s) => ({
      label: s.name,
      tone: COMPANY_TONES[s.slug] ?? ("indigo" as Tone),
      points: monthly.months.map((m, i) => ({
        x: m.slice(5),
        y: s.values[i] ?? 0,
      })),
    }));

    const totalCategoryRevenue =
      categories.reduce((a, c) => a + c.revenue, 0) || 1;

    return (
      <main className="px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <PageHeader
            title="All companies"
            subtitle={`${range.label} · click a company to drill in`}
          />

          <section className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
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

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Section
                title="Monthly revenue · by company"
                subtitle="Last 12 months · invoiced"
              >
                <AreaChart
                  ariaLabel="Monthly revenue per company"
                  format={fmtMoneyCompact}
                  series={areaSeries}
                />
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                  {areaSeries.map((s) => (
                    <span
                      key={s.label}
                      className="inline-flex items-center gap-2 text-[var(--text-muted)]"
                    >
                      <span
                        className="size-2.5 rounded-sm"
                        style={{
                          backgroundColor:
                            COMPANY_HEX[
                              s.label.toLowerCase().replace(/\s/g, "")
                            ] ?? "#6366f1",
                        }}
                      />
                      {s.label}
                    </span>
                  ))}
                </div>
              </Section>
            </div>

            <Section
              title="Revenue split"
              subtitle={range.label}
            >
              <DonutChart
                ariaLabel="Revenue per company"
                centerLabel="Total"
                centerValue={fmtMoneyCompact(totals.revenue)}
                slices={slices}
              />
            </Section>
          </div>

          {categories.length > 0 && (
            <Section
              title="Service categories · cross-company"
              subtitle={`Top categories by line-item revenue · ${range.label.toLowerCase()}`}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.map((c) => {
                  const pct = c.revenue / totalCategoryRevenue;
                  return (
                    <RingGauge
                      key={c.category}
                      value={c.revenue}
                      total={totalCategoryRevenue}
                      label={c.category}
                      centerLabel={`${(pct * 100).toFixed(0)}%`}
                      tone={CATEGORY_TONE[c.category] ?? "indigo"}
                    />
                  );
                })}
              </div>
            </Section>
          )}

          <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {companies.map((c, i) => (
              <Link
                key={c.slug}
                href={`/?company=${c.slug}&range=${range.preset}`}
                className="fade-up group rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg shadow-black/10 overflow-hidden hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition"
                style={{ animationDelay: `${240 + i * 60}ms` }}
              >
                <div className="relative px-5 pt-5 pb-4">
                  <div
                    className="absolute -top-10 -right-10 size-24 rounded-full opacity-30 blur-xl"
                    style={{
                      backgroundColor:
                        COMPANY_HEX[c.slug] ?? COMPANY_HEX.default,
                    }}
                  />
                  <span
                    className="absolute left-0 top-3 bottom-3 w-1 rounded-r"
                    style={{
                      backgroundColor:
                        COMPANY_HEX[c.slug] ?? COMPANY_HEX.default,
                    }}
                  />
                  <div className="flex items-center justify-between relative">
                    <h3 className="text-base font-semibold text-[var(--text)]">
                      {c.name}
                    </h3>
                    <span className="text-xs text-[var(--text-muted)] group-hover:text-indigo-400 transition">
                      Open →
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-4 relative">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                        Revenue
                      </div>
                      <div className="text-lg font-semibold tabular-nums text-[var(--text)]">
                        {fmtMoney(c.revenue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                        Invoices
                      </div>
                      <div className="text-lg font-semibold tabular-nums text-[var(--text)]">
                        {fmtInt(c.invoices)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                        Avg invoice
                      </div>
                      <div className="text-sm font-medium tabular-nums text-[var(--text-muted)]">
                        {fmtMoney(c.avgInvoice)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                        Outstanding AR
                      </div>
                      <div className="text-sm font-medium tabular-nums text-[var(--text-muted)]">
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
      <main className="px-6 py-10 text-[var(--text-muted)]">
        Unknown company. <Link href="/" className="text-indigo-400">Back to overview.</Link>
      </main>
    );
  }

  const [kpis, monthly, top] = await Promise.all([
    getKpis(company.id, range),
    getMonthlyRevenue(company.id, 12),
    getTopAccounts(company.id, range, 10),
  ]);

  return (
    <main className="px-6 py-6">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title={`${company.name} · Executive`}
          subtitle={`${range.label} · ${range.from
            .toISOString()
            .slice(0, 10)} → ${range.to.toISOString().slice(0, 10)}`}
        />

        <section className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
          subtitle="Last 12 months · invoiced"
        >
          <AreaChart
            ariaLabel="Monthly revenue"
            format={fmtMoneyCompact}
            series={[
              {
                label: company.name,
                tone:
                  COMPANY_TONES[company.slug] ?? ("indigo" as Tone),
                points: monthly.map((m) => ({ x: m.month.slice(5), y: m.revenue })),
              },
            ]}
          />
        </Section>

        <Section
          title="Top accounts"
          subtitle={`By invoiced revenue · ${range.label.toLowerCase()}`}
          padded={false}
        >
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)] bg-white/[0.02]">
              <tr>
                <th className="px-6 py-2.5 font-medium">Account</th>
                <th className="px-6 py-2.5 font-medium text-right">Invoices</th>
                <th className="px-6 py-2.5 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {top.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-6 text-[var(--text-muted)] text-center">
                    No invoices in this range.
                  </td>
                </tr>
              ) : (
                top.map((row) => (
                  <tr
                    key={row.smId}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-2.5 text-[var(--text)] truncate max-w-md">
                      {row.accountName ?? "—"}
                    </td>
                    <td className="px-6 py-2.5 text-right text-[var(--text-muted)] tabular-nums">
                      {fmtInt(row.invoices)}
                    </td>
                    <td className="px-6 py-2.5 text-right font-medium text-[var(--text)] tabular-nums">
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
