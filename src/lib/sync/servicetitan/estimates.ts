import type { Prisma } from "@prisma/client";
import type { ResourceSyncer } from "../runner";
import { StClient, parseStTimestamp, stNumber } from "@/lib/st/client";
import { concurrentMap } from "../persist";

type RawEstimate = {
  id: number;
  active?: boolean;
  customerId?: number;
  jobNumber?: string;
  name?: string;
  status?: { value: number; name: string } | null; // Open | Sold | Dismissed
  subtotal?: number | string;
  tax?: number | string;
  businessUnitName?: string;
  soldOn?: string | null;
  createdOn?: string;
  modifiedOn?: string;
  [k: string]: unknown;
};

// Estimates share the orders table with invoices, and ServiceTitan doesn't
// promise the two id ranges never meet, so estimates get a prefix.
const estimateSmId = (raw: RawEstimate) => `estimate:${raw.id}`;

// ServiceTitan estimates → orders with orderType "Estimate".
export const stEstimatesSyncer: ResourceSyncer<RawEstimate, StClient> = {
  resource: "estimates",
  connect: () => StClient.fromEnv(),

  fetchPages: (st, fromCursor) =>
    st.paginate<RawEstimate>("sales", "estimates", fromCursor, { active: "Any" }),

  extractCursor: (raw) => parseStTimestamp(raw.modifiedOn),
  extractId: estimateSmId,

  persist: async (rows, companyId, prisma) => {
    await concurrentMap(rows, (raw) => {
      const smId = estimateSmId(raw);
      const subtotal = stNumber(raw.subtotal);
      const tax = stNumber(raw.tax) ?? 0;
      const data: Prisma.OrderUncheckedCreateInput = {
        companyId,
        smId,
        smAccountId: raw.customerId ? String(raw.customerId) : "",
        orderNumber: raw.jobNumber ?? null,
        orderType: raw.active === false ? "Voided" : "Estimate",
        orderGroup: raw.businessUnitName ?? null,
        status: raw.status?.name ?? null,
        subtotal,
        grandTotal: subtotal !== null ? subtotal + tax : null,
        amountPaid: null,
        salesRepSmId: null,
        completedAt: parseStTimestamp(raw.soldOn),
        smCreatedAt: parseStTimestamp(raw.createdOn),
        smModifiedAt: parseStTimestamp(raw.modifiedOn),
        smPayload: raw as unknown as Prisma.InputJsonValue,
        syncedAt: new Date(),
      };
      return prisma.order.upsert({
        where: { companyId_smId: { companyId, smId } },
        create: data,
        update: {
          smAccountId: data.smAccountId,
          orderNumber: data.orderNumber,
          orderType: data.orderType,
          orderGroup: data.orderGroup,
          status: data.status,
          subtotal: data.subtotal,
          grandTotal: data.grandTotal,
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
