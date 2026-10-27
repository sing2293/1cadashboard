import type { ResourceSyncer } from "./runner";
import { accountsSyncer } from "./resources/accounts";
import { activitiesSyncer } from "./resources/activities";
import { appointmentsSyncer } from "./resources/appointments";
import { employeesSyncer } from "./resources/employees";
import { leadsSyncer } from "./resources/leads";
import { ordersSyncer } from "./resources/orders";
import { routesSyncer } from "./resources/routes";
import { stAppointmentsSyncer } from "./servicetitan/appointments";
import { stAssignmentsSyncer } from "./servicetitan/assignments";
import { stCustomersSyncer } from "./servicetitan/customers";
import { stEstimatesSyncer } from "./servicetitan/estimates";
import { stInvoicesSyncer } from "./servicetitan/invoices";
import { stLeadsSyncer } from "./servicetitan/leads";
import { stTechniciansSyncer } from "./servicetitan/technicians";
import { stTrucksSyncer } from "./servicetitan/trucks";

/** Company.source: which system a company's data is synced from. */
export const SERVICEMONSTER = "servicemonster";
export const SERVICETITAN = "servicetitan";

type AnySyncer = ResourceSyncer<unknown, unknown>;

const SM_SYNCERS = {
  accounts: accountsSyncer,
  employees: employeesSyncer,
  routes: routesSyncer,
  leads: leadsSyncer,
  orders: ordersSyncer,
  appointments: appointmentsSyncer,
  activities: activitiesSyncer,
} as unknown as Record<string, AnySyncer>;

const ST_SYNCERS = {
  customers: stCustomersSyncer,
  invoices: stInvoicesSyncer,
  estimates: stEstimatesSyncer,
  appointments: stAppointmentsSyncer,
  leads: stLeadsSyncer,
  // For the Trucks page; assignments need the appointments and technicians first.
  technicians: stTechniciansSyncer,
  trucks: stTrucksSyncer,
  assignments: stAssignmentsSyncer,
} as unknown as Record<string, AnySyncer>;

/** Every resource synced for a company, by name, in run order. */
export function syncersFor(company: { source: string }): Record<string, AnySyncer> {
  return company.source === SERVICETITAN ? ST_SYNCERS : SM_SYNCERS;
}
