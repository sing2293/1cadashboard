import { resolveCompany } from "@/lib/queries/company";
import {
  getCategoryBreakdown,
  getCrossCompanyMix,
  getTopRawItems,
} from "@/lib/queries/service-mix";
import { fmtInt, fmtMoney, KpiCard, Section } from "../_components";

export const dynamic = "force-dynamic";

export default async function ServiceMixPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const { company: slug } = await searchParams;
  const company = await resolveCompany(slug);
  if (!company) return <main className="p-10">No company seeded.</main>;

  const [categories, topItems, cross] = await Promise.all([
    getCategoryBreakdown(company.id, 365),
    getTopRawItems(company.id, 365, 20),
    getCrossCompanyMix(365),
  ]);

  const totalLines = categories.reduce((a, c) => a + c.itemCount, 0);
  const totalRev = categories.reduce((a, c) => a + c.revenue, 0);
  const unmapped = categories.find((c) => c.category === "(unmapped)");
  const mappedPct =
    totalLines === 0 ? 0 : 1 - (unmapped?.itemCount ?? 0) / totalLines;

  // pivot cross-company rows into a per-company total
  const perCompany = new Map<string, { name: string; revenue: number }>();
  for (const r of cross) {
    const existing = perCompany.get(r.companySlug);
    if (existing) existing.revenue += r.revenue;
    else perCompany.set(r.companySlug, { name: r.companyName, revenue: r.revenue });
  }

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Service Mix · {company.name}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Last 365 days. Category view depends on the service catalog being
          seeded; before that everything is &quot;unmapped&quot; and the raw item
          table below is the useful view.
        </p>

        <section className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <KpiCard label="Line items" value={fmtInt(totalLines)} />
          <KpiCard label="Line-item revenue" value={fmtMoney(totalRev)} />
          <KpiCard
            label="Mapped to catalog"
            value={`${(mappedPct * 100).toFixed(0)}%`}
          />
          <KpiCard label="Categories seen" value={fmtInt(categories.length)} />
        </section>

        <Section title="Revenue by category (last 12 months)" padded={false}>
          {categories.length === 0 ? (
            <div className="px-2 py-4 text-zinc-500 text-sm">
              No invoiced line items yet for {company.name}. Run{" "}
              <code>pnpm sync:items --slug={company.slug}</code> after invoices
              are synced.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2 text-right">Line items</th>
                  <th className="px-2 py-2 text-right">Revenue</th>
                  <th className="px-2 py-2 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {categories.map((c) => (
                  <tr key={c.category}>
                    <td className="px-2 py-2 text-zinc-900 dark:text-zinc-100">
                      {c.category}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {fmtInt(c.itemCount)}
                    </td>
                    <td className="px-2 py-2 text-right font-medium">
                      {fmtMoney(c.revenue)}
                    </td>
                    <td className="px-2 py-2 text-right text-zinc-500">
                      {totalRev > 0
                        ? `${((c.revenue / totalRev) * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Top items by raw name (last 12 months)" padded={false}>
          {topItems.length === 0 ? (
            <div className="px-2 py-4 text-zinc-500 text-sm">
              No items yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-2 py-2">Item</th>
                  <th className="px-2 py-2 text-right">Lines</th>
                  <th className="px-2 py-2 text-right">Avg price</th>
                  <th className="px-2 py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {topItems.map((row) => (
                  <tr key={row.name}>
                    <td className="px-2 py-2 text-zinc-900 dark:text-zinc-100">
                      {row.name}
                    </td>
                    <td className="px-2 py-2 text-right">{fmtInt(row.count)}</td>
                    <td className="px-2 py-2 text-right">
                      {fmtMoney(row.avgPrice)}
                    </td>
                    <td className="px-2 py-2 text-right font-medium">
                      {fmtMoney(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {perCompany.size > 1 && (
          <Section title="Cross-company line-item revenue (last 12 months)" padded={false}>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-2 py-2">Company</th>
                  <th className="px-2 py-2 text-right">Line-item revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {Array.from(perCompany.entries()).map(([slug, c]) => (
                  <tr key={slug}>
                    <td className="px-2 py-2">{c.name}</td>
                    <td className="px-2 py-2 text-right font-medium">
                      {fmtMoney(c.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}
      </div>
    </main>
  );
}
