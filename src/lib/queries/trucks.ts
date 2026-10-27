import { prisma } from "@/lib/db";
import { addDays, dayToDate } from "@/lib/punches";
import { cleanName, nameKey, splitTechs } from "@/lib/tech-names";

/**
 * A truck is a ServiceMonster route, or for HVAC a ServiceTitan inventory
 * truck (an appointment rides on the trucks of the technicians assigned to
 * it). For each truck and day:
 * - sales: the booked value of its jobs (every job not cancelled), before
 *   tax. An order's (ServiceTitan: a job's invoice) subtotal is split evenly
 *   over its jobs, so work spread over several visits isn't counted twice.
 *   Estimates and voided orders are not sales and count as 0.
 * - techs: everyone on its jobs that day.
 * - pay: each tech's Mobile Punches hours for the day × the rate in force
 *   that day. A tech on two trucks in one day is split between them by their
 *   scheduled job hours on each.
 */

/** Why a tech's pay is missing or short, which leaves the truck's after-pay figure too high. */
export type TechIssue = "unlinked" | "no-hours" | "no-rate" | "incomplete";

export interface TruckTech {
  name: string;
  techId: number | null;
  /** This truck's share of the tech's worked hours that day. */
  hours: number | null;
  pay: number | null;
  rate: number | null;
  issue: TechIssue | null;
}

export interface TruckDay {
  key: string;
  day: string;
  companyId: number;
  companyName: string;
  routeId: string;
  routeName: string;
  jobs: number;
  sales: number;
  hours: number;
  pay: number;
  afterPay: number;
  techs: TruckTech[];
  /** Techs on the truck whose pay is missing or short. */
  issues: number;
}

export interface TruckSummary {
  key: string;
  companyName: string;
  routeName: string;
  days: number;
  jobs: number;
  sales: number;
  pay: number;
  afterPay: number;
  issues: number;
}

/** One job (or the part of an HVAC appointment on one truck), whatever system it came from. */
type JobRow = {
  companyId: number;
  routeId: string;
  techNames: string[];
  day: string;
  hours: number;
  value: number;
};

/** HVAC appointments whose technicians have no truck in ServiceTitan. */
const NO_TRUCK = "unassigned";

const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** Every truck with a job on a day from `from` to `to` (YYYY-MM-DD, inclusive), newest day first. */
export async function getTruckDays(companyIds: number[], from: string, to: string): Promise<TruckDay[]> {
  if (companyIds.length === 0) return [];
  const start = dayToDate(from);
  const end = dayToDate(addDays(to, 1));

  const companies = await prisma.company.findMany({
    where: { id: { in: companyIds } },
    select: { id: true, name: true, source: true },
  });
  const stIds = companies.filter((c) => c.source === "servicetitan").map((c) => c.id);
  const smIds = companies.filter((c) => c.source !== "servicetitan").map((c) => c.id);
  const jobs = [...(await smJobs(smIds, start, end)), ...(await stJobs(stIds, start, end))];
  if (jobs.length === 0) return [];

  const routes = await prisma.route.findMany({
    where: { companyId: { in: companyIds } },
    select: { companyId: true, smId: true, name: true },
  });
  const routeName = new Map(routes.map((r) => [`${r.companyId}|${r.smId}`, r.name]));
  const companyName = new Map(companies.map((c) => [c.id, c.name]));

  // Each truck-day, with each tech's job hours on it; and each tech's job
  // hours across all trucks that day, to split their worked hours by.
  const trucks = new Map<string, TruckAcc>();
  const dayHours = new Map<string, number>();
  const dayJobs = new Map<string, number>();
  for (const j of jobs) {
    const key = `${j.day}|${j.companyId}|${j.routeId}`;
    let acc = trucks.get(key);
    if (!acc) {
      acc = { day: j.day, companyId: j.companyId, routeId: j.routeId, jobs: 0, sales: 0, techs: new Map() };
      trucks.set(key, acc);
    }
    acc.jobs += 1;
    acc.sales += Number(j.value);
    for (const name of j.techNames) {
      const tk = nameKey(name);
      const t = acc.techs.get(tk) ?? { name, jobHours: 0, jobs: 0 };
      t.jobHours += Number(j.hours);
      t.jobs += 1;
      acc.techs.set(tk, t);
      dayHours.set(`${j.day}|${tk}`, (dayHours.get(`${j.day}|${tk}`) ?? 0) + Number(j.hours));
      dayJobs.set(`${j.day}|${tk}`, (dayJobs.get(`${j.day}|${tk}`) ?? 0) + 1);
    }
  }

  return payTrucks(trucks, dayHours, dayJobs, start, end, (acc) => ({
    companyName: companyName.get(acc.companyId) ?? "",
    routeName:
      acc.routeId === NO_TRUCK
        ? "No truck assigned"
        : (routeName.get(`${acc.companyId}|${acc.routeId}`) ?? "Unnamed route"),
  }));
}

