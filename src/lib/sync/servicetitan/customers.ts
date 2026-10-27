import type { Prisma } from "@prisma/client";
import type { ResourceSyncer } from "../runner";
import { StClient, parseStTimestamp, stNumber } from "@/lib/st/client";
import { concurrentMap } from "../persist";

type RawCustomer = {
  id: number;
  active?: boolean;
  name?: string;
  type?: string; // "Residential" | "Commercial"
  balance?: number | string;
  createdOn?: string;
  modifiedOn?: string;
  [k: string]: unknown;
};

// ServiceTitan customers → accounts. Phones and emails live on a separate
// contacts endpoint and lead sources on jobs (campaigns), so those stay empty.
export const stCustomersSyncer: ResourceSyncer<RawCustomer, StClient> = {
  resource: "customers",
  connect: () => StClient.fromEnv(),

  fetchPages: (st, fromCursor) =>
    st.paginate<RawCustomer>("crm", "customers", fromCursor, { active: "Any" }),

  extractCursor: (raw) => parseStTimestamp(raw.modifiedOn),
  extractId: (raw) => String(raw.id),

  persist: async (rows, companyId, prisma) => {
    await concurrentMap(rows, (raw) => {
      const smId = String(raw.id);
      const data: Prisma.AccountUncheckedCreateInput = {
        companyId,
        smId,
        accountName: raw.name ?? null,
        accountType: raw.type ?? null,
        isCommercial: raw.type === "Commercial",
        email: null,
        phone: null,
        leadSource: null,
        balance: stNumber(raw.balance),
        smCreatedAt: parseStTimestamp(raw.createdOn),
        smModifiedAt: parseStTimestamp(raw.modifiedOn),
        smPayload: raw as unknown as Prisma.InputJsonValue,
        syncedAt: new Date(),
      };
      return prisma.account.upsert({
        where: { companyId_smId: { companyId, smId } },
        create: data,
        update: {
          accountName: data.accountName,
          accountType: data.accountType,
          isCommercial: data.isCommercial,
          balance: data.balance,
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
