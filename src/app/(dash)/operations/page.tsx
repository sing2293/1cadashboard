import {
  CalendarCheck,
  CircleCheck,
  CircleX,
  Clock,
  Timer,
  Users,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@1ca/ui/components/card";
import { BarChart, ChartLegend, MiniBar } from "@1ca/ui/components/charts";
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
import { Section } from "@1ca/ui/components/section";
import { StatCard } from "@1ca/ui/components/stat-card";
import { formatDate } from "@1ca/ui/lib/format";
import { resolveCompany } from "@/lib/queries/company";
import { parseRange } from "@/lib/queries/range";
import {
  getDailyAppointments,
  getOpsKpis,
  getTechUtilization,
} from "@/lib/queries/operations";
import { enterDelay, fmtInt, fmtPct } from "../_components";
import { NoCompanyPage, ReportHeader } from "../_report-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Operations" };

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; range?: string }>;
}) {
  const sp = await searchParams;
  const company = await resolveCompany(sp.company);
  if (!company) return <NoCompanyPage icon={Wrench} title="Operations" />;

  const range = parseRange(sp.range);
  const [kpis, techs, daily] = await Promise.all([
    getOpsKpis(company.id, range),
    getTechUtilization(company.id, range.days),
    getDailyAppointments(company.id, range.days),
  ]);

  return (
    <Page>
      <ReportHeader
        icon={Wrench}
        eyebrow={company.name}
        title="Operations"
        description={`Appointments + tech utilization · ${range.label.toLowerCase()}`}
      />

      <Section title="Overview">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            className="ca-enter"
            style={enterDelay(0)}
            label="Scheduled"
            value={fmtInt(kpis.scheduled)}
            icon={CalendarCheck}
          />
          <StatCard
            className="ca-enter"
            style={enterDelay(1)}
            label="Completed"
            value={fmtInt(kpis.completed)}
            icon={CircleCheck}
          />
          <StatCard
            className="ca-enter"
            style={enterDelay(2)}
            label="Cancelled"
            value={fmtInt(kpis.cancelled)}
            hint={`${fmtPct(kpis.cancellationRate)} of scheduled`}
            icon={CircleX}
          />
          <StatCard
            className="ca-enter"
            style={enterDelay(3)}
            label="Avg actual hrs"
            value={
              kpis.avgActualHours !== null
                ? kpis.avgActualHours.toFixed(2)
                : "—"
            }
            icon={Timer}
          />
          <StatCard
            className="ca-enter"
            style={enterDelay(4)}
            label="Avg scheduled hrs"
            value={
              kpis.avgScheduledHours !== null
                ? kpis.avgScheduledHours.toFixed(2)
                : "—"
            }
            icon={Clock}
          />
        </div>
      </Section>

      <Card variant="solid">
        <CardHeader actions={<ChartLegend items={[{ label: "Scheduled", slot: 1 }]} />}>
          <CardTitle as="h2">Appointments per day</CardTitle>
          <CardDescription>{range.label}</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            ariaLabel="Daily appointments"
            slot={1}
            format={fmtInt}
            tableLabel="Appointments per day"
            xLabel="Day"
            data={daily.map((d) => ({
              label: d.day.slice(5),
              value: d.scheduled,
              tooltip: `${formatDate(d.day)}: ${fmtInt(d.scheduled)} scheduled, ${fmtInt(d.completed)} completed`,
            }))}
          />
        </CardContent>
      </Card>

      <Card variant="solid" className="overflow-hidden pb-0">
        <CardHeader>
          <CardTitle as="h2">Tech utilization</CardTitle>
          <CardDescription>
            Top performers · {range.label.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent flush>
          <Table surface="none" label="Tech utilization" className="min-w-[36rem]">
            <TableHeader>
              <TableRow>
                <TableHead>Technician</TableHead>
                <TableHead numeric>Appointments</TableHead>
                <TableHead numeric>Sched. hrs</TableHead>
                <TableHead numeric>Actual hrs</TableHead>
                <TableHead numeric>Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {techs.length === 0 ? (
                <TableEmpty
                  colSpan={5}
                  icon={Users}
                  title="No tech-tagged appointments in this range."
                />
              ) : (
                techs.map((t) => (
                  <TableRow key={t.smId}>
                    <TableCell className="font-medium">
                      {[t.firstName, t.lastName].filter(Boolean).join(" ") ||
                        "—"}
                    </TableCell>
                    <TableCell numeric>{fmtInt(t.appointments)}</TableCell>
                    <TableCell numeric muted>
                      {t.scheduledHours.toFixed(1)}
                    </TableCell>
                    <TableCell numeric muted>
                      {t.actualHours.toFixed(1)}
                    </TableCell>
                    <TableCell numeric className="font-medium">
                      <span className="inline-flex items-center gap-3">
                        {t.utilization !== null ? (
                          <MiniBar value={t.utilization} />
                        ) : null}
                        <span className="w-12">
                          {t.utilization !== null ? fmtPct(t.utilization) : "—"}
                        </span>
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