// ServiceMonster: each job names its route and its techs ("Name, Name").
// Its times are local wall-clock stored as UTC (see sm/time.ts), so the
// stored date is the local day.
async function smJobs(companyIds: number[], start: Date, end: Date): Promise<JobRow[]> {
  if (companyIds.length === 0) return [];
  const rows = await prisma.$queryRaw<Array<Omit<JobRow, "techNames"> & { techs: string | null }>>`
    WITH day_jobs AS (
      SELECT a."companyId", a."smOrderId",
             a."smPayload"->>'routeID' AS "routeId",
             a."smPayload"->>'techs' AS techs,
             to_char(a."scheduledStart", 'YYYY-MM-DD') AS day,
             COALESCE(a."estimatedHours", 0)::float AS hours
      FROM appointments a
      WHERE a."companyId" = ANY(${companyIds}::int[])
        AND a."scheduledStart" >= ${start} AND a."scheduledStart" < ${end}
        AND a.status IS DISTINCT FROM 'Cancelled'
        AND a."smPayload"->>'routeID' IS NOT NULL
    ),
    order_jobs AS (
      SELECT a."companyId", a."smOrderId", COUNT(*)::int AS n
      FROM appointments a
      JOIN (SELECT DISTINCT "companyId", "smOrderId" FROM day_jobs) d
        ON d."companyId" = a."companyId" AND d."smOrderId" = a."smOrderId"
      WHERE a.status IS DISTINCT FROM 'Cancelled'
      GROUP BY 1, 2
    )
    SELECT j."companyId", j."routeId", j.techs, j.day, j.hours,
           CASE WHEN o."orderType" IN ('Invoice', 'Work Order')
                THEN COALESCE(o.subtotal, 0)::float / GREATEST(oj.n, 1)
                ELSE 0 END AS value
    FROM day_jobs j
    LEFT JOIN orders o ON o."companyId" = j."companyId" AND o."smId" = j."smOrderId"
    LEFT JOIN order_jobs oj ON oj."companyId" = j."companyId" AND oj."smOrderId" = j."smOrderId"
  `;
  return rows.map(({ techs, ...row }) => ({ ...row, techNames: splitTechs(techs) }));
}

