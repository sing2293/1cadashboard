import type { ResourceSyncer } from "../runner";
import { StClient, parseStTimestamp } from "@/lib/st/client";

type RawAssignment = {
  id: number;
  technicianId: number;
  appointmentId: number;
  active?: boolean;
  modifiedOn?: string;
  [k: string]: unknown;
};

// ServiceTitan appointment assignments → appointment_techs: which technicians
// were on each HVAC appointment. An inactive assignment (the tech was taken
// off) removes the link. Needs the appointments and technicians synced first;
// a row whose appointment or technician isn't here yet is skipped and comes
// back with its next change.
export const stAssignmentsSyncer: ResourceSyncer<RawAssignment, StClient> = {
  resource: "assignments",
  connect: () => StClient.fromEnv(),
  fetchPages: (st, fromCursor) =>
    st.paginate<RawAssignment>("dispatch", "appointment-assignments", fromCursor, { active: "Any" }),
  extractCursor: (raw) => parseStTimestamp(raw.modifiedOn),
  extractId: (raw) => String(raw.id),
  persist: async (rows, companyId, prisma) => {
    // One lookup per page, not per row.
    const [appointments, employees] = await Promise.all([
      prisma.appointment.findMany({
        where: { companyId, smId: { in: [...new Set(rows.map((r) => String(r.appointmentId)))] } },
        select: { id: true, smId: true },
      }),
      prisma.employee.findMany({
        where: { companyId, smId: { in: [...new Set(rows.map((r) => String(r.technicianId)))] } },
        select: { id: true, smId: true },
      }),
    ]);
    const appointmentId = new Map(appointments.map((a) => [a.smId, a.id]));
    const employeeId = new Map(employees.map((e) => [e.smId, e.id]));

    const add: { appointmentId: number; employeeId: number }[] = [];
    const remove: { appointmentId: number; employeeId: number }[] = [];
    for (const raw of rows) {
      const a = appointmentId.get(String(raw.appointmentId));
      const e = employeeId.get(String(raw.technicianId));
      if (!a || !e) continue;
      (raw.active === false ? remove : add).push({ appointmentId: a, employeeId: e });
    }
    if (add.length) await prisma.appointmentTech.createMany({ data: add, skipDuplicates: true });
    if (remove.length) await prisma.appointmentTech.deleteMany({ where: { OR: remove } });
    return add.length + remove.length;
  },
};
