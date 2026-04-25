import { prisma } from "@/lib/db";
import type { ResolvedRange } from "./range";

export type SalesKpis = {
  newLeads: number;
  newProspects: number;
  newCustomers: number;
  estimateValueOutstanding: number;
  estimateCount: number;
};

export type LeadSourceRow = { source: string; count: number; revenue: number };

export async function getSalesKpis(
  companyId: number,
  range: ResolvedRange,
): Promise<SalesKpis> {
  // Lead.smCreatedAt is populated; account.smCreatedAt isn't (the SM /accounts
  // endpoint doesn't return a creation date). For accounts we proxy with
  // smModifiedAt, which catches new accounts and re-flagged ones.
  const [leads, prospects, customers, estimates] = await Promise.all([
    prisma.lead.count({
      where: {
        companyId,
        smCreatedAt: { gte: range.from, lt: range.to },
      },
    }),
    prisma.account.count({
      where: {
        companyId,
        accountType: "Prospect",
        smModifiedAt: { gte: range.from, lt: range.to },
      },
    }),
    // Customers: count accounts whose first invoice landed in this range.
    prisma.$queryRaw<Array<{ n: number }>>`
      SELECT COUNT(*)::int AS n FROM (
        SELECT o."smAccountId", MIN(o."completedAt") AS first_invoice_at
        FROM orders o
        WHERE o."companyId" = ${companyId}
          AND o."orderType" = 'Invoice'
          AND o."completedAt" IS NOT NULL
        GROUP BY o."smAccountId"
      ) firsts
      WHERE firsts.first_invoice_at >= ${range.from}
        AND firsts.first_invoice_at < ${range.to}
    `,
    // Estimates issued in the range (was all-time before).
    prisma.order.aggregate({
      where: {
        companyId,
        orderType: "Estimate",
        smCreatedAt: { gte: range.from, lt: range.to },
      },
      _sum: { grandTotal: true },
      _count: { _all: true },
    }),
  ]);

  return {
    newLeads: leads,
    newProspects: prospects,
    newCustomers: Array.isArray(customers) ? (customers[0]?.n ?? 0) : 0,
    estimateValueOutstanding: Number(estimates._sum.grandTotal ?? 0),
    estimateCount: estimates._count._all,
  };
}

export async function getLeadSources(
  companyId: number,
  daysBack = 90,
): Promise<LeadSourceRow[]> {
  // Use smModifiedAt as proxy for "new" since smCreatedAt is null on accounts.
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
      AND a."smModifiedAt" > now() - (${daysBack}::int * interval '1 day')
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
