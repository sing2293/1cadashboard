import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runIncrementalSync } from "@/lib/sync/runner";
import { syncersFor } from "@/lib/sync/syncers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
    for (const syncer of Object.values(syncersFor(company))) {
      try {
        const r = await runIncrementalSync(prisma, company, syncer, {
          initialCursorIfEmpty,
        });
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
