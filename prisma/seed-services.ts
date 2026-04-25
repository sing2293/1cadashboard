import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Initial seed for the service catalog. Categories are derived from the top-
 * revenue items observed in real 1CleanAir/HD/Enviro data; aliases match the
 * raw item names verbatim (case-insensitive). Anuj should review and extend
 * this list — see /admin/sync once the dashboard is running for top unmapped
 * names per company.
 */

type SeedEntry = {
  canonicalName: string;
  category: string;
  aliases: string[];
};

const CATALOG: SeedEntry[] = [
  {
    canonicalName: "Air Duct Cleaning - Residential",
    category: "duct",
    aliases: [
      "Seasonal Standard Duct Package - 10 vents included",
      "Standard Duct Package - 10 vents included",
      "MTL Standard Duct Package - 10 vents included",
      "Essential Duct Cleaning (10 vents included)",
      "Essential Duct Cleaning (20 vents included)",
      "Air Duct Cleaning 10 Vents",
      "Air Duct Cleaning - One System",
      "Extra Vents ($15 each)",
      "Extra Vents",
      "Other / Autre (Duct)",
      "1CA Condo/Apartment building package - 10 vents",
      "HD Duct cleaning package",
      "QC Standard Duct Package - 10 vents included",
    ],
  },
  {
    canonicalName: "Air Duct Cleaning - Commercial",
    category: "duct",
    aliases: [
      "Commercial duct cleaning",
      "Nettoyage commercial de conduits d'air",
      "Duct Cleaning - Contractor Special",
      "Commercial Combustible Dust Cleaning",
    ],
  },
  {
    canonicalName: "Dryer Vent Cleaning - Residential",
    category: "dryer-vent",
    aliases: [
      "WITH DC Dryer vent 1st floor or basement",
      "Dryer Vent Cleaning (Only) Basement/MainFloor",
      "Dryer Vent - Basement/1st Floor (With Duct Cleaning)",
      "Dryer vent repair/Réparation du conduit de sécheuse",
    ],
  },
  {
    canonicalName: "Dryer Vent Cleaning - Commercial",
    category: "dryer-vent",
    aliases: [
      "Commercial Dryer Vent Cleaning - Exterior",
      "Commercial Dryer Vent Cleaning",
      "Commercial dryer duct cleanings",
      "Nettoyage Commercial de Conduits de Sécheuse - Extérieur",
    ],
  },
  {
    canonicalName: "Carpet Cleaning - Residential",
    category: "carpet",
    aliases: [
      "1-3 Rooms carpet cleaning",
      "1-3 Rooms Carpet",
      "Extra Room carpet cleaning",
      "Stairs carpet cleaning ($4 per step)",
      "Stairs carpet cleaning (minimum fee)",
      "Area rug cleaning (at shop)",
    ],
  },
  {
    canonicalName: "Carpet Cleaning - Commercial",
    category: "carpet",
    aliases: ["Commercial carpet cleaning"],
  },
  {
    canonicalName: "Upholstery Cleaning",
    category: "upholstery",
    aliases: ["Upholstery Cleaning"],
  },
  {
    canonicalName: "Furnace & A/C Coil Cleaning",
    category: "hvac",
    aliases: [
      "Furnace blower compartment cleaning",
      "Furnace blower compartment and A/C evaporator coil cleaning",
      "A/C evaporator coil cleaning",
      "A/C coil cleaning",
      "A/C Wall Mount Cleaning",
      "HVAC | CVAC",
    ],
  },
  {
    canonicalName: "HRV / Air Exchanger Cleaning",
    category: "hvac",
    aliases: ["Air exchanger cleaning (HRV) / Nettoyage de l'échangeur d'air"],
  },
  {
    canonicalName: "Aeroseal Duct Sealing",
    category: "sealing",
    aliases: ["AEROSEAL© - Residential Duct Sealing"],
  },
  {
    canonicalName: "Sanitization",
    category: "sanitization",
    aliases: ["Benefect"],
  },
  {
    canonicalName: "Insulation",
    category: "insulation",
    aliases: [
      "Insulation top up",
      "Insulation Installation",
      "Insulation Removal",
    ],
  },
  {
    canonicalName: "Repair / Materials",
    category: "repair",
    aliases: ["Replacing various fire dampers", "Additional Metal cover"],
  },
  {
    canonicalName: "Promotion / Discount",
    category: "discount",
    aliases: ["Seasonal Promotion"],
  },
  {
    canonicalName: "Management Fee",
    category: "fee",
    aliases: ["Management fees", "Other fee", "Other / Autre"],
  },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  for (const entry of CATALOG) {
    const service = await prisma.serviceCatalog.upsert({
      where: { canonicalName: entry.canonicalName },
      create: { canonicalName: entry.canonicalName, category: entry.category },
      update: { category: entry.category, isActive: true },
    });

    for (const alias of entry.aliases) {
      // Postgres treats (aliasName, NULL) as distinct for unique constraints,
      // so we can't rely on Prisma's compound-key upsert here.
      const existing = await prisma.serviceAlias.findFirst({
        where: { aliasName: alias, companyId: null },
      });
      if (existing) {
        if (existing.serviceId !== service.id) {
          await prisma.serviceAlias.update({
            where: { id: existing.id },
            data: { serviceId: service.id },
          });
        }
      } else {
        await prisma.serviceAlias.create({
          data: { aliasName: alias, companyId: null, serviceId: service.id },
        });
      }
    }
    console.log(
      `  ${entry.category.padEnd(14)} ${entry.canonicalName} (+${entry.aliases.length} aliases)`,
    );
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
