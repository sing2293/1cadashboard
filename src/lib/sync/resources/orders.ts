import type { Prisma } from "@prisma/client";
import type { ResourceSyncer } from "../runner";
import { parseSmTimestamp } from "@/lib/sm/time";
import { concurrentMap } from "../persist";

type RawOrder = {
  orderID: string;
  accountID: string;
  accountName?: string;
  companyID?: string;
  orderNumber?: number;
  orderType?: string;
  subGroup?: string;
  subTotal?: number;
  grandTotal?: number;
  balanceDue?: number;
  salesRepID?: string;
  createdOn?: string;
  dateCreated?: string;
  timeStamp?: string;
  [k: string]: unknown;
};

function asNumber(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

export const ordersSyncer: ResourceSyncer<RawOrder> = {
  resource: "orders",

  fetchPages: (sm, fromCursor) =>
    sm.paginate<RawOrder>(
      "orders",
      "timeStamp",
      fromCursor,
      (raw) => parseSmTimestamp(raw.timeStamp),
    ),

  extractCursor: (raw) => parseSmTimestamp(raw.timeStamp),
  extractId: (raw) => raw.orderID,

  persist: async (rows, companyId, prisma) => {
    await concurrentMap(rows, (raw) => {
      const grandTotal = asNumber(raw.grandTotal);
      const balanceDue = asNumber(raw.balanceDue);
      const amountPaid =
        grandTotal !== null && balanceDue !== null ? grandTotal - balanceDue : null;
      const data: Prisma.OrderUncheckedCreateInput = {
        companyId,
        smId: raw.orderID,
        smAccountId: raw.accountID,
        orderNumber: raw.orderNumber !== undefined ? String(raw.orderNumber) : null,
        orderType: raw.orderType ?? "unknown",
        orderGroup: raw.subGroup ?? null,
        status: null,
        subtotal: asNumber(raw.subTotal),
        grandTotal,
        amountPaid,
        salesRepSmId: raw.salesRepID ?? null,
        completedAt: parseSmTimestamp(raw.dateCreated),
        smCreatedAt: parseSmTimestamp(raw.createdOn),
        smModifiedAt: parseSmTimestamp(raw.timeStamp),
        smPayload: raw as unknown as Prisma.InputJsonValue,
        syncedAt: new Date(),
      };
      return prisma.order.upsert({
        where: { companyId_smId: { companyId, smId: raw.orderID } },
        create: data,
        update: {
          orderNumber: data.orderNumber,
          orderType: data.orderType,
          orderGroup: data.orderGroup,
          subtotal: data.subtotal,
          grandTotal: data.grandTotal,
          amountPaid: data.amountPaid,
          salesRepSmId: data.salesRepSmId,
          completedAt: data.completedAt,
          smCreatedAt: data.smCreatedAt,
          smModifiedAt: data.smModifiedAt,
          smPayload: data.smPayload,
          syncedAt: data.syncedAt,
        },
      });
    });
    return rows.length;
  },
};
