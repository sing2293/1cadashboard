import type { Prisma } from "@prisma/client";
import type { ResourceSyncer } from "../runner";
import { StClient } from "@/lib/st/client";
import { concurrentMap } from "../persist";

type RawTechnician = {
  id: number;
  name?: string;
  firstName?: string | null;
  lastName?: string | null;
  active?: boolean;
  modifiedOn?: string;
  [k: string]: unknown;
};

// ServiceTitan technicians → employees, so appointment assignments can point
// at them. A few dozen rows: every run takes them all, inactive ones included.
export const stTechniciansSyncer: ResourceSyncer<RawTechnician, StClient> = {
  resource: "technicians",
  fullSync: true,
  connect: () => StClient.fromEnv(),
  fetchPages: (st) => st.paginate<RawTechnician>("settings", "technicians", new Date(0), { active: "Any" }),
  extractCursor: () => null,
  extractId: (raw) => String(raw.id),
  persist: async (rows, companyId, prisma) => {
    await concurrentMap(rows, (raw) => {
      const smId = String(raw.id);
      const [first, ...rest] = (raw.name ?? "").trim().split(/\s+/);
      const data: Prisma.EmployeeUncheckedCreateInput = {
        companyId,
        smId,
        firstName: raw.firstName || first || null,
        lastName: raw.lastName || rest.join(" ") || null,
        role: "tech",
        isActive: raw.active ?? true,
        smPayload: raw as unknown as Prisma.InputJsonValue,
        syncedAt: new Date(),
      };
      return prisma.employee.upsert({
        where: { companyId_smId: { companyId, smId } },
        create: data,
        update: {
          firstName: data.firstName,
          lastName: data.lastName,
          isActive: data.isActive,
          smPayload: data.smPayload,
          syncedAt: data.syncedAt,
        },
      });
    });
    return rows.length;
  },
};
