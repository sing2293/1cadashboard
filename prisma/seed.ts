import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const companies = [
  {
    name: "1CleanAir",
    slug: "1cleanair",
    smCompanyId: "fb667c13-75a3-11e9-8c1a-fec578518208",
  },
  { name: "Home Depot", slug: "homedepot", smCompanyId: "" },
  { name: "Enviro Duct", slug: "enviroduct", smCompanyId: "" },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  for (const c of companies) {
    const row = await prisma.company.upsert({
      where: { slug: c.slug },
      create: c,
      update: { name: c.name, smCompanyId: c.smCompanyId },
    });
    console.log(`  ${row.slug.padEnd(11)} id=${row.id} smCompanyId=${row.smCompanyId || "(unset)"}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
