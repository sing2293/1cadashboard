import type { Prisma } from "@prisma/client";
import type { ResourceSyncer } from "../runner";
import { StClient, parseStTimestamp } from "@/lib/st/client";
import { concurrentMap } from "../persist";

type RawAppointment = {
  id: number;
  jobId: number;
  status?: string; // Scheduled | Dispatched | Working | Hold | Done | Canceled
  start?: string;
  end?: string;
  createdOn?: string;
  modifiedOn?: string;
  [k: string]: unknown;
};

// The Operations queries count ServiceMonster's "Complete" and "Cancelled".
const STATUS: Record<string, string> = { Done: "Complete", Canceled: "Cancelled" };

function hoursBetween(start: Date | null, end: Date | null): number | null {
  if (!start || !end) return null;
  return (end.getTime() - start.getTime()) / 3_600_000;
}

// ServiceTitan appointments → appointments. Only the booked slot: ServiceTitan
// keeps actual on-site time on the technicians' timesheets, not here, so
// actual hours (and the tech utilization table) stay empty for HVAC.
export const stAppointmentsSyncer: ResourceSyncer<RawAppointment, StClient> = {
  resource: "appointments",
  connect: () => StClient.fromEnv(),

  fetchPages: (st, fromCursor) =>
    st.paginate<RawAppointment>("jpm", "appointments", fromCursor, { active: "Any" }),

  extractCursor: (raw) => parseStTimestamp(raw.modifiedOn),
  extractId: (raw) => String(raw.id),

  persist: async (rows, companyId, prisma) => {
    await concurrentMap(rows, (raw) => {
      const smId = String(raw.id);
      const scheduledStart = parseStTimestamp(raw.start);
      const scheduledEnd = parseStTimestamp(raw.end);
      const status = raw.status ? (STATUS[raw.status] ?? raw.status) : null;
      const data: Prisma.AppointmentUncheckedCreateInput = {
        companyId,
        smId,
        smOrderId: String(raw.jobId),
        appointmentType: null,
        status,
        scheduledStart,
        scheduledEnd,
        actualStart: null,
        actualEnd: null,
        estimatedHours: hoursBetween(scheduledStart, scheduledEnd),
        actualHours: null,
        smCreatedAt: parseStTimestamp(raw.createdOn),
        smModifiedAt: parseStTimestamp(raw.modifiedOn),
        smPayload: raw as unknown as Prisma.InputJsonValue,
        syncedAt: new Date(),
      };
      return prisma.appointment.upsert({
        where: { companyId_smId: { companyId, smId } },
        create: data,
        update: {
          status: data.status,
          scheduledStart: data.scheduledStart,
          scheduledEnd: data.scheduledEnd,
          estimatedHours: data.estimatedHours,
          smModifiedAt: data.smModifiedAt,
          smPayload: data.smPayload,
          syncedAt: data.syncedAt,
        },
      });
    });
    return rows.length;
  },
};
