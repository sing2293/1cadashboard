import { prisma } from "@/lib/db";

export type OpsKpis = {
  scheduledThisWeek: number;
  completedThisWeek: number;
  cancelledLast30: number;
  cancellationRate: number;
  avgActualHours: number | null;
  avgScheduledHours: number | null;
};

export type TechUtilization = {
  smId: string;
  firstName: string | null;
  lastName: string | null;
  scheduledHours: number;
  actualHours: number;
  appointments: number;
  utilization: number | null;
};

export type DailyAppointments = { day: string; scheduled: number; completed: number };

function startOfWeek(d: Date): Date {
  const out = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const day = out.getUTCDay();
  out.setUTCDate(out.getUTCDate() - day);
  return out;
}

export async function getOpsKpis(companyId: number): Promise<OpsKpis> {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const [scheduled, completed, cancelled, total30, avgs] = await Promise.all([
    prisma.appointment.count({
      where: {
        companyId,
        scheduledStart: { gte: weekStart, lt: weekEnd },
      },
    }),
    prisma.appointment.count({
      where: {
        companyId,
        scheduledStart: { gte: weekStart, lt: weekEnd },
        status: "Complete",
      },
    }),
    prisma.appointment.count({
      where: {
        companyId,
        scheduledStart: { gte: thirtyDaysAgo },
        status: "Cancelled",
      },
    }),
    prisma.appointment.count({
      where: { companyId, scheduledStart: { gte: thirtyDaysAgo } },
    }),
    prisma.appointment.aggregate({
      where: {
        companyId,
        scheduledStart: { gte: thirtyDaysAgo },
      },
      _avg: { actualHours: true, estimatedHours: true },
    }),
  ]);

  return {
    scheduledThisWeek: scheduled,
    completedThisWeek: completed,
    cancelledLast30: cancelled,
    cancellationRate: total30 > 0 ? cancelled / total30 : 0,
    avgActualHours: avgs._avg.actualHours
      ? Number(avgs._avg.actualHours)
      : null,
    avgScheduledHours: avgs._avg.estimatedHours
      ? Number(avgs._avg.estimatedHours)
      : null,
  };
}

export async function getTechUtilization(
  companyId: number,
  daysBack = 30,
): Promise<TechUtilization[]> {
  // The /jobs payload's `techs` field is a comma-separated list of full names
  // ("Alexandre Normand" or "Vanessa Guigue L'Heureux, Chris Lugo"). Split it
  // and credit each tech individually for the appointment + its hours. Jobs
  // with no `techs` value are skipped (they wouldn't represent tech work).
  const rows = await prisma.$queryRaw<
    Array<{
      tech: string;
      scheduledHours: number;
      actualHours: number;
      appointments: number;
    }>
  >`
    SELECT
      TRIM(t.tech) AS tech,
      COALESCE(SUM(a."estimatedHours")::float, 0) AS "scheduledHours",
      COALESCE(SUM(a."actualHours")::float, 0) AS "actualHours",
      COUNT(*)::int AS appointments
    FROM appointments a
    CROSS JOIN LATERAL regexp_split_to_table(
      COALESCE(a."smPayload"->>'techs', ''), ',\s*'
    ) AS t(tech)
    WHERE a."companyId" = ${companyId}
      AND a."scheduledStart" > now() - (${daysBack}::int * interval '1 day')
      AND a."actualHours" IS NOT NULL
      AND TRIM(t.tech) <> ''
    GROUP BY TRIM(t.tech)
    HAVING COUNT(*) > 0
    ORDER BY appointments DESC
    LIMIT 15
  `;
  return rows.map((r) => {
    const parts = r.tech.split(/\s+/);
    return {
      smId: r.tech,
      firstName: parts[0] ?? r.tech,
      lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
      scheduledHours: Number(r.scheduledHours),
      actualHours: Number(r.actualHours),
      appointments: r.appointments,
      utilization:
        r.scheduledHours > 0 ? r.actualHours / r.scheduledHours : null,
    };
  });
}

export async function getDailyAppointments(
  companyId: number,
  daysBack = 30,
): Promise<DailyAppointments[]> {
  const rows = await prisma.$queryRaw<
    Array<{ day: Date; scheduled: bigint; completed: bigint }>
  >`
    SELECT
      date_trunc('day', "scheduledStart") AS day,
      COUNT(*) AS scheduled,
      COUNT(*) FILTER (WHERE status = 'Complete') AS completed
    FROM appointments
    WHERE "companyId" = ${companyId}
      AND "scheduledStart" > now() - (${daysBack}::int * interval '1 day')
    GROUP BY day
    ORDER BY day ASC
  `;
  return rows.map((r) => ({
    day: r.day.toISOString().slice(0, 10),
    scheduled: Number(r.scheduled),
    completed: Number(r.completed),
  }));
}
