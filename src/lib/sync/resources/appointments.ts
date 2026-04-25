import type { Prisma } from "@prisma/client";
import type { ResourceSyncer } from "../runner";
import { parseSmTimestamp } from "@/lib/sm/time";
import { concurrentMap } from "../persist";

type RawJob = {
  jobID: string;
  orderID: string;
  accountID?: string;
  companyID?: string;
  routeID?: string;
  jobStatus?: string;
  jobType?: string;
  estDateTimeStart?: string;
  estDateTimeEnd?: string;
  actualDateTimeStart?: string;
  actualDateTimeEnd?: string;
  note?: string;
  timeStamp?: string;
  [k: string]: unknown;
};

function hoursBetween(start: Date | null, end: Date | null): number | null {
  if (!start || !end) return null;
  return (end.getTime() - start.getTime()) / 3_600_000;
}

export const appointmentsSyncer: ResourceSyncer<RawJob> = {
  resource: "appointments",

  fetchPages: (sm, fromCursor) =>
    sm.paginate<RawJob>(
      "jobs",
      "timeStamp",
      fromCursor,
      (raw) => parseSmTimestamp(raw.timeStamp),
    ),

  extractCursor: (raw) => parseSmTimestamp(raw.timeStamp),
  extractId: (raw) => raw.jobID,

  persist: async (rows, companyId, prisma) => {
    await concurrentMap(rows, (raw) => {
      const scheduledStart = parseSmTimestamp(raw.estDateTimeStart);
      const scheduledEnd = parseSmTimestamp(raw.estDateTimeEnd);
      const actualStart = parseSmTimestamp(raw.actualDateTimeStart);
      const actualEnd = parseSmTimestamp(raw.actualDateTimeEnd);
      const data: Prisma.AppointmentUncheckedCreateInput = {
        companyId,
        smId: raw.jobID,
        smOrderId: raw.orderID,
        appointmentType: raw.jobType ?? null,
        status: raw.jobStatus ?? null,
        scheduledStart,
        scheduledEnd,
        actualStart,
        actualEnd,
        estimatedHours: hoursBetween(scheduledStart, scheduledEnd),
        actualHours: hoursBetween(actualStart, actualEnd),
        smCreatedAt: null,
        smModifiedAt: parseSmTimestamp(raw.timeStamp),
        smPayload: raw as unknown as Prisma.InputJsonValue,
        syncedAt: new Date(),
      };
      return prisma.appointment.upsert({
        where: { companyId_smId: { companyId, smId: raw.jobID } },
        create: data,
        update: {
          appointmentType: data.appointmentType,
          status: data.status,
          scheduledStart: data.scheduledStart,
          scheduledEnd: data.scheduledEnd,
          actualStart: data.actualStart,
          actualEnd: data.actualEnd,
          estimatedHours: data.estimatedHours,
          actualHours: data.actualHours,
          smModifiedAt: data.smModifiedAt,
          smPayload: data.smPayload,
          syncedAt: data.syncedAt,
        },
      });
    });
    return rows.length;
  },
};
