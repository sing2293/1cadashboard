import { prisma } from "@/lib/db";

export async function listCompanies() {
  return prisma.company.findMany({
    where: { isActive: true },
    orderBy: { id: "asc" },
    select: { id: true, slug: true, name: true },
  });
}

export async function resolveCompany(slug?: string) {
  const fallback = "1cleanair";
  const company = await prisma.company.findUnique({
    where: { slug: slug || fallback },
  });
  if (company) return company;
  return prisma.company.findUnique({ where: { slug: fallback } });
}
