import type { Prisma } from "@prisma/client";
import type { ResourceSyncer } from "../runner";
import { StClient } from "@/lib/st/client";
import { concurrentMap } from "../persist";

type RawTruck = {
  id: number;
  name?: string;
  active?: boolean;
  technicianIds?: number[];
  modifiedOn?: string;
  [k: string]: unknown;
};

// ServiceTitan inventory trucks → routes, the HVAC side of a "truck". Each
// lists its technicianIds (kept in smPayload), which is how the Trucks page
// puts an HVAC appointment on a truck. Every run takes them all.
export const stTrucksSyncer: ResourceSyncer<RawTruck, StClient> = {
  resource: "trucks",
  fullSync: true,
  connect: () => StClient.fromEnv(),
  fetchPages: (st) => st.paginate<RawTruck>("inventory", "trucks", new Date(0), { active: "Any" }),
  extractCursor: () => null,
  extractId: (raw) => String(raw.id),
  persist: async (rows, companyId, prisma) => {
    await concurrentMap(rows, (raw) => {
      const smId = String(raw.id);
      const data: Prisma.RouteUncheckedCreateInput = {
        companyId,
        smId,
        name: raw.name?.trim() || "Unnamed truck",
        isActive: raw.active ?? true,
        position: null,
        smPayload: raw as unknown as Prisma.InputJsonValue,
        syncedAt: new Date(),
      };
      return prisma.route.upsert({
        where: { companyId_smId: { companyId, smId } },
        create: data,
        update: { name: data.name, isActive: data.isActive, smPayload: data.smPayload, syncedAt: data.syncedAt },
      });
    });
    return rows.length;
  },
};
