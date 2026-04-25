import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runIncrementalSync } from "@/lib/sync/runner";
import { accountsSyncer } from "@/lib/sync/resources/accounts";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SYNCERS = {
  accounts: accountsSyncer,
} as const;

type SyncerName = keyof typeof SYNCERS;

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - n);
  return d;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const resource = url.searchParams.get("resource") as SyncerName | null;
  const backfillMonths = Number(url.searchParams.get("backfillMonths") ?? "24");

  if (!slug || !resource) {
    return NextResponse.json(
      { error: "slug and resource query params are required" },
      { status: 400 },
    );
  }
  const syncer = SYNCERS[resource];
  if (!syncer) {
    return NextResponse.json(
      { error: `unknown resource: ${resource}` },
      { status: 400 },
    );
  }

  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) {
    return NextResponse.json({ error: `unknown company: ${slug}` }, { status: 404 });
  }

  try {
    const result = await runIncrementalSync(prisma, company, syncer, {
      initialCursorIfEmpty: monthsAgo(backfillMonths),
    });
    return NextResponse.json({ ok: true, slug, resource, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