// ServiceTitan (HVAC): an appointment's technicians come from its assignments,
// its truck from each technician's inventory truck, its value from the job's
// invoices, split over the job's appointments. An appointment whose techs sit
// on two trucks is split between them. ServiceTitan times are real UTC, so the
// day is taken in Toronto time.
async function stJobs(companyIds: number[], start: Date, end: Date): Promise<JobRow[]> {
  if (companyIds.length === 0) return [];
  const rows = await prisma.$queryRaw<
    Array<{ companyId: number; day: string; hours: number; value: number; techIds: string[]; techNames: string[] }>
  >`
    WITH day_appts AS (
      SELECT a.id, a."companyId", a."smOrderId" AS "jobId",
             to_char(a."scheduledStart" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Toronto', 'YYYY-MM-DD') AS day,
             COALESCE(a."estimatedHours", 0)::float AS hours
      FROM appointments a
      WHERE a."companyId" = ANY(${companyIds}::int[])
        AND (a."scheduledStart" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Toronto') >= ${start}
        AND (a."scheduledStart" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Toronto') < ${end}
        AND a.status IS DISTINCT FROM 'Cancelled'
    ),
    day_job_ids AS (SELECT DISTINCT "companyId", "jobId" FROM day_appts),
    job_appts AS (
      SELECT a."companyId", a."smOrderId" AS "jobId", COUNT(*)::int AS n
      FROM appointments a
      JOIN day_job_ids d ON d."companyId" = a."companyId" AND d."jobId" = a."smOrderId"
      WHERE a.status IS DISTINCT FROM 'Cancelled'
      GROUP BY 1, 2
    ),
    job_value AS (
      SELECT o."companyId", o."smPayload"->'job'->>'id' AS "jobId", SUM(COALESCE(o.subtotal, 0))::float AS value
      FROM orders o
      JOIN day_job_ids d ON d."companyId" = o."companyId" AND d."jobId" = o."smPayload"->'job'->>'id'
      WHERE o."orderType" IN ('Invoice', 'Work Order')
      GROUP BY 1, 2
    )
    SELECT d."companyId", d.day, d.hours,
           COALESCE(v.value, 0) / GREATEST(n.n, 1) AS value,
           COALESCE(array_agg(e."smId" ORDER BY e."smId") FILTER (WHERE e.id IS NOT NULL), '{}') AS "techIds",
           COALESCE(array_agg(COALESCE(e."smPayload"->>'name', concat_ws(' ', e."firstName", e."lastName")) ORDER BY e."smId")
                    FILTER (WHERE e.id IS NOT NULL), '{}') AS "techNames"
    FROM day_appts d
    LEFT JOIN job_appts n ON n."companyId" = d."companyId" AND n."jobId" = d."jobId"
    LEFT JOIN job_value v ON v."companyId" = d."companyId" AND v."jobId" = d."jobId"
    LEFT JOIN appointment_techs t ON t."appointmentId" = d.id
    LEFT JOIN employees e ON e.id = t."employeeId"
    GROUP BY d.id, d."companyId", d.day, d.hours, v.value, n.n
  `;

  // Each technician's truck: the first active one that lists them.
  const trucks = await prisma.route.findMany({
    where: { companyId: { in: companyIds }, isActive: true },
    select: { companyId: true, smId: true, smPayload: true },
  });
  const truckOf = new Map<string, string>();
  for (const t of trucks) {
    for (const id of (t.smPayload as { technicianIds?: number[] }).technicianIds ?? []) {
      if (!truckOf.has(`${t.companyId}|${id}`)) truckOf.set(`${t.companyId}|${id}`, t.smId);
    }
  }

  return rows.flatMap((r) => {
    const byTruck = new Map<string, string[]>();
    r.techIds.forEach((id, i) => {
      const truck = truckOf.get(`${r.companyId}|${id}`) ?? NO_TRUCK;
      byTruck.set(truck, [...(byTruck.get(truck) ?? []), cleanName(r.techNames[i] ?? "")]);
    });
    if (byTruck.size === 0) byTruck.set(NO_TRUCK, []);
    return [...byTruck].map(([routeId, techNames]) => ({
      companyId: r.companyId,
      routeId,
      techNames: techNames.filter(Boolean),
      day: r.day,
      hours: Number(r.hours),
      value: Number(r.value) / byTruck.size,
    }));
  });
}

type TechOnTruck = { name: string; jobHours: number; jobs: number };
type TruckAcc = { day: string; companyId: number; routeId: string; jobs: number; sales: number; techs: Map<string, TechOnTruck> };

