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
        status: { in: ["Completed", "Posted"] },
      },
    }),
    prisma.appointment.count({
      where: {
        companyId,
        scheduledStart: { gte: thirtyDaysAgo },
        status: { in: ["Cancelled", "Canceled"] },
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
  return prisma.$queryRaw<TechUtilization[]>`
    WITH appt_techs AS (
      SELECT
        a.id AS appt_id,
        a."actualHours" AS actual,
        a."estimatedHours" AS est,
        (a."smPayload"->>'createdBy') AS sm_user
      FROM appointments a
      WHERE a."companyId" = ${companyId}
        AND a."scheduledStart" > now() - (${daysBack}::int * interval '1 day')
        AND a."actualHours" IS NOT NULL
    )
    SELECT
      e."smId" AS "smId",
      e."firstName" AS "firstName",
      e."lastName" AS "lastName",
      COALESCE(SUM(t.est)::float, 0) AS "scheduledHours",
      COALESCE(SUM(t.actual)::float, 0) AS "actualHours",
      COUNT(t.appt_id)::int AS appointments,
      CASE WHEN COALESCE(SUM(t.est),0) > 0
           THEN (SUM(t.actual)/SUM(t.est))::float
           ELSE NULL END AS utilization
    FROM appt_techs t
    JOIN employees e
      ON e."companyId" = ${companyId}
      AND lower(e."firstName") = lower(t.sm_user)
    WHERE e."isActive" = true
    GROUP BY e."smId", e."firstName", e."lastName"
    HAVING COUNT(t.appt_id) > 0
    ORDER BY appointments DESC
    LIMIT 15
  `;
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
      COUNT(*) FILTER (WHERE status IN ('Completed','Posted')) AS completed
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
