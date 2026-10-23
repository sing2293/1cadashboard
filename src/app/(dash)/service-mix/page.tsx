import {
  BadgeCheck,
  ChartPie,
  DollarSign,
  Layers,
  List,
  Package,
} from "lucide-react";
import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@1ca/ui/components/card";
import { BarList, MiniBar, slotColor } from "@1ca/ui/components/charts";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@1ca/ui/components/data-table";
import { EmptyState } from "@1ca/ui/components/empty-state";
import { Page } from "@1ca/ui/components/page";
import { Section } from "@1ca/ui/components/section";
import { StatCard } from "@1ca/ui/components/stat-card";
import { StatusPill, type StatusTone } from "@1ca/ui/components/status-pill";
import { resolveCompany } from "@/lib/queries/company";
import { parseRange } from "@/lib/queries/range";
import {
  getCategoryBreakdown,
  getCrossCompanyMix,
  getTopRawItems,
} from "@/lib/queries/service-mix";
import {
  categorySlot,
  companySlot,
  enterDelay,
  fmtInt,
  fmtMoney,
  fmtMoneyCompact,
  fmtPct,
} from "../_components";
import { NoCompanyPage, ReportHeader } from "../_report-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Service mix" };

// The catalog-mapping health shown under "Mapped to catalog".
function mappingStatus(mappedPct: number): { tone: StatusTone; label: string } {
  if (mappedPct >= 0.7) return { tone: "success", label: "Healthy" };
  if (mappedPct >= 0.4) return { tone: "warning", label: "Partly mapped" };
  return { tone: "danger", label: "Mostly unmapped" };
}

export default async function ServiceMixPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; range?: string }>;
}) {
  const sp = await searchParams;
  const company = await resolveCompany(sp.company);
  if (!company) return <NoCompanyPage icon={ChartPie} title="Service mix" />;

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

  const mapping = mappingStatus(mappedPct);

  return (
    <Page>
      <ReportHeader
        icon={ChartPie}
        eyebrow={company.name}
        title="Service mix"
        description={`Line-item categories · ${range.label.toLowerCase()}`}
      />

      <Section title="Overview">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            className="ca-enter"
            style={enterDelay(0)}
            label="Line items"
            value={fmtInt(totalLines)}
            icon={List}
          />
          <StatCard
            className="ca-enter"
            style={enterDelay(1)}
            label="Line-item revenue"
            value={fmtMoney(totalRev)}
            icon={DollarSign}
          />
          <StatCard
            className="ca-enter"
            style={enterDelay(2)}
            label="Mapped to catalog"
            value={fmtPct(mappedPct, 0)}
            hint={<StatusPill tone={mapping.tone}>{mapping.label}</StatusPill>}
            icon={BadgeCheck}
          />
          <StatCard
            className="ca-enter"
            style={enterDelay(3)}
            label="Categories seen"
            value={fmtInt(categories.length)}
            icon={Layers}
          />
        </div>
      </Section>

      {categories.length === 0 ? (
        <Card variant="solid">
          <CardHeader>
            <CardTitle as="h2">Revenue by category</CardTitle>
            <CardDescription>{range.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Layers}
              title={`No invoiced line items yet for ${company.name}.`}
              description="Try a longer date range."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <Card variant="solid" className="lg:col-span-2">
            <CardHeader>
              <CardTitle as="h2">Revenue by category</CardTitle>
              <CardDescription>{range.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <BarList
                ariaLabel="Revenue by service category"
                format={fmtMoneyCompact}
                labelClassName="capitalize"
                data={categories.map((c) => ({
                  label: c.category,
                  value: c.revenue,
                  slot: categorySlot(c.category),
                  tooltip: `${c.category}: ${fmtMoney(c.revenue)} (${c.itemCount} lines)`,
                }))}
              />
            </CardContent>
          </Card>

          <Card variant="solid" className="overflow-hidden pb-0 lg:col-span-3">
            <CardHeader>
              <CardTitle as="h2">Category breakdown</CardTitle>
              <CardDescription>Lines, revenue and share of revenue</CardDescription>
            </CardHeader>
            <CardContent flush>
              <Table
                surface="none"
                label="Category breakdown"
                className="min-w-[30rem]"
              >
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead numeric>Lines</TableHead>
                    <TableHead numeric>Revenue</TableHead>
                    <TableHead numeric>Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((c) => {
                    const pct = totalRev > 0 ? c.revenue / totalRev : 0;
                    const slot = categorySlot(c.category);
                    return (
                      <TableRow key={c.category}>
                        <TableCell>
                          <span className="inline-flex items-center gap-2">
                            <span
                              aria-hidden
                              className="size-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: slotColor(slot) }}
                            />
                            <span className="font-medium capitalize">
                              {c.category}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell numeric muted>
                          {fmtInt(c.itemCount)}
                        </TableCell>
                        <TableCell numeric className="font-medium">
                          {fmtMoney(c.revenue)}
                        </TableCell>
                        <TableCell numeric>
                          <span className="inline-flex items-center justify-end gap-2">
                            <MiniBar value={pct} slot={slot} />
                            <span className="w-10 text-xs text-ca-muted">
                              {fmtPct(pct, 0)}
                            </span>
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <Card variant="solid" className="overflow-hidden pb-0">
        <CardHeader>
          <CardTitle as="h2">Top items by raw name</CardTitle>
          <CardDescription>{range.label}</CardDescription>
        </CardHeader>
        <CardContent flush>
          <Table surface="none" label="Top items by raw name" className="min-w-[36rem]">
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead numeric>Lines</TableHead>
                <TableHead numeric>Avg price</TableHead>
                <TableHead numeric>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topItems.length === 0 ? (
                <TableEmpty colSpan={4} icon={Package} title="No items yet." />
              ) : (
                topItems.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="max-w-md truncate font-medium">
                      {row.name}
                    </TableCell>
                    <TableCell numeric muted>
                      {fmtInt(row.count)}
                    </TableCell>
                    <TableCell numeric muted>
                      {fmtMoney(row.avgPrice)}
                    </TableCell>
                    <TableCell numeric className="font-medium">
                      {fmtMoney(row.revenue)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {perCompany.size > 1 && (
        <Card variant="solid">
          <CardHeader>
            <CardTitle as="h2">Cross-company line-item revenue</CardTitle>
            <CardDescription>{range.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              ariaLabel="Revenue per company"
              format={fmtMoneyCompact}
              data={Array.from(perCompany.entries()).map(([slug, c]) => ({
                label: c.name,
                value: c.revenue,
                slot: companySlot(slug),
                tooltip: `${c.name}: ${fmtMoney(c.revenue)}`,
              }))}
            />
          </CardContent>
        </Card>
      )}
    </Page>
  );
}
