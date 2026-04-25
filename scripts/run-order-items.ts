import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { SmClient } from "../src/lib/sm/client";
import { syncOrderItems } from "../src/lib/sync/order-items";

function parseArgs(): { slug: string; force: boolean } {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v ?? "true"];
    }),
  );
  return {
    slug: args.slug ?? "1cleanair",
    force: args.force === "true",
  };
}

async function main() {
  const { slug, force } = parseArgs();
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) throw new Error(`Unknown company: ${slug}`);

  const sm = SmClient.fromEnv(slug);

  console.log(
    `[order-items] ${slug} (companyId=${company.id}) onlyMissing=${!force}`,
  );
  const start = Date.now();
  const result = await syncOrderItems(prisma, sm, company.id, {
    onlyMissing: !force,
  });
  console.log(
    `[order-items] DONE: ${result.ordersScanned} orders scanned, ${result.itemsUpserted} items upserted, ${(
      (Date.now() - start) / 1000
    ).toFixed(1)}s`,
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
