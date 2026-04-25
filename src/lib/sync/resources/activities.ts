import type { Prisma } from "@prisma/client";
import type { ResourceSyncer } from "../runner";
import { parseSmTimestamp } from "@/lib/sm/time";
import { concurrentMap } from "../persist";

type RawNote = {
  activityID: string;
  accountID?: string;
  orderID?: string;
  companyID?: string;
  subject?: string;
  activityDateTime?: string;
  timeStamp?: string;
  showOnSchedule?: boolean;
  userName?: string;
  [k: string]: unknown;
};

export const activitiesSyncer: ResourceSyncer<RawNote> = {
  resource: "activities",

  // Mapped to /notes — that's what SM exposes for what the spec calls "activities".
  fetchPages: (sm, fromCursor) =>
    sm.paginate<RawNote>(
      "notes",
      "timeStamp",
      fromCursor,
      (raw) => parseSmTimestamp(raw.timeStamp),
    ),

  extractCursor: (raw) => parseSmTimestamp(raw.timeStamp),
  extractId: (raw) => raw.activityID,

  persist: async (rows, companyId, prisma) => {
    await concurrentMap(rows, (raw) => {
      const data: Prisma.ActivityUncheckedCreateInput = {
        companyId,
        smId: raw.activityID,
        smAccountId: raw.accountID ?? null,
        activityType: "note",
        subject: raw.subject ?? null,
        result: null,
        occurredAt: parseSmTimestamp(raw.activityDateTime),
        smPayload: raw as unknown as Prisma.InputJsonValue,
        syncedAt: new Date(),
      };
      return prisma.activity.upsert({
        where: { companyId_smId: { companyId, smId: raw.activityID } },
        create: data,
        update: {
          smAccountId: data.smAccountId,
          activityType: data.activityType,
          subject: data.subject,
          occurredAt: data.occurredAt,
          smPayload: data.smPayload,
          syncedAt: data.syncedAt,
        },
      });
    });
    return rows.length;
  },
};
