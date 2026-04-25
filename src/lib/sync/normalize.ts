import type { PrismaClient } from "@prisma/client";

/**
 * Bulk-resolve raw OrderItem.name → ServiceCatalog.id with three SQL UPDATEs:
 *   1. match against ServiceCatalog.canonicalName
 *   2. match against ServiceAlias rows with companyId IS NULL (global aliases)
 *   3. match against ServiceAlias rows scoped to the given companyId
 * Comparisons are case-insensitive after `lower()` on both sides.
 */
export async function normalizeAllItems(
  prisma: PrismaClient,
  companyId: number,
): Promise<{ updated: number; unmapped: number }> {
  const r1 = await prisma.$executeRaw`
    UPDATE order_items oi
       SET "normalizedServiceId" = sc.id
      FROM service_catalog sc
     WHERE oi."companyId" = ${companyId}
       AND oi."normalizedServiceId" IS NULL
       AND lower(oi.name) = lower(sc."canonicalName")
  `;

  const r2 = await prisma.$executeRaw`
    UPDATE order_items oi
       SET "normalizedServiceId" = sa."serviceId"
      FROM service_aliases sa
     WHERE oi."companyId" = ${companyId}
       AND oi."normalizedServiceId" IS NULL
       AND sa."companyId" IS NULL
       AND lower(oi.name) = lower(sa."aliasName")
  `;

  const r3 = await prisma.$executeRaw`
    UPDATE order_items oi
       SET "normalizedServiceId" = sa."serviceId"
      FROM service_aliases sa
     WHERE oi."companyId" = ${companyId}
       AND oi."normalizedServiceId" IS NULL
       AND sa."companyId" = ${companyId}
       AND lower(oi.name) = lower(sa."aliasName")
  `;

  const after = await prisma.orderItem.count({
    where: { companyId, normalizedServiceId: null },
  });

  return { updated: Number(r1) + Number(r2) + Number(r3), unmapped: after };
}
