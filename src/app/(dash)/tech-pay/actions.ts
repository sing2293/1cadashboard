"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canSeePay } from "@/lib/hub-access";
import { dayToDate, refreshTechs, syncPunches } from "@/lib/punches";
import { runIncrementalSync } from "@/lib/sync/runner";
import { routesSyncer } from "@/lib/sync/resources/routes";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

// proxy.ts guards /tech-pay too; actions check again, since they can be called directly.
async function payUser(): Promise<string | null> {
  const { userId, sessionClaims } = await auth();
  return userId && canSeePay(sessionClaims?.metadata) ? userId : null;
}

const DENIED: ActionResult = { ok: false, error: "You don’t have access to tech pay." };

function revalidate() {
  revalidatePath("/tech-pay");
  revalidatePath("/trucks");
}

/** Sets a tech's hourly rate from a day on; the same day again replaces it. */
export async function setRate(techId: number, hourlyRate: number, effectiveFrom: string): Promise<ActionResult> {
  const userId = await payUser();
  if (!userId) return DENIED;
  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0 || hourlyRate >= 1000) {
    return { ok: false, error: "Enter an hourly rate between $0 and $1,000." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) return { ok: false, error: "Pick the day the rate starts." };

  const rate = Math.round(hourlyRate * 100) / 100;
  const date = dayToDate(effectiveFrom);
  await prisma.techPayRate.upsert({
    where: { techId_effectiveFrom: { techId, effectiveFrom: date } },
    create: { techId, hourlyRate: rate, effectiveFrom: date, createdBy: userId },
    update: { hourlyRate: rate, createdBy: userId },
  });
  revalidate();
  return { ok: true };
}

/** Takes a tech's hours from this Mobile Punches employee, or from no one (null). */
export async function linkPunches(techId: number, employeeId: string | null): Promise<ActionResult> {
  if (!(await payUser())) return DENIED;
  if (employeeId) {
    const holder = await prisma.tech.findUnique({ where: { punchesEmployeeId: employeeId }, select: { id: true, name: true } });
    if (holder && holder.id !== techId) {
      return { ok: false, error: `That employee is already linked to ${holder.name}. Unlink them there first.` };
    }
  }
  await prisma.tech.update({
    where: { id: techId },
    data: { punchesEmployeeId: employeeId, punchesLinkedBy: employeeId ? "manual" : null },
  });
  revalidate();
  return { ok: true };
}

/**
 * What the 4-hourly sync does for this page, on demand: ServiceMonster's route
 * names, Mobile Punches' employees and recent hours, and the techs on recent jobs.
 */
export async function refreshFromSources(): Promise<ActionResult> {
  if (!(await payUser())) return DENIED;

  // Each step runs on its own, so one source being down doesn't hold up the others.
  const done: string[] = [];
  const failed: string[] = [];
  const step = async (label: string, run: () => Promise<string>) => {
    try {
      done.push(await run());
    } catch (e) {
      // API errors can carry a whole stack trace; the first line says enough.
      const message = e instanceof Error ? e.message.split(/[{\n]/)[0].trim() : "it didn’t finish";
      failed.push(`${label}: ${message.slice(0, 160)}`);
    }
  };

  await step("ServiceMonster truck names", async () => {
    const companies = await prisma.company.findMany({ where: { isActive: true, source: "servicemonster" } });
    let routes = 0;
    for (const company of companies) {
      const r = await runIncrementalSync(prisma, company, routesSyncer, { initialCursorIfEmpty: new Date(0) });
      routes += r.recordsUpserted;
    }
    return `${routes} trucks`;
  });
  await step("Mobile Punches hours", async () => `${(await syncPunches(prisma)).shifts} shifts`);
  await step("Techs on recent jobs", async () => {
    const techs = await refreshTechs(prisma);
    return `${techs.techs} techs${techs.linked ? `, ${techs.linked} newly linked` : ""}`;
  });

  revalidate();
  if (failed.length === 0) return { ok: true, message: `Updated: ${done.join(", ")}` };
  return { ok: false, error: `${failed.join(" · ")}${done.length ? ` (updated: ${done.join(", ")})` : ""}` };
}
