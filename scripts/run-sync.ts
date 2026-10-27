import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { runIncrementalSync } from "../src/lib/sync/runner";
import { syncersFor } from "../src/lib/sync/syncers";

// .env.local first, then .env, as Next.js reads them: the ServiceTitan keys
// sit in .env.local beside the Clerk keys.
config({ path: [".env.local", ".env"] });

function parseArgs(): { slug: string; resource: string; backfillMonths: number } {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v ?? "true"];
    }),
  );
  const slug = args.slug ?? "1cleanair";
  const resource = args.resource ?? "accounts";
  const backfillMonths = Number(args.backfillMonths ?? "24");
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

  const syncers = syncersFor(company);
  const syncer = syncers[resource];
  if (!syncer) {
    throw new Error(
      `Unknown resource for ${slug}: ${resource} (one of ${Object.keys(syncers).join(", ")})`,
    );
  }

  console.log(
    `[sync] ${resource} for ${slug} (companyId=${company.id}), backfill=${backfillMonths} months`,
  );

  const result = await runIncrementalSync(prisma, company, syncer, {
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
