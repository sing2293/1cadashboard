import {
  ArrowLeft,
  ArrowUpRight,
  DollarSign,
  Inbox,
  LayoutDashboard,
  Receipt,
  SearchX,
  UserPlus,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@1ca/ui/components/card";
import {
  AreaChart,
  ChartLegend,
  DonutChart,
  MiniBar,
  RingGauge,
  slotColor,
} from "@1ca/ui/components/charts";
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
import { Sparkline } from "@1ca/ui/components/sparkline";
import { StatCard } from "@1ca/ui/components/stat-card";
import { GlassButton } from "@1ca/ui/glassyui/glass-button";
import { formatDate } from "@1ca/ui/lib/format";
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
  categorySlot,
  companySlot,
  enterDelay,
  fmtInt,
  fmtMoney,
  fmtMoneyCompact,
  pctDelta,
  toStatDelta,
} from "./_components";
import { ReportHeader } from "./_report-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Executive overview" };

const KPI_GRID_4 = "grid gap-4 sm:grid-cols-2 xl:grid-cols-4";
const KPI_GRID_5 = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";

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
        slot: companySlot(c.slug),
        href: `/?company=${c.slug}&range=${range.preset}`,
      }));

    const areaSeries = monthly.series.map((s) => ({
      label: s.name,
      slot: companySlot(s.slug),
      points: monthly.months.map((m, i) => ({
        x: m.slice(5),
        y: s.values[i] ?? 0,
      })),
    }));

    // All companies together, month by month, for the revenue card's trend line.
    const monthlyTotals = monthly.months.map((_, i) =>
      monthly.series.reduce((a, s) => a + (s.values[i] ?? 0), 0),
    );

    const totalCategoryRevenue =
      categories.reduce((a, c) => a + c.revenue, 0) || 1;

    return (
      <Page>
        <ReportHeader
          icon={LayoutDashboard}
          eyebrow="All companies"
          title="Executive overview"
          description={`${range.label} · click a company to drill in`}
        />

        <Section title="Overview">
          <div className={KPI_GRID_4}>
            <StatCard
              className="ca-enter"
              style={enterDelay(0)}
              label="Total revenue"
              value={fmtMoney(totals.revenue)}
              icon={DollarSign}
              hint="Invoiced"
              sparkline={
                // The total belongs to no single entity, and every chart slot on
                // this page is already one (companies 1-3, categories 1-8; slot 1
                // is 1CleanAir), so it takes the accent rather than a slot.
                <Sparkline
                  data={monthlyTotals}
                  className="h-full text-ca-accent"
                  label="Revenue, last 12 months"
                />
              }
            />
            <StatCard
              className="ca-enter"
              style={enterDelay(1)}
              label="Invoices"
              value={fmtInt(totals.invoices)}
              icon={Receipt}
            />
            <StatCard
              className="ca-enter"
              style={enterDelay(2)}
              label="New customers"
              value={fmtInt(totals.newCustomers)}
              icon={UserPlus}
            />
            <StatCard
              className="ca-enter"
              style={enterDelay(3)}
              label="Outstanding AR"
              value={fmtMoney(totals.outstandingAr)}
              icon={Wallet}
              hint="Unpaid invoices"
            />
          </div>
        </Section>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card variant="solid" className="lg:col-span-2">
            <CardHeader
              actions={
                // The key sits beside the title as in every chart card. Until the
                // card is wide enough (xl) it stacks into a column, so three
                // company names don't squeeze the title.
                <ChartLegend
                  items={areaSeries}
                  className="max-xl:flex-col max-xl:items-start"
                />
              }
            >
              <CardTitle as="h2">Monthly revenue · by company</CardTitle>
              <CardDescription>Last 12 months · invoiced</CardDescription>
            </CardHeader>
            <CardContent>
              <AreaChart
                ariaLabel="Monthly revenue per company"
                format={fmtMoneyCompact}
                valueFormat={fmtMoney}
                series={areaSeries}
                tableLabel="Monthly revenue per company"
              />
            </CardContent>
          </Card>

          <Card variant="solid">
            <CardHeader>
              <CardTitle as="h2">Revenue split</CardTitle>
              <CardDescription>{range.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <DonutChart
                ariaLabel="Revenue per company"
                centerLabel="Total"
                centerValue={fmtMoneyCompact(totals.revenue)}
                slices={slices}
              />
            </CardContent>
          </Card>
        </div>

        {categories.length > 0 && (
          <Section
            title="Service categories · cross-company"
            description={`Top categories by line-item revenue · ${range.label.toLowerCase()}`}
          >
            <Card variant="solid">
              <CardContent>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
                  {categories.map((c, i) => {
                    const pct = c.revenue / totalCategoryRevenue;
                    return (
                      <li
                        key={c.category}
                        title={`${c.category}: ${fmtMoney(c.revenue)}`}
                      >
                        <RingGauge
                          value={c.revenue}
                          total={totalCategoryRevenue}
                          label={c.category}
                          centerLabel={`${(pct * 100).toFixed(0)}%`}
                          slot={categorySlot(c.category)}
                          delay={i * 60}
                        />
                        <p className="mt-0.5 text-center text-xs font-medium text-ca-text tabular-nums">
                          {fmtMoneyCompact(c.revenue)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </Section>
        )}

        <Section title="Companies" description="Open a company for its own executive view">
          <div className="grid gap-4 md:grid-cols-3">
            {companies.map((c) => (
              <Card
                key={c.slug}
                href={`/?company=${c.slug}&range=${range.preset}`}
              >
                <CardHeader
                  actions={
                    <ArrowUpRight aria-hidden className="size-4 text-ca-muted" />
                  }
                >
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: slotColor(companySlot(c.slug)) }}
                    />
                    {c.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <Metric label="Revenue" value={fmtMoney(c.revenue)} strong />
                    <Metric label="Invoices" value={fmtInt(c.invoices)} strong />
                    <Metric label="Avg invoice" value={fmtMoney(c.avgInvoice)} />
                    <Metric label="Outstanding AR" value={fmtMoney(c.outstandingAr)} />
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      </Page>
    );
  }

  // Specific company → single-company executive view.
  const company = await resolveCompany(sp.company);
  if (!company) {
    // The header keeps the filters, so another company (or all) can be picked.
    return (
      <Page>
        <ReportHeader icon={LayoutDashboard} title="Executive overview" />
        <Card>
          <EmptyState
            titleAs="h2"
            icon={SearchX}
            title="Unknown company"
            description="That company isn't in the dashboard."
            action={
              <GlassButton asChild variant="soft" size="sm" className="ca-control-sm">
                <Link href="/">
                  <ArrowLeft aria-hidden className="size-4" />
                  Back to overview
                </Link>
              </GlassButton>
            }
          />
        </Card>
      </Page>
    );
  }

  const [kpis, monthly, top] = await Promise.all([
    getKpis(company.id, range),
    getMonthlyRevenue(company.id, 12),
    getTopAccounts(company.id, range, 10),
  ]);

  const topRevenue = Math.max(1, ...top.map((row) => row.revenue));

  return (
    <Page>
      <ReportHeader
        icon={LayoutDashboard}
        eyebrow={company.name}
        title="Executive overview"
        description={
          <>
            {range.label} ·{" "}
            {/* The range's UTC calendar days, as date-only strings so formatDate keeps each day. */}
            <span className="tabular-nums">
              {formatDate(range.from.toISOString().slice(0, 10))} →{" "}
              {formatDate(range.to.toISOString().slice(0, 10))}
            </span>
          </>
        }
      />

      <Section title="Overview">
        <div className={KPI_GRID_5}>
          <StatCard
            className="ca-enter"
            style={enterDelay(0)}
            label="Revenue"
            value={fmtMoney(kpis.revenue)}
            delta={toStatDelta(pctDelta(kpis.revenue, kpis.revenuePrev))}
            hint={kpis.revenuePrev === 0 ? undefined : "vs prior period"}
            icon={DollarSign}
            sparkline={
              <Sparkline
                data={monthly.map((m) => m.revenue)}
                // Colour follows the entity: the company's own series colour.
                color={slotColor(companySlot(company.slug))}
                className="h-full"
                label="Revenue, last 12 months"
              />
            }
          />
          <StatCard
            className="ca-enter"
            style={enterDelay(1)}
            label="Invoices"
            value={fmtInt(kpis.invoices)}
            icon={Receipt}
          />
          <StatCard
            className="ca-enter"
            style={enterDelay(2)}
            label="Avg invoice"
            value={fmtMoney(kpis.avgInvoice)}
            icon={DollarSign}
          />
          <StatCard
            className="ca-enter"
            style={enterDelay(3)}
            label="New customers"
            value={fmtInt(kpis.newCustomers)}
            icon={UserPlus}
          />
          <StatCard
            className="ca-enter"
            style={enterDelay(4)}
            label="Outstanding AR"
            value={fmtMoney(kpis.outstandingAr)}
            icon={Wallet}
          />
        </div>
      </Section>

      <Card variant="solid">
        <CardHeader>
          <CardTitle as="h2">Revenue by month</CardTitle>
          <CardDescription>Last 12 months · invoiced</CardDescription>
        </CardHeader>
        <CardContent>
          <AreaChart
            ariaLabel="Monthly revenue"
            format={fmtMoneyCompact}
            valueFormat={fmtMoney}
            tableLabel={`Monthly revenue, ${company.name}`}
            series={[
              {
                label: company.name,
                slot: companySlot(company.slug),
                points: monthly.map((m) => ({ x: m.month.slice(5), y: m.revenue })),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card variant="solid" className="overflow-hidden pb-0">
        <CardHeader>
          <CardTitle as="h2">Top accounts</CardTitle>
          <CardDescription>
            By invoiced revenue · {range.label.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent flush>
          <Table surface="none" label="Top accounts">
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead numeric>Invoices</TableHead>
                <TableHead numeric>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top.length === 0 ? (
                <TableEmpty
                  colSpan={3}
                  icon={Inbox}
                  title="No invoices in this range."
                />
              ) : (
                top.map((row, i) => (
                  <TableRow key={row.smId}>
                    <TableCell className="max-w-[14rem] sm:max-w-md">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="w-5 shrink-0 text-right text-xs text-ca-muted tabular-nums">
                          {i + 1}
                        </span>
                        <span className="truncate font-medium">
                          {row.accountName ?? "—"}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell numeric muted>
                      {fmtInt(row.invoices)}
                    </TableCell>
                    <TableCell numeric className="font-medium">
                      <span className="inline-flex items-center gap-3">
                        <MiniBar
                          value={row.revenue / topRevenue}
                          className="hidden sm:inline-block"
                        />
                        {fmtMoney(row.revenue)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Page>
  );
}

function Metric({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-ca-muted">{label}</dt>
      <dd
        className={
          strong
            ? "mt-0.5 truncate text-lg font-semibold tracking-tight text-ca-text tabular-nums"
            : "mt-0.5 truncate text-sm font-medium text-ca-muted tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  );
}
