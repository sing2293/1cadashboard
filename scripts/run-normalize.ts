import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalizeAllItems } from "../src/lib/sync/normalize";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const companies = await prisma.company.findMany({
    where: { isActive: true },
    orderBy: { id: "asc" },
  });
  for (const c of companies) {
    const start = Date.now();
    const r = await normalizeAllItems(prisma, c.id);
    console.log(
      `[normalize] ${c.slug}: updated=${r.updated}, unmapped=${r.unmapped} (${(
        (Date.now() - start) /
        1000
      ).toFixed(1)}s)`,
    );
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
