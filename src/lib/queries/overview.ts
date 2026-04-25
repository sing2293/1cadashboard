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

export type MonthlyByCompany = {
  months: string[]; // YYYY-MM
  series: { slug: string; name: string; values: number[] }[];
};

export async function getMonthlyRevenueByCompany(
  monthsBack: number,
): Promise<MonthlyByCompany> {
  const rows = await prisma.$queryRaw<
    Array<{ slug: string; name: string; month: Date; revenue: number | null }>
  >`
    SELECT
      c.slug AS slug,
      c.name AS name,
      date_trunc('month', o."completedAt") AS month,
      SUM(o."grandTotal")::float AS revenue
    FROM orders o
    JOIN companies c ON c.id = o."companyId"
    WHERE o."orderType" = 'Invoice'
      AND o."completedAt" >= date_trunc('month', now()) - (${monthsBack}::int * interval '1 month')
    GROUP BY c.slug, c.name, month
    ORDER BY month ASC, c.slug ASC
  `;
  // Build a sorted month set from data
  const monthSet = new Set<string>();
  for (const r of rows) monthSet.add(r.month.toISOString().slice(0, 7));
  const months = Array.from(monthSet).sort();

  // Pivot to per-company series with zeros for missing months
  const byCompany = new Map<string, { name: string; map: Map<string, number> }>();
  for (const r of rows) {
    const key = r.slug;
    if (!byCompany.has(key)) byCompany.set(key, { name: r.name, map: new Map() });
    byCompany.get(key)!.map.set(
      r.month.toISOString().slice(0, 7),
      Number(r.revenue ?? 0),
    );
  }

  const series = Array.from(byCompany.entries()).map(([slug, info]) => ({
    slug,
    name: info.name,
    values: months.map((m) => info.map.get(m) ?? 0),
  }));

  return { months, series };
}

export type CategoryRevenue = { category: string; revenue: number };

export async function getOverviewCategories(
  range: ResolvedRange,
  limit = 6,
): Promise<CategoryRevenue[]> {
  const rows = await prisma.$queryRaw<
    Array<{ category: string | null; revenue: number | null }>
  >`
    SELECT
      COALESCE(sc.category, '(unmapped)') AS category,
      COALESCE(SUM(oi."lineTotal")::float, 0) AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi."orderId"
    LEFT JOIN service_catalog sc ON sc.id = oi."normalizedServiceId"
    WHERE o."orderType" = 'Invoice'
      AND o."completedAt" >= ${range.from}
      AND o."completedAt" < ${range.to}
      AND COALESCE(sc.category, '(unmapped)') <> '(unmapped)'
    GROUP BY category
    ORDER BY revenue DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    category: r.category ?? "(unmapped)",
    revenue: Number(r.revenue ?? 0),
  }));
}
