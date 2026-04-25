import { resolveCompany } from "@/lib/queries/company";
import { parseRange } from "@/lib/queries/range";
import {
  getDailyAppointments,
  getOpsKpis,
  getTechUtilization,
} from "@/lib/queries/operations";
import {
  fmtInt,
  fmtPct,
  KpiCard,
  Section,
  BarChart,
  PageHeader,
} from "../_components";

export const dynamic = "force-dynamic";

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; range?: string }>;
}) {
  const sp = await searchParams;
  const company = await resolveCompany(sp.company);
  if (!company) return <main className="p-10">No company seeded.</main>;

  const range = parseRange(sp.range);
  const [kpis, techs, daily] = await Promise.all([
    getOpsKpis(company.id, range),
    getTechUtilization(company.id, range.days),
    getDailyAppointments(company.id, range.days),
  ]);

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title={`${company.name} · Operations`}
          subtitle={`Appointments + tech utilization · ${range.label.toLowerCase()}`}
        />

        <section className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard
            label="Scheduled"
            value={fmtInt(kpis.scheduled)}
            tone="indigo"
            delay={0}
          />
          <KpiCard
            label="Completed"
            value={fmtInt(kpis.completed)}
            tone="emerald"
            delay={60}
          />
          <KpiCard
            label="Cancelled"
            value={fmtInt(kpis.cancelled)}
            hint={`${fmtPct(kpis.cancellationRate)} of scheduled`}
            tone="rose"
            delay={120}
          />
          <KpiCard
            label="Avg actual hrs"
            value={
              kpis.avgActualHours !== null
                ? kpis.avgActualHours.toFixed(2)
                : "—"
            }
            tone="sky"
            delay={180}
          />
          <KpiCard
            label="Avg scheduled hrs"
            value={
              kpis.avgScheduledHours !== null
                ? kpis.avgScheduledHours.toFixed(2)
                : "—"
            }
            tone="violet"
            delay={240}
          />
        </section>

        <Section
          title="Appointments per day"
          subtitle={range.label}
        >
          <BarChart
            ariaLabel="Daily appointments"
            tone="indigo"
            format={fmtInt}
            data={daily.map((d) => ({
              label: d.day.slice(5),
              value: d.scheduled,
              tooltip: `${d.day}: ${d.scheduled} scheduled, ${d.completed} completed`,
            }))}
          />
        </Section>

        <Section
          title="Tech utilization"
          subtitle={`Top performers · ${range.label.toLowerCase()}`}
          padded={false}
        >
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="text-left text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-50/60 dark:bg-zinc-900/40">
              <tr>
                <th className="px-6 py-2.5 font-medium">Technician</th>
                <th className="px-6 py-2.5 font-medium text-right">Appointments</th>
                <th className="px-6 py-2.5 font-medium text-right">Sched. hrs</th>
                <th className="px-6 py-2.5 font-medium text-right">Actual hrs</th>
                <th className="px-6 py-2.5 font-medium text-right">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {techs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-zinc-500 text-center">
                    No tech-tagged appointments in this range.
                  </td>
                </tr>
              ) : (
                techs.map((t) => (
                  <tr
                    key={t.smId}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-6 py-2.5 text-zinc-900 dark:text-zinc-100">
                      {[t.firstName, t.lastName].filter(Boolean).join(" ") ||
                        "—"}
                    </td>
                    <td className="px-6 py-2.5 text-right tabular-nums">
                      {fmtInt(t.appointments)}
                    </td>
                    <td className="px-6 py-2.5 text-right tabular-nums">
                      {t.scheduledHours.toFixed(1)}
                    </td>
                    <td className="px-6 py-2.5 text-right tabular-nums">
                      {t.actualHours.toFixed(1)}
                    </td>
                    <td className="px-6 py-2.5 text-right font-medium tabular-nums">
                      {t.utilization !== null ? fmtPct(t.utilization) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </Section>
      </div>
    </main>
  );
}
