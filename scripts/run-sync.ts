import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { runIncrementalSync } from "../src/lib/sync/runner";
import { accountsSyncer } from "../src/lib/sync/resources/accounts";

const SYNCERS = {
  accounts: accountsSyncer,
} as const;

function parseArgs(): { slug: string; resource: keyof typeof SYNCERS; backfillMonths: number } {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v ?? "true"];
    }),
  );
  const slug = args.slug ?? "1cleanair";
  const resource = (args.resource ?? "accounts") as keyof typeof SYNCERS;
  const backfillMonths = Number(args.backfillMonths ?? "24");
  if (!SYNCERS[resource]) throw new Error(`Unknown resource: ${resource}`);
  return { slug, resource, backfillMonths };
}

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - n);
  return d;
}

async function main() {
  const { slug, resource, backfillMonths } = parseArgs();
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) throw new Error(`Unknown company slug: ${slug}`);

  console.log(
    `[sync] ${resource} for ${slug} (companyId=${company.id}), backfill=${backfillMonths} months`,
  );

  const result = await runIncrementalSync(prisma, company, SYNCERS[resource], {
    initialCursorIfEmpty: monthsAgo(backfillMonths),
  });

  console.log("\n[sync] DONE");
  console.log(`  syncRunId:       ${result.syncRunId}`);
  console.log(`  recordsSeen:     ${result.recordsSeen}`);
  console.log(`  recordsUpserted: ${result.recordsUpserted}`);
  console.log(`  newCursor:       ${result.newCursor.toISOString()}`);
  console.log(`  duration:        ${(result.durationMs / 1000).toFixed(1)}s`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