// Each tech's Mobile Punches hours for the day × their rate, split across the
// trucks they were on by their job hours on each.
async function payTrucks(
  trucks: Map<string, TruckAcc>,
  dayHours: Map<string, number>,
  dayJobs: Map<string, number>,
  start: Date,
  end: Date,
  label: (acc: TruckAcc) => { companyName: string; routeName: string },
): Promise<TruckDay[]> {
  const keys = [...new Set([...trucks.values()].flatMap((t) => [...t.techs.keys()]))];
  const techs = await prisma.tech.findMany({
    where: { nameKey: { in: keys } },
    include: { rates: { orderBy: { effectiveFrom: "desc" } } },
  });
  const techByKey = new Map(techs.map((t) => [t.nameKey, t]));
  const employeeIds = techs.flatMap((t) => (t.punchesEmployeeId ? [t.punchesEmployeeId] : []));
  const shifts = await prisma.punchShift.findMany({
    where: { punchesEmployeeId: { in: employeeIds }, date: { gte: start, lt: end } },
  });
  const shiftFor = new Map(shifts.map((s) => [`${ymd(s.date)}|${s.punchesEmployeeId}`, s]));
  const rateOn = (tech: (typeof techs)[number], day: string) => {
    const rate = tech.rates.find((r) => ymd(r.effectiveFrom) <= day);
    return rate ? Number(rate.hourlyRate) : null;
  };

  const result: TruckDay[] = [...trucks.entries()].map(([key, acc]) => {
    const onTruck: TruckTech[] = [...acc.techs.entries()].map(([tk, t]) => {
      const tech = techByKey.get(tk);
      const totalHours = dayHours.get(`${acc.day}|${tk}`) ?? 0;
      const share = totalHours > 0 ? t.jobHours / totalHours : t.jobs / (dayJobs.get(`${acc.day}|${tk}`) ?? 1);
      const base = { name: tech?.name ?? t.name, techId: tech?.id ?? null };
      const rate = tech ? rateOn(tech, acc.day) : null;
      if (!tech?.punchesEmployeeId) return { ...base, hours: null, pay: null, rate, issue: "unlinked" as const };
      const shift = shiftFor.get(`${acc.day}|${tech.punchesEmployeeId}`);
      if (!shift) return { ...base, hours: null, pay: null, rate, issue: "no-hours" as const };
      const hours = Number(shift.workedHours) * share;
      if (rate === null) return { ...base, hours, pay: null, rate, issue: "no-rate" as const };
      return { ...base, hours, pay: hours * rate, rate, issue: shift.incomplete ? ("incomplete" as const) : null };
    });
    onTruck.sort((a, b) => a.name.localeCompare(b.name));
    const pay = onTruck.reduce((sum, t) => sum + (t.pay ?? 0), 0);
    return {
      key,
      day: acc.day,
      companyId: acc.companyId,
      ...label(acc),
      routeId: acc.routeId,
      jobs: acc.jobs,
      sales: acc.sales,
      hours: onTruck.reduce((sum, t) => sum + (t.hours ?? 0), 0),
      pay,
      afterPay: acc.sales - pay,
      techs: onTruck,
      issues: onTruck.filter((t) => t.issue).length,
    };
  });

  return result.sort((a, b) => b.day.localeCompare(a.day) || b.sales - a.sales);
}

/** The truck-days added up per truck, best seller first. */
export function summarizeTrucks(days: TruckDay[]): TruckSummary[] {
  const byTruck = new Map<string, TruckSummary>();
  for (const d of days) {
    const key = `${d.companyId}|${d.routeId}`;
    const s = byTruck.get(key) ?? {
      key,
      companyName: d.companyName,
      routeName: d.routeName,
      days: 0,
      jobs: 0,
      sales: 0,
      pay: 0,
      afterPay: 0,
      issues: 0,
    };
    s.days += 1;
    s.jobs += d.jobs;
    s.sales += d.sales;
    s.pay += d.pay;
    s.afterPay += d.afterPay;
    s.issues += d.issues;
    byTruck.set(key, s);
  }
  return [...byTruck.values()].sort((a, b) => b.sales - a.sales);
}
