import { prisma } from "@/lib/db";
import type { ResolvedRange } from "./range";

export type CompanyOverview = {
  companyId: number;
  slug: string;
  name: string;
  revenue: number;
  invoices: number;
  avgInvoice: number;
  outstandingAr: number;
  newCustomers: number;
};

export type OverviewTotals = {
  revenue: number;
  invoices: number;
  newCustomers: number;
  outstandingAr: number;
};

export async function getCompaniesOverview(
  range: ResolvedRange,
): Promise<{ companies: CompanyOverview[]; totals: OverviewTotals }> {
  const companies = await prisma.company.findMany({
    where: { isActive: true },
    orderBy: { id: "asc" },
  });

  const rows: CompanyOverview[] = await Promise.all(
    companies.map(async (c) => {
      const [agg, ar, newCustomers] = await Promise.all([
        prisma.order.aggregate({
          where: {
            companyId: c.id,
            orderType: "Invoice",
            completedAt: { gte: range.from, lt: range.to },
          },
          _sum: { grandTotal: true },
          _avg: { grandTotal: true },
          _count: { _all: true },
        }),
        prisma.$queryRaw<Array<{ ar: number | null }>>`
          SELECT COALESCE(SUM("grandTotal" - COALESCE("amountPaid", 0)), 0)::float AS ar
          FROM orders
          WHERE "companyId" = ${c.id}
            AND "orderType" = 'Invoice'
            AND COALESCE("amountPaid", 0) < "grandTotal"
        `,
        prisma.$queryRaw<Array<{ n: number }>>`
          SELECT COUNT(*)::int AS n FROM (
            SELECT o."smAccountId", MIN(o."completedAt") AS first_invoice_at
            FROM orders o
            WHERE o."companyId" = ${c.id}
              AND o."orderType" = 'Invoice'
              AND o."completedAt" IS NOT NULL
            GROUP BY o."smAccountId"
          ) firsts
          WHERE firsts.first_invoice_at >= ${range.from}
            AND firsts.first_invoice_at < ${range.to}
        `,
      ]);
      return {
        companyId: c.id,
        slug: c.slug,
        name: c.name,
        revenue: Number(agg._sum.grandTotal ?? 0),
        invoices: agg._count._all,
        avgInvoice: Number(agg._avg.grandTotal ?? 0),
        outstandingAr: ar[0]?.ar ?? 0,
        newCustomers: newCustomers[0]?.n ?? 0,
      };
    }),
  );

  const totals: OverviewTotals = rows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue,
      invoices: acc.invoices + r.invoices,
      newCustomers: acc.newCustomers + r.newCustomers,
      outstandingAr: acc.outstandingAr + r.outstandingAr,
    }),
    { revenue: 0, invoices: 0, newCustomers: 0, outstandingAr: 0 },
  );

  return { companies: rows, totals };
}
