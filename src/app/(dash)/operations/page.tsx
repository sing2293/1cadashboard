import { resolveCompany } from "@/lib/queries/company";
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
} from "../_components";

export const dynamic = "force-dynamic";

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const { company: slug } = await searchParams;
  const company = await resolveCompany(slug);
  if (!company) return <main className="p-10">No company seeded.</main>;

  const [kpis, techs, daily] = await Promise.all([
    getOpsKpis(company.id),
    getTechUtilization(company.id, 30),
    getDailyAppointments(company.id, 30),
  ]);

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {company.name} · Operations
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          This week & last 30 days
        </p>

        <section className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard
            label="Scheduled this week"
            value={fmtInt(kpis.scheduledThisWeek)}
          />
          <KpiCard
            label="Completed this week"
            value={fmtInt(kpis.completedThisWeek)}
          />
          <KpiCard
            label="Cancelled (30d)"
            value={fmtInt(kpis.cancelledLast30)}
            hint={`${fmtPct(kpis.cancellationRate)} of scheduled`}
          />
          <KpiCard
            label="Avg actual hrs"
            value={
              kpis.avgActualHours !== null
                ? kpis.avgActualHours.toFixed(2)
                : "—"
            }
          />
          <KpiCard
            label="Avg scheduled hrs"
            value={
              kpis.avgScheduledHours !== null
                ? kpis.avgScheduledHours.toFixed(2)
                : "—"
            }
          />
        </section>

        <Section title="Appointments per day (last 30 days)">
          <BarChart
            ariaLabel="Daily appointments"
            format={fmtInt}
            data={daily.map((d) => ({
              label: d.day.slice(5),
              value: d.scheduled,
              tooltip: `${d.day}: ${d.scheduled} scheduled, ${d.completed} completed`,
            }))}
          />
        </Section>

        <Section title="Tech utilization (last 30 days)" padded={false}>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-2 py-2">Technician</th>
                <th className="px-2 py-2 text-right">Appointments</th>
                <th className="px-2 py-2 text-right">Sched. hrs</th>
                <th className="px-2 py-2 text-right">Actual hrs</th>
                <th className="px-2 py-2 text-right">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {techs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-zinc-500">
                    No tech-tagged appointments in the last 30 days.
                  </td>
                </tr>
              ) : (
                techs.map((t) => (
                  <tr key={t.smId}>
                    <td className="px-2 py-2 text-zinc-900 dark:text-zinc-100">
                      {[t.firstName, t.lastName].filter(Boolean).join(" ") ||
                        "—"}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {fmtInt(t.appointments)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {t.scheduledHours.toFixed(1)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {t.actualHours.toFixed(1)}
                    </td>
                    <td className="px-2 py-2 text-right font-medium">
                      {t.utilization !== null ? fmtPct(t.utilization) : "—"}
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
