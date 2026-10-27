import { CircleDollarSign, HandCoins, Truck, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@1ca/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@1ca/ui/components/data-table";
import { Page } from "@1ca/ui/components/page";
import { PageHeader } from "@1ca/ui/components/page-header";
import { Section } from "@1ca/ui/components/section";
import { StatCard } from "@1ca/ui/components/stat-card";
import { StatusPill } from "@1ca/ui/components/status-pill";
import { GlassAlert } from "@1ca/ui/glassyui/glass-alert";
import { formatLongDate, formatNumber, formatPercent, formatWeekdayDate } from "@1ca/ui/lib/format";
import { prisma } from "@/lib/db";
import { addDays, torontoToday } from "@/lib/punches";
import { getTruckDays, summarizeTrucks, type TechIssue, type TruckTech } from "@/lib/queries/trucks";
import { fmtInt, fmtMoney } from "../_components";
import { TruckFilters } from "./_filters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Trucks" };

const ISSUE: Record<TechIssue, string> = {
  unlinked: "Not linked to Mobile Punches",
  "no-hours": "No punches that day",
  "no-rate": "No pay rate",
  incomplete: "Unpaired punch",
};

const margin = (afterPay: number, sales: number) => (sales > 0 ? formatPercent(afterPay / sales, 0) : "—");

