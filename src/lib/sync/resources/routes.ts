import type { Prisma } from "@prisma/client";
import type { ResourceSyncer } from "../runner";
import type { SmListResponse } from "@/lib/sm/client";
import { formatSmCursor, parseSmTimestamp } from "@/lib/sm/time";
import { concurrentMap } from "../persist";

// A ServiceMonster route is a scheduling lane, in practice one truck and its
// crew ("C#1-ROCH"). Jobs only carry its id, so the names come from here.
type RawRoute = {
  routeID: string;
  name?: string;
  active?: boolean;
  position?: number;
  timeStamp?: string;
  [k: string]: unknown;
};

export const routesSyncer: ResourceSyncer<RawRoute> = {
  resource: "routes",
  fullSync: true,

  // A few dozen rows, all of them every run. Walk by timeStamp from the very
  // start (not the run's cursor), so routes untouched for years still come.
  // Filtering /routes by routeID makes ServiceMonster answer 500.
  fetchPages: async function* (sm) {
    let cursor = new Date(Date.UTC(1900, 0, 1));
    while (true) {
      const r = await sm.get<SmListResponse<RawRoute>>("routes", {
        limit: 100,
        orderBy: "timeStamp",
        wField: "timeStamp",
        wOperator: "gt",
        wValue: formatSmCursor(cursor),
      });
      const rows = r.items ?? [];
      if (rows.length === 0) return;
      yield rows;
      const last = parseSmTimestamp(rows[rows.length - 1].timeStamp);
      if (rows.length < 100 || !last || last <= cursor) return;
      cursor = last;
    }
  },

  extractCursor: () => null,
  extractId: (raw) => raw.routeID,

  persist: async (rows, companyId, prisma) => {
    await concurrentMap(rows, (raw) => {
      const data: Prisma.RouteUncheckedCreateInput = {
        companyId,
        smId: raw.routeID,
        name: raw.name?.trim() || "Unnamed route",
        isActive: raw.active ?? true,
        position: typeof raw.position === "number" ? raw.position : null,
        smPayload: raw as unknown as Prisma.InputJsonValue,
        syncedAt: new Date(),
      };
      return prisma.route.upsert({
        where: { companyId_smId: { companyId, smId: raw.routeID } },
        create: data,
        update: {
          name: data.name,
          isActive: data.isActive,
          position: data.position,
          smPayload: data.smPayload,
          syncedAt: data.syncedAt,
        },
      });
    });
    return rows.length;
  },
};
