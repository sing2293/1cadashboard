import type { Prisma } from "@prisma/client";
import type { ResourceSyncer } from "../runner";
import { StClient, parseStTimestamp, stNumber } from "@/lib/st/client";
import { concurrentMap } from "../persist";

type RawInvoiceItem = {
  id: number;
  skuName?: string;
  displayName?: string | null;
  description?: string;
  type?: string; // "Service" | "Material" | "Equipment" | ...
  quantity?: string | number;
  price?: string | number;
  total?: string | number;
  [k: string]: unknown;
};

type RawInvoice = {
  id: number;
  active?: boolean;
  referenceNumber?: string;
  invoiceDate?: string | null;
  subTotal?: string | number;
  total?: string | number;
  balance?: string | number;
  customer?: { id: number; name?: string } | null;
  businessUnit?: { id: number; name?: string } | null;
  job?: { id: number; number?: string; type?: string } | null;
  items?: Array<RawInvoiceItem | null> | null;
  createdOn?: string;
  modifiedOn?: string;
  [k: string]: unknown;
};

/**
 * Every ServiceTitan job carries an invoice from the moment it's booked, so
 * not every invoice is revenue. Only the ones the dashboard counts get the
 * "Invoice" type that every report filters on:
 *   - no invoice date yet → "Work Order": the job isn't done (ST dates the
 *     invoice when the job completes);
 *   - $0 → "No Charge": plan tune-ups, warranty and no-charge visits. Roughly
 *     two thirds of HVAC invoices, and they'd skew the count and average;
 *     ServiceMonster has none;
 *   - deactivated → "Voided".
 * Credits (negative totals) stay invoices so they net off revenue, as on SM.
 */
function orderTypeFor(raw: RawInvoice, total: number | null): string {
  if (raw.active === false) return "Voided";
  if (!raw.invoiceDate) return "Work Order";
  if (!total) return "No Charge";
  return "Invoice";
}

/** Pricebook names are "English // French"; keep the English half, else the SKU code. */
function itemName(item: RawInvoiceItem): string {
  const display = item.displayName?.split("//")[0]?.trim();
  return display || item.skuName || item.description?.slice(0, 120) || "(unnamed item)";
}

// ServiceTitan invoices → orders, with their line items (which come inline,
// unlike SM's per-order lineItems fetch).
export const stInvoicesSyncer: ResourceSyncer<RawInvoice, StClient> = {
  resource: "invoices",
  connect: () => StClient.fromEnv(),

  fetchPages: (st, fromCursor) =>
    st.paginate<RawInvoice>("accounting", "invoices", fromCursor),

  extractCursor: (raw) => parseStTimestamp(raw.modifiedOn),
  extractId: (raw) => String(raw.id),

  persist: async (rows, companyId, prisma) => {
    await concurrentMap(rows, async (raw) => {
      const smId = String(raw.id);
      const subtotal = stNumber(raw.subTotal);
      const grandTotal = stNumber(raw.total);
      const balance = stNumber(raw.balance);
      const data: Prisma.OrderUncheckedCreateInput = {
        companyId,
        smId,
        smAccountId: raw.customer ? String(raw.customer.id) : "",
        orderNumber: raw.referenceNumber ?? raw.job?.number ?? null,
        orderType: orderTypeFor(raw, grandTotal),
        orderGroup: raw.businessUnit?.name ?? null,
        status: null,
        subtotal,
        grandTotal,
        amountPaid:
          grandTotal !== null && balance !== null ? grandTotal - balance : null,
        salesRepSmId: null,
        completedAt: parseStTimestamp(raw.invoiceDate),
        smCreatedAt: parseStTimestamp(raw.createdOn),
        smModifiedAt: parseStTimestamp(raw.modifiedOn),
        smPayload: raw as unknown as Prisma.InputJsonValue,
        syncedAt: new Date(),
      };
      const order = await prisma.order.upsert({
        where: { companyId_smId: { companyId, smId } },
        create: data,
        update: {
          smAccountId: data.smAccountId,
          orderNumber: data.orderNumber,
          orderType: data.orderType,
          orderGroup: data.orderGroup,
          subtotal: data.subtotal,
          grandTotal: data.grandTotal,
          amountPaid: data.amountPaid,
          completedAt: data.completedAt,
          smCreatedAt: data.smCreatedAt,
          smModifiedAt: data.smModifiedAt,
          smPayload: data.smPayload,
          syncedAt: data.syncedAt,
        },
        select: { id: true },
      });

      const items = (raw.items ?? []).filter((x): x is RawInvoiceItem => !!x);
      await prisma.$transaction([
        prisma.orderItem.deleteMany({ where: { orderId: order.id, companyId } }),
        prisma.orderItem.createMany({
          data: items.map((item): Prisma.OrderItemCreateManyInput => ({
            orderId: order.id,
            companyId,
            smId: String(item.id),
            itemType: item.type ?? null,
            name: itemName(item),
            quantity: stNumber(item.quantity),
            unitPrice: stNumber(item.price),
            lineTotal: stNumber(item.total),
            smPayload: item as unknown as Prisma.InputJsonValue,
          })),
        }),
      ]);
    });
    return rows.length;
  },
};