export default async function TrucksPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; day?: string }>;
}) {
  const sp = await searchParams;
  const today = torontoToday();
  const day = /^\d{4}-\d{2}-\d{2}$/.test(sp.day ?? "") ? (sp.day as string) : today;

  // ServiceMonster routes, and ServiceTitan's trucks for HVAC.
  const companies = await prisma.company.findMany({
    where: { isActive: true, ...(sp.company ? { slug: sp.company } : {}) },
    select: { id: true },
  });
  const days = await getTruckDays(
    companies.map((c) => c.id),
    addDays(day, -6),
    day,
  );
  const onDay = days.filter((d) => d.day === day);
  const week = summarizeTrucks(days);
  const showCompany = !sp.company;

  const sales = onDay.reduce((s, d) => s + d.sales, 0);
  const pay = onDay.reduce((s, d) => s + d.pay, 0);
  const hours = onDay.reduce((s, d) => s + d.hours, 0);
  const jobs = onDay.reduce((s, d) => s + d.jobs, 0);
  const missing = onDay.reduce((s, d) => s + d.issues, 0);

  return (
    <Page>
      <PageHeader
        icon={Truck}
        title="Trucks"
        description="Each truck’s booked sales for the day, its techs’ pay from Mobile Punches hours, and what’s left after pay."
        sticky
        className="max-md:static"
      >
        <TruckFilters day={day} today={today} />
      </PageHeader>

      {companies.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-ca-muted">No company matches this link. Pick one from the company filter.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {missing > 0 && (
            <GlassAlert tone="warning" title="Some pay isn’t counted yet">
              {fmtInt(missing)} {missing === 1 ? "tech" : "techs"} on {formatLongDate(day)} have no pay counted, so
              those trucks&rsquo; after-pay figures are too high. Set rates and Mobile Punches links on{" "}
              <Link href="/tech-pay" className="ca-link">
                Tech pay
              </Link>
              .
            </GlassAlert>
          )}

          <Section title={formatLongDate(day)}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Booked sales" value={fmtMoney(sales)} icon={CircleDollarSign} hint="Before tax" />
              <StatCard label="Tech pay" value={fmtMoney(pay)} icon={HandCoins} hint={`${formatNumber(hours, 1)} hours worked`} />
              <StatCard
                label="After pay"
                value={fmtMoney(sales - pay)}
                icon={Wallet}
                hint={sales > 0 ? `${margin(sales - pay, sales)} of sales` : "No sales booked"}
              />
              <StatCard label="Trucks out" value={fmtInt(onDay.length)} icon={Truck} hint={`${fmtInt(jobs)} jobs`} />
            </div>
          </Section>

          <Card variant="solid" className="overflow-hidden pb-0">
            <CardHeader>
              <CardTitle as="h2">By truck</CardTitle>
              <CardDescription>Each tech&rsquo;s hours are split across the trucks they worked that day.</CardDescription>
            </CardHeader>
            <CardContent flush>
              <Table surface="none" label="Trucks by day">
                <TableHeader>
                  <TableRow>
                    <TableHead>Truck</TableHead>
                    <TableHead>Techs</TableHead>
                    <TableHead numeric className="hidden sm:table-cell">
                      Jobs
                    </TableHead>
                    <TableHead numeric>Sales</TableHead>
                    <TableHead numeric>Pay</TableHead>
                    <TableHead numeric>After pay</TableHead>
                    <TableHead numeric className="hidden md:table-cell">
                      Margin
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {onDay.length === 0 ? (
                    <TableEmpty
                      colSpan={7}
                      icon={Truck}
                      title="No booked jobs"
                      description={`No truck has a job on ${formatLongDate(day)}.`}
                    />
                  ) : (
                    onDay.map((d) => (
                      <TableRow key={d.key} className="align-top">
                        <TableCell className="font-medium">
                          {d.routeName}
                          {showCompany && <div className="text-xs font-normal text-ca-muted">{d.companyName}</div>}
                        </TableCell>
                        <TableCell>
                          <ul className="flex flex-col gap-1">
                            {d.techs.length === 0 ? (
                              <li className="text-ca-muted">No tech on the jobs</li>
                            ) : (
                              d.techs.map((t) => <TechLine key={t.name} tech={t} />)
                            )}
                          </ul>
                        </TableCell>
                        <TableCell numeric className="hidden sm:table-cell">
                          {fmtInt(d.jobs)}
                        </TableCell>
                        <TableCell numeric>{fmtMoney(d.sales)}</TableCell>
                        <TableCell numeric>{fmtMoney(d.pay)}</TableCell>
                        <TableCell numeric className="font-medium">
                          {fmtMoney(d.afterPay)}
                        </TableCell>
                        <TableCell numeric muted className="hidden md:table-cell">
                          {margin(d.afterPay, d.sales)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card variant="solid" className="overflow-hidden pb-0">
            <CardHeader>
              <CardTitle as="h2">Last 7 days</CardTitle>
              <CardDescription>
                {formatWeekdayDate(addDays(day, -6))} to {formatWeekdayDate(day)}, per truck.
              </CardDescription>
            </CardHeader>
            <CardContent flush>
              <Table surface="none" label="Trucks over the last 7 days">
                <TableHeader>
                  <TableRow>
                    <TableHead>Truck</TableHead>
                    <TableHead numeric className="hidden sm:table-cell">
                      Days out
                    </TableHead>
                    <TableHead numeric className="hidden sm:table-cell">
                      Jobs
                    </TableHead>
                    <TableHead numeric>Sales</TableHead>
                    <TableHead numeric>Pay</TableHead>
                    <TableHead numeric>After pay</TableHead>
                    <TableHead numeric className="hidden md:table-cell">
                      Margin
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {week.length === 0 ? (
                    <TableEmpty colSpan={7} icon={Truck} title="No booked jobs" description="No truck had a job these 7 days." />
                  ) : (
                    week.map((w) => (
                      <TableRow key={w.key}>
                        <TableCell className="font-medium">
                          <span className="inline-flex flex-wrap items-center gap-2">
                            {w.routeName}
                            {w.issues > 0 && (
                              <StatusPill tone="warning" size="sm" title="Tech-days whose pay isn’t counted">
                                {fmtInt(w.issues)} unpaid
                              </StatusPill>
                            )}
                          </span>
                          {showCompany && <div className="text-xs font-normal text-ca-muted">{w.companyName}</div>}
                        </TableCell>
                        <TableCell numeric className="hidden sm:table-cell">
                          {fmtInt(w.days)}
                        </TableCell>
                        <TableCell numeric className="hidden sm:table-cell">
                          {fmtInt(w.jobs)}
                        </TableCell>
                        <TableCell numeric>{fmtMoney(w.sales)}</TableCell>
                        <TableCell numeric>{fmtMoney(w.pay)}</TableCell>
                        <TableCell numeric className="font-medium">
                          {fmtMoney(w.afterPay)}
                        </TableCell>
                        <TableCell numeric muted className="hidden md:table-cell">
                          {margin(w.afterPay, w.sales)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </Page>
  );
}

function TechLine({ tech }: { tech: TruckTech }) {
  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <span>{tech.name}</span>
      {tech.issue && tech.issue !== "incomplete" ? (
        <StatusPill tone="warning" size="sm">
          {ISSUE[tech.issue]}
        </StatusPill>
      ) : (
        <span className="text-xs text-ca-muted tabular-nums">
          {formatNumber(tech.hours ?? 0, 1)} h · {fmtMoney(tech.pay ?? 0)}
          {tech.issue === "incomplete" && ` · ${ISSUE.incomplete.toLowerCase()}`}
        </span>
      )}
    </li>
  );
}
