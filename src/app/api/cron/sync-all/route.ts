import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runIncrementalSync, type ResourceSyncer } from "@/lib/sync/runner";
import { accountsSyncer } from "@/lib/sync/resources/accounts";
import { employeesSyncer } from "@/lib/sync/resources/employees";
import { leadsSyncer } from "@/lib/sync/resources/leads";
import { ordersSyncer } from "@/lib/sync/resources/orders";
import { appointmentsSyncer } from "@/lib/sync/resources/appointments";
import { activitiesSyncer } from "@/lib/sync/resources/activities";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SYNCERS = [
  accountsSyncer,
  employeesSyncer,
  leadsSyncer,
  ordersSyncer,
  appointmentsSyncer,
  activitiesSyncer,
];

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return unauthorized();
  }

  const initialCursorIfEmpty = new Date();
  initialCursorIfEmpty.setUTCMonth(initialCursorIfEmpty.getUTCMonth() - 24);

  const companies = await prisma.company.findMany({ where: { isActive: true } });
  const summary: Array<{
    slug: string;
    resource: string;
    seen: number;
    upserted: number;
    durationMs: number;
    error?: string;
  }> = [];

  for (const company of companies) {
    for (const syncer of SYNCERS) {
      try {
        const r = await runIncrementalSync(
          prisma,
          company,
          syncer as ResourceSyncer<unknown>,
          { initialCursorIfEmpty },
        );
        summary.push({
          slug: company.slug,
          resource: syncer.resource,
          seen: r.recordsSeen,
          upserted: r.recordsUpserted,
          durationMs: r.durationMs,
        });
      } catch (err) {
        summary.push({
          slug: company.slug,
          resource: syncer.resource,
          seen: 0,
          upserted: 0,
          durationMs: 0,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return NextResponse.json({
    ok: summary.every((s) => !s.error),
    summary,
  });
}
