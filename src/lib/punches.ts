import type { PrismaClient } from "@prisma/client";
import { cleanName, nameKey, splitTechs } from "@/lib/tech-names";

/**
 * Mobile Punches (time.1cleanair.info) holds each tech's clock-ins. Its export
 * API gives worked hours per employee per local day; a key from its API keys
 * page goes in PUNCHES_KEY.
 */
const PUNCHES_URL = (process.env.PUNCHES_URL || "https://time.1cleanair.info").replace(/\/+$/, "");

type ExportBody<T> = { count: number; data: T[]; error?: string };

type PunchesEmployeeRow = { employee_id: string; employee: string | null; last_punch_at: string | null };

type PunchesShiftRow = {
  date: string;
  employee_id: string;
  employee: string | null;
  worked_hours: number;
  flags: string[];
};

async function punchesGet<T>(path: string, params: Record<string, string> = {}): Promise<T[]> {
  const key = process.env.PUNCHES_KEY;
  if (!key) throw new Error("PUNCHES_KEY is not set");
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${PUNCHES_URL}${path}${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as ExportBody<T> | null;
  if (!res.ok || !body) {
    throw new Error(`Mobile Punches answered ${res.status}${body?.error ? `: ${body.error}` : ""}`);
  }
  return body.data;
}

/** Today's date in Toronto, as YYYY-MM-DD: the day Mobile Punches files shifts under. */
export function torontoToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(now);
}

/** A YYYY-MM-DD day as the Date Prisma stores in a @db.Date column. */
export function dayToDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

export function addDays(day: string, n: number): string {
  const d = dayToDate(day);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Pulls the employee list and the last `days` days of shifts. Each run replaces
 * the shifts inside its window, so a punch fixed in Mobile Punches afterwards
 * comes through. With no shifts stored yet it backfills `backfillDays`.
 */
export async function syncPunches(
  prisma: PrismaClient,
  { days = 14, backfillDays = 120 }: { days?: number; backfillDays?: number } = {},
): Promise<{ employees: number; shifts: number; from: string; to: string }> {
  const employees = await punchesGet<PunchesEmployeeRow>("/api/v1/export/employees");
  for (const e of employees) {
    const name = cleanName(e.employee ?? "") || e.employee_id;
    const lastPunchAt = e.last_punch_at ? new Date(e.last_punch_at) : null;
    await prisma.punchEmployee.upsert({
      where: { id: e.employee_id },
      create: { id: e.employee_id, name, lastPunchAt },
      update: { name, lastPunchAt, syncedAt: new Date() },
    });
  }

  const empty = (await prisma.punchShift.count()) === 0;
  const to = torontoToday();
  const from = addDays(to, -((empty ? backfillDays : days) - 1));
  const shifts = await punchesGet<PunchesShiftRow>("/api/v1/export/shifts", { from, to });
  const known = new Set(employees.map((e) => e.employee_id));

  await prisma.$transaction([
    prisma.punchShift.deleteMany({ where: { date: { gte: dayToDate(from), lte: dayToDate(to) } } }),
    prisma.punchShift.createMany({
      data: shifts
        .filter((s) => known.has(s.employee_id))
        .map((s) => ({
          punchesEmployeeId: s.employee_id,
          date: dayToDate(s.date),
          workedHours: s.worked_hours,
          incomplete: s.flags.length > 0,
        })),
      skipDuplicates: true,
    }),
  ]);

  return { employees: employees.length, shifts: shifts.length, from, to };
}

/**
 * Every name on a ServiceMonster job, and every technician assigned to a
 * ServiceTitan (HVAC) appointment, in the last 180 days becomes a Tech, keyed
 * by its folded name. A tech with no Mobile Punches employee yet is linked to
 * the one employee whose name folds the same; anything less certain waits for
 * someone to pick on the Tech pay page.
 */
export async function refreshTechs(prisma: PrismaClient): Promise<{ techs: number; linked: number }> {
  const rows = await prisma.$queryRaw<Array<{ techs: string; lastSeen: Date }>>`
    SELECT a."smPayload"->>'techs' AS techs, MAX(a."scheduledStart") AS "lastSeen"
    FROM appointments a
    JOIN companies c ON c.id = a."companyId" AND c.source = 'servicemonster'
    WHERE a."scheduledStart" > now() - interval '180 days'
      AND COALESCE(a."smPayload"->>'techs', '') <> ''
    GROUP BY 1
  `;
  const hvac = await prisma.$queryRaw<Array<{ techs: string; lastSeen: Date }>>`
    SELECT COALESCE(e."smPayload"->>'name', concat_ws(' ', e."firstName", e."lastName")) AS techs,
           MAX(a."scheduledStart") AS "lastSeen"
    FROM appointment_techs t
    JOIN appointments a ON a.id = t."appointmentId"
    JOIN employees e ON e.id = t."employeeId"
    JOIN companies c ON c.id = a."companyId" AND c.source = 'servicetitan'
    WHERE a."scheduledStart" > now() - interval '180 days'
    GROUP BY 1
  `;

  // The newest spelling of each folded name wins.
  const seen = new Map<string, { name: string; lastSeen: Date }>();
  for (const row of [...rows, ...hvac]) {
    for (const name of splitTechs(row.techs)) {
      const key = nameKey(name);
      const prev = seen.get(key);
      if (!prev || row.lastSeen > prev.lastSeen) seen.set(key, { name, lastSeen: row.lastSeen });
    }
  }

  const employees = await prisma.punchEmployee.findMany({ select: { id: true, name: true } });
  const byKey = new Map<string, string[]>();
  for (const e of employees) {
    const key = nameKey(e.name);
    byKey.set(key, [...(byKey.get(key) ?? []), e.id]);
  }
  const taken = new Set(
    (await prisma.tech.findMany({ where: { punchesEmployeeId: { not: null } }, select: { punchesEmployeeId: true } }))
      .map((t) => t.punchesEmployeeId as string),
  );

  let linked = 0;
  for (const [key, { name, lastSeen }] of seen) {
    const lastSeenOn = dayToDate(lastSeen.toISOString().slice(0, 10));
    const tech = await prisma.tech.upsert({
      where: { nameKey: key },
      create: { name, nameKey: key, lastSeenOn },
      update: { name, lastSeenOn },
    });
    const match = byKey.get(key);
    if (!tech.punchesEmployeeId && match?.length === 1 && !taken.has(match[0])) {
      await prisma.tech.update({
        where: { id: tech.id },
        data: { punchesEmployeeId: match[0], punchesLinkedBy: "auto" },
      });
      taken.add(match[0]);
      linked++;
    }
  }

  return { techs: seen.size, linked };
}
