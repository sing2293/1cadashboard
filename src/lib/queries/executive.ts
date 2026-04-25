import { prisma } from "@/lib/db";

export type DateRange = { from: Date; to: Date };

export type Kpis = {
  revenue: number;
  revenuePrev: number;
  invoices: number;
  avgInvoice: number;
  newCustomers: number;
  outstandingAr: number;
};

export type MonthlyPoint = { month: string; revenue: number; invoices: number };

export type TopAccount = {
  smId: string;
  accountName: string | null;
  revenue: number;
  invoices: number;
};

function shiftYears(d: Date, years: number): Date {
  const out = new Date(d);
  out.setUTCFullYear(out.getUTCFullYear() + years);
  return out;
}

export async function getKpis(companyId: number, range: DateRange): Promise<Kpis> {
  const [current, prev, newCustomers, ar] = await Promise.all([
    prisma.order.aggregate({
      where: {
        companyId,
        orderType: "Invoice",
        completedAt: { gte: range.from, lt: range.to },
      },
      _sum: { grandTotal: true },
      _count: { _all: true },
      _avg: { grandTotal: true },
    }),
    prisma.order.aggregate({
      where: {
        companyId,
        orderType: "Invoice",
        completedAt: {
          gte: shiftYears(range.from, -1),
          lt: shiftYears(range.to, -1),
        },
      },
      _sum: { grandTotal: true },
    }),
    prisma.account.count({
      where: {
        companyId,
        accountType: "Customer",
        smCreatedAt: { gte: range.from, lt: range.to },
      },
    }),
    prisma.$queryRaw<Array<{ ar: number | null }>>`
      SELECT COALESCE(SUM("grandTotal" - COALESCE("amountPaid", 0)), 0)::float AS ar
      FROM orders
      WHERE "companyId" = ${companyId}
        AND "orderType" = 'Invoice'
        AND COALESCE("amountPaid", 0) < "grandTotal"
    `,
  ]);

  return {
    revenue: Number(current._sum.grandTotal ?? 0),
    revenuePrev: Number(prev._sum.grandTotal ?? 0),
    invoices: current._count._all,
    avgInvoice: Number(current._avg.grandTotal ?? 0),
    newCustomers,
    outstandingAr: ar[0]?.ar ?? 0,
  };
}

export async function getMonthlyRevenue(
  companyId: number,
  monthsBack: number,
): Promise<MonthlyPoint[]> {
  const rows = await prisma.$queryRaw<
    Array<{ month: Date; revenue: number; invoices: bigint }>
  >`
    SELECT
      date_trunc('month', "completedAt") AS month,
      SUM("grandTotal")::float AS revenue,
      COUNT(*) AS invoices
    FROM orders
    WHERE "companyId" = ${companyId}
      AND "orderType" = 'Invoice'
      AND "completedAt" >= date_trunc('month', now()) - (${monthsBack}::int * interval '1 month')
    GROUP BY month
    ORDER BY month ASC
  `;
  return rows.map((r) => ({
    month: r.month.toISOString().slice(0, 7),
    revenue: Number(r.revenue ?? 0),
    invoices: Number(r.invoices),
  }));
}

export async function getTopAccounts(
  companyId: number,
  range: DateRange,
  limit = 10,
): Promise<TopAccount[]> {
  return prisma.$queryRaw<TopAccount[]>`
    SELECT
      a."smId" AS "smId",
      a."accountName" AS "accountName",
      SUM(o."grandTotal")::float AS revenue,
      COUNT(*)::int AS invoices
    FROM orders o
    JOIN accounts a
      ON a."companyId" = o."companyId" AND a."smId" = o."smAccountId"
    WHERE o."companyId" = ${companyId}
      AND o."orderType" = 'Invoice'
      AND o."completedAt" >= ${range.from}
      AND o."completedAt" < ${range.to}
    GROUP BY a."smId", a."accountName"
    ORDER BY revenue DESC
    LIMIT ${limit}
  `;
}
