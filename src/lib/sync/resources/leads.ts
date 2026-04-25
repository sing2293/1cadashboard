import type { Prisma } from "@prisma/client";
import type { ResourceSyncer } from "../runner";
import { parseSmTimestamp } from "@/lib/sm/time";
import { concurrentMap } from "../persist";

type RawLead = {
  leadID: string;
  accountID?: string;
  companyID?: string;
  status?: string;
  type?: string;
  leadsource?: string;
  priceQuoted?: number | string;
  createdBy?: string;
  createdOn?: string;
  updatedBy?: string;
  updatedOn?: string;
  [k: string]: unknown;
};

export const leadsSyncer: ResourceSyncer<RawLead> = {
  resource: "leads",

  fetchPages: (sm, fromCursor) =>
    sm.paginate<RawLead>(
      "leads",
      "updatedOn",
      fromCursor,
      (raw) => parseSmTimestamp(raw.updatedOn),
    ),

  extractCursor: (raw) => parseSmTimestamp(raw.updatedOn),
  extractId: (raw) => raw.leadID,

  persist: async (rows, companyId, prisma) => {
    await concurrentMap(rows, (raw) => {
      const data: Prisma.LeadUncheckedCreateInput = {
        companyId,
        smId: raw.leadID,
        source: raw.leadsource ?? null,
        status: raw.status ?? null,
        assignedTo: null,
        estimatedValue:
          typeof raw.priceQuoted === "number"
            ? raw.priceQuoted
            : raw.priceQuoted
              ? Number(raw.priceQuoted)
              : null,
        smCreatedAt: parseSmTimestamp(raw.createdOn),
        smModifiedAt: parseSmTimestamp(raw.updatedOn),
        smPayload: raw as unknown as Prisma.InputJsonValue,
        syncedAt: new Date(),
      };
      return prisma.lead.upsert({
        where: { companyId_smId: { companyId, smId: raw.leadID } },
        create: data,
        update: {
          source: data.source,
          status: data.status,
          estimatedValue: data.estimatedValue,
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
