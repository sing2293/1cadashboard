import type { Prisma } from "@prisma/client";
import type { ResourceSyncer } from "../runner";
import { StClient, parseStTimestamp } from "@/lib/st/client";
import { concurrentMap } from "../persist";

type RawLead = {
  id: number;
  status?: string;
  campaignId?: number | null;
  createdOn?: string;
  modifiedOn?: string;
  [k: string]: unknown;
};

// ServiceTitan leads → leads. Few HVAC leads are logged in ServiceTitan itself
// (most go through Pipedrive), so the HVAC lead count is small.
export const stLeadsSyncer: ResourceSyncer<RawLead, StClient> = {
  resource: "leads",
  connect: () => StClient.fromEnv(),

  fetchPages: (st, fromCursor) => st.paginate<RawLead>("crm", "leads", fromCursor),

  extractCursor: (raw) => parseStTimestamp(raw.modifiedOn),
  extractId: (raw) => String(raw.id),

  persist: async (rows, companyId, prisma) => {
    await concurrentMap(rows, (raw) => {
      const smId = String(raw.id);
      const data: Prisma.LeadUncheckedCreateInput = {
        companyId,
        smId,
        source: raw.campaignId ? String(raw.campaignId) : null,
        status: raw.status ?? null,
        assignedTo: null,
        estimatedValue: null,
        smCreatedAt: parseStTimestamp(raw.createdOn),
        smModifiedAt: parseStTimestamp(raw.modifiedOn),
        smPayload: raw as unknown as Prisma.InputJsonValue,
        syncedAt: new Date(),
      };
      return prisma.lead.upsert({
        where: { companyId_smId: { companyId, smId } },
        create: data,
        update: {
          source: data.source,
          status: data.status,
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
