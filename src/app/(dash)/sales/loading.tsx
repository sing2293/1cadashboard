import { PageSkeleton } from "@1ca/ui/components/route-states";

// Sales: the report filters, five KPIs and the lead-source table.
export default function Loading() {
  return <PageSkeleton filters stats={5} rows={8} />;
}
