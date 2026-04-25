import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { SmClient, type SmListResponse } from "@/lib/sm/client";
import { concurrentMap } from "./persist";

type RawLineItem = {
  lineItemID: string;
  orderID: string;
  itemID?: string;
  name?: string;
  description?: string;
  quantity?: number | string;
  price?: number | string;
  total?: number | string;
  upsale?: boolean;
  taxed?: boolean;
  [k: string]: unknown;
};

type OrderRef = { id: number; smId: string };

const BATCH_SIZE = 500;
const FETCH_CONCURRENCY = 10;

function asNum(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

export async function syncOrderItems(
  prisma: PrismaClient,
  sm: SmClient,
  companyId: number,
  options: { onlyMissing?: boolean } = {},
): Promise<{ ordersScanned: number; itemsUpserted: number }> {
  const onlyMissing = options.onlyMissing ?? true;
  let ordersScanned = 0;
  let itemsUpserted = 0;

  while (true) {
    const orders = await prisma.$queryRaw<OrderRef[]>`
      SELECT o.id, o."smId" FROM orders o
      WHERE o."companyId" = ${companyId}
        AND o."orderType" = 'Invoice'
        ${
          onlyMissing
            ? Prisma.sql`AND NOT EXISTS (
                SELECT 1 FROM order_items oi
                WHERE oi."orderId" = o.id AND oi."companyId" = ${companyId}
              )`
            : Prisma.sql``
        }
      ORDER BY o.id ASC
      LIMIT ${BATCH_SIZE}
    `;
    if (orders.length === 0) break;

    const batchStart = Date.now();
    const upsertedInBatch = await concurrentMap(
      orders,
      async (order) => {
        const r = await sm.get<SmListResponse<RawLineItem>>(
          `orders/${order.smId}/lineItems`,
          { limit: 100 },
        );
        const items = r.items ?? [];
        if (items.length === 0) return 0;
        await prisma.orderItem.deleteMany({
          where: { orderId: order.id, companyId },
        });
        await prisma.orderItem.createMany({
          data: items.map((raw): Prisma.OrderItemCreateManyInput => ({
            orderId: order.id,
            companyId,
            smId: raw.lineItemID,
            itemType: null,
            name: raw.name ?? raw.description ?? "Unnamed item",
            normalizedServiceId: null,
            quantity: asNum(raw.quantity),
            unitPrice: asNum(raw.price),
            lineTotal: asNum(raw.total),
            smPayload: raw as unknown as Prisma.InputJsonValue,
          })),
        });
        return items.length;
      },
      FETCH_CONCURRENCY,
    );

    const batchItems = upsertedInBatch.reduce((a, b) => a + b, 0);
    ordersScanned += orders.length;
    itemsUpserted += batchItems;
    console.log(
      `[order-items] batch ${orders.length} orders → ${batchItems} items in ${Date.now() - batchStart}ms (totals: ${ordersScanned} orders, ${itemsUpserted} items)`,
    );

    if (orders.length < BATCH_SIZE) break;
  }

  return { ordersScanned, itemsUpserted };
}
