import type { Prisma } from "@prisma/client";
import type { ResourceSyncer } from "../runner";
import type { SmListResponse } from "@/lib/sm/client";
import { concurrentMap } from "../persist";

type RawEmployee = {
  employeeID: string;
  companyID?: string;
  active?: boolean;
  hidden?: boolean;
  isTechnician?: boolean;
  isCorporate?: boolean;
  isSalesRep?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  ASPUserName?: string;
  [k: string]: unknown;
};

function deriveRole(raw: RawEmployee): string | null {
  if (raw.isTechnician) return "tech";
  if (raw.isSalesRep) return "sales";
  if (raw.isCorporate) return "corporate";
  return "office";
}

export const employeesSyncer: ResourceSyncer<RawEmployee> = {
  resource: "employees",
  fullSync: true,

  // No timeStamp on employees — walk by employeeID instead. Tiny resource (~350 rows).
  fetchPages: async function* (sm) {
    let cursor = "";
    while (true) {
      const r = await sm.get<SmListResponse<RawEmployee>>("employees", {
        limit: 100,
        orderBy: "employeeID",
        wField: "employeeID",
        wOperator: "gt",
        wValue: cursor,
      });
      const rows = r.items ?? [];
      if (rows.length === 0) return;
      yield rows;
      const last = rows[rows.length - 1].employeeID;
      if (last === cursor) return;
      cursor = last;
    }
  },

  extractCursor: () => null,
  extractId: (raw) => raw.employeeID,

  persist: async (rows, companyId, prisma) => {
    await concurrentMap(rows, (raw) => {
      const data: Prisma.EmployeeUncheckedCreateInput = {
        companyId,
        smId: raw.employeeID,
        firstName: raw.firstName ?? null,
        lastName: raw.lastName ?? null,
        role: deriveRole(raw),
        isActive: raw.active ?? true,
        smPayload: raw as unknown as Prisma.InputJsonValue,
        syncedAt: new Date(),
      };
      return prisma.employee.upsert({
        where: { companyId_smId: { companyId, smId: raw.employeeID } },
        create: data,
        update: {
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          isActive: data.isActive,
          smPayload: data.smPayload,
          syncedAt: data.syncedAt,
        },
      });
    });
    return rows.length;
  },
};
