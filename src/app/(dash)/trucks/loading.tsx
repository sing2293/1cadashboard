import { PageSkeleton } from "@1ca/ui/components/route-states";

// Trucks: the day and company filters, four KPIs, then the per-truck table.
export default function Loading() {
  return <PageSkeleton filters stats={4} rows={8} label="Loading the trucks" />;
}
