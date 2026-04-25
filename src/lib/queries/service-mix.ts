import { prisma } from "@/lib/db";

export type CategoryRow = {
  category: string;
  itemCount: number;
  revenue: number;
};

export type ItemRow = {
  name: string;
  count: number;
  revenue: number;
  avgPrice: number;
};

export type CrossCompanyRow = {
  companySlug: string;
  companyName: string;
  category: string;
  revenue: number;
};

export async function getCategoryBreakdown(
  companyId: number,
  daysBack = 365,
): Promise<CategoryRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{ category: string | null; cnt: bigint; revenue: number | null }>
  >`
    SELECT
      COALESCE(sc.category, '(unmapped)') AS category,
      COUNT(*) AS cnt,
      COALESCE(SUM(oi."lineTotal")::float, 0) AS revenue
    FROM order_items oi
    JOIN orders o
      ON o.id = oi."orderId"
    LEFT JOIN service_catalog sc
      ON sc.id = oi."normalizedServiceId"
    WHERE oi."companyId" = ${companyId}
      AND o."orderType" = 'Invoice'
      AND o."completedAt" > now() - (${daysBack}::int * interval '1 day')
    GROUP BY category
    ORDER BY revenue DESC
  `;
  return rows.map((r) => ({
    category: r.category ?? "(unmapped)",
    itemCount: Number(r.cnt),
    revenue: Number(r.revenue ?? 0),
  }));
}

export async function getTopRawItems(
  companyId: number,
  daysBack = 365,
  limit = 20,
): Promise<ItemRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{ name: string; cnt: bigint; revenue: number; avgp: number }>
  >`
    SELECT
      oi.name AS name,
      COUNT(*) AS cnt,
      SUM(oi."lineTotal")::float AS revenue,
      AVG(oi."unitPrice")::float AS avgp
    FROM order_items oi
    JOIN orders o ON o.id = oi."orderId"
    WHERE oi."companyId" = ${companyId}
      AND o."orderType" = 'Invoice'
      AND o."completedAt" > now() - (${daysBack}::int * interval '1 day')
    GROUP BY oi.name
    ORDER BY revenue DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    name: r.name,
    count: Number(r.cnt),
    revenue: Number(r.revenue ?? 0),
    avgPrice: Number(r.avgp ?? 0),
  }));
}

export async function getCrossCompanyMix(
  daysBack = 365,
): Promise<CrossCompanyRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      companySlug: string;
      companyName: string;
      category: string | null;
      revenue: number | null;
    }>
  >`
    SELECT
      c.slug AS "companySlug",
      c.name AS "companyName",
      COALESCE(sc.category, '(unmapped)') AS category,
      COALESCE(SUM(oi."lineTotal")::float, 0) AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi."orderId"
    JOIN companies c ON c.id = oi."companyId"
    LEFT JOIN service_catalog sc ON sc.id = oi."normalizedServiceId"
    WHERE o."orderType" = 'Invoice'
      AND o."completedAt" > now() - (${daysBack}::int * interval '1 day')
    GROUP BY c.slug, c.name, category
    ORDER BY c.slug, revenue DESC
  `;
  return rows.map((r) => ({
    companySlug: r.companySlug,
    companyName: r.companyName,
    category: r.category ?? "(unmapped)",
    revenue: Number(r.revenue ?? 0),
  }));
}
