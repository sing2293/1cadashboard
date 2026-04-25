import { resolveCompany } from "@/lib/queries/company";
import { parseRange } from "@/lib/queries/range";
import {
  getCategoryBreakdown,
  getCrossCompanyMix,
  getTopRawItems,
} from "@/lib/queries/service-mix";
import {
  fmtInt,
  fmtMoney,
  fmtMoneyCompact,
  fmtPct,
  KpiCard,
  Section,
  BarChart,
  PageHeader,
  type Tone,
} from "../_components";

export const dynamic = "force-dynamic";

const CATEGORY_TONE: Record<string, Tone> = {
  duct: "indigo",
  "dryer-vent": "sky",
  carpet: "violet",
  upholstery: "fuchsia",
  hvac: "emerald",
  sealing: "teal",
  sanitization: "amber",
  insulation: "rose",
  repair: "zinc",
  discount: "fuchsia",
  fee: "zinc",
  "(unmapped)": "zinc",
};

export default async function ServiceMixPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; range?: string }>;
}) {
  const sp = await searchParams;
  const company = await resolveCompany(sp.company);
  if (!company) return <main className="p-10">No company seeded.</main>;

  const range = parseRange(sp.range);
  const [categories, topItems, cross] = await Promise.all([
    getCategoryBreakdown(company.id, range.days),
    getTopRawItems(company.id, range.days, 20),
    getCrossCompanyMix(range.days),
  ]);

  const totalLines = categories.reduce((a, c) => a + c.itemCount, 0);
  const totalRev = categories.reduce((a, c) => a + c.revenue, 0);
  const unmapped = categories.find((c) => c.category === "(unmapped)");
  const mappedPct =
    totalLines === 0 ? 0 : 1 - (unmapped?.itemCount ?? 0) / totalLines;

  const perCompany = new Map<string, { name: string; revenue: number }>();
  for (const r of cross) {
    const existing = perCompany.get(r.companySlug);
    if (existing) existing.revenue += r.revenue;
    else
      perCompany.set(r.companySlug, { name: r.companyName, revenue: r.revenue });
  }

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title={`${company.name} · Service Mix`}
          subtitle={`Line-item categories · ${range.label.toLowerCase()}`}
        />

        <section className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            label="Line items"
            value={fmtInt(totalLines)}
            tone="indigo"
            delay={0}
          />
          <KpiCard
            label="Line-item revenue"
            value={fmtMoney(totalRev)}
            tone="emerald"
            delay={60}
          />
          <KpiCard
            label="Mapped to catalog"
            value={fmtPct(mappedPct, 0)}
            tone={mappedPct >= 0.7 ? "emerald" : mappedPct >= 0.4 ? "amber" : "rose"}
            delay={120}
          />
          <KpiCard
            label="Categories seen"
            value={fmtInt(categories.length)}
            tone="violet"
            delay={180}
          />
        </section>

        <Section
          title="Revenue by category"
          subtitle={range.label}
        >
          {categories.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No invoiced line items yet for {company.name}.
            </div>
          ) : (
            <BarChart
              ariaLabel="Revenue by service category"
              tone="emerald"
              format={fmtMoneyCompact}
              data={categories.map((c) => ({
                label: c.category,
                value: c.revenue,
                tooltip: `${c.category}: ${fmtMoney(c.revenue)} (${c.itemCount} lines)`,
              }))}
            />
          )}
        </Section>

        <Section title="Category breakdown" padded={false}>
          {categories.length === 0 ? null : (
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-50/60 dark:bg-zinc-900/40">
                <tr>
                  <th className="px-6 py-2.5 font-medium">Category</th>
                  <th className="px-6 py-2.5 font-medium text-right">Lines</th>
                  <th className="px-6 py-2.5 font-medium text-right">Revenue</th>
                  <th className="px-6 py-2.5 font-medium text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {categories.map((c) => {
                  const pct = totalRev > 0 ? c.revenue / totalRev : 0;
                  const tone = CATEGORY_TONE[c.category] ?? "zinc";
                  return (
                    <tr
                      key={c.category}
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-6 py-2.5">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`size-2 rounded-full ${
                              {
                                emerald: "bg-emerald-500",
                                indigo: "bg-indigo-500",
                                sky: "bg-sky-500",
                                violet: "bg-violet-500",
                                rose: "bg-rose-500",
                                amber: "bg-amber-500",
                                teal: "bg-teal-500",
                                fuchsia: "bg-fuchsia-500",
                                zinc: "bg-zinc-400",
                              }[tone]
                            }`}
                          />
                          <span className="text-zinc-900 dark:text-zinc-100 capitalize">
                            {c.category}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-2.5 text-right tabular-nums">
                        {fmtInt(c.itemCount)}
                      </td>
                      <td className="px-6 py-2.5 text-right font-medium tabular-nums">
                        {fmtMoney(c.revenue)}
                      </td>
                      <td className="px-6 py-2.5 text-right">
                        <div className="inline-flex items-center gap-2 justify-end w-full">
                          <div className="h-1.5 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                              style={{ width: `${(pct * 100).toFixed(1)}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-500 w-10 text-right tabular-nums">
                            {fmtPct(pct, 0)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Top items by raw name" subtitle={range.label} padded={false}>
          {topItems.length === 0 ? (
            <div className="px-6 py-6 text-zinc-500 text-sm text-center">
              No items yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-50/60 dark:bg-zinc-900/40">
                <tr>
                  <th className="px-6 py-2.5 font-medium">Item</th>
                  <th className="px-6 py-2.5 font-medium text-right">Lines</th>
                  <th className="px-6 py-2.5 font-medium text-right">Avg price</th>
                  <th className="px-6 py-2.5 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {topItems.map((row) => (
                  <tr
                    key={row.name}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-6 py-2.5 text-zinc-900 dark:text-zinc-100 truncate max-w-md">
                      {row.name}
                    </td>
                    <td className="px-6 py-2.5 text-right tabular-nums">
                      {fmtInt(row.count)}
                    </td>
                    <td className="px-6 py-2.5 text-right tabular-nums">
                      {fmtMoney(row.avgPrice)}
                    </td>
                    <td className="px-6 py-2.5 text-right font-medium tabular-nums">
                      {fmtMoney(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {perCompany.size > 1 && (
          <Section title="Cross-company line-item revenue" subtitle={range.label}>
            <BarChart
              ariaLabel="Revenue per company"
              tone="violet"
              format={fmtMoneyCompact}
              data={Array.from(perCompany.entries()).map(([slug, c]) => ({
                label: slug,
                value: c.revenue,
                tooltip: `${c.name}: ${fmtMoney(c.revenue)}`,
              }))}
            />
          </Section>
        )}
      </div>
    </main>
  );
}
