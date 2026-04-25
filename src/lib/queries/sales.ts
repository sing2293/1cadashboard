import { prisma } from "@/lib/db";

export type SalesKpis = {
  newLeads30: number;
  newProspects30: number;
  newCustomers30: number;
  estimateValueOutstanding: number;
  estimateCount: number;
};

export type LeadSourceRow = { source: string; count: number; revenue: number };

export async function getSalesKpis(companyId: number): Promise<SalesKpis> {
  const now = new Date();
  const thirty = new Date(now);
  thirty.setUTCDate(thirty.getUTCDate() - 30);

  const [leads, prospects, customers, estimates] = await Promise.all([
    prisma.lead.count({
      where: { companyId, smCreatedAt: { gte: thirty } },
    }),
    prisma.account.count({
      where: { companyId, accountType: "Prospect", smCreatedAt: { gte: thirty } },
    }),
    prisma.account.count({
      where: { companyId, accountType: "Customer", smCreatedAt: { gte: thirty } },
    }),
    prisma.order.aggregate({
      where: { companyId, orderType: "Estimate" },
      _sum: { grandTotal: true },
      _count: { _all: true },
    }),
  ]);

  return {
    newLeads30: leads,
    newProspects30: prospects,
    newCustomers30: customers,
    estimateValueOutstanding: Number(estimates._sum.grandTotal ?? 0),
    estimateCount: estimates._count._all,
  };
}

export async function getLeadSources(
  companyId: number,
  daysBack = 90,
): Promise<LeadSourceRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{ source: string | null; count: bigint; revenue: number | null }>
  >`
    SELECT
      COALESCE(NULLIF(a."leadSource", ''), 'Unknown') AS source,
      COUNT(DISTINCT a."smId") AS count,
      COALESCE(SUM(o."grandTotal")::float, 0) AS revenue
    FROM accounts a
    LEFT JOIN orders o
      ON o."companyId" = a."companyId"
      AND o."smAccountId" = a."smId"
      AND o."orderType" = 'Invoice'
    WHERE a."companyId" = ${companyId}
      AND a."smCreatedAt" > now() - (${daysBack}::int * interval '1 day')
    GROUP BY source
    ORDER BY count DESC
    LIMIT 12
  `;
  return rows.map((r) => ({
    source: r.source ?? "Unknown",
    count: Number(r.count),
    revenue: Number(r.revenue ?? 0),
  }));
}
