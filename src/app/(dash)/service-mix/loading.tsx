import { PageSkeleton } from "@1ca/ui/components/route-states";

// Service mix: the report filters, four KPIs, the category chart and tables.
export default function Loading() {
  return <PageSkeleton filters stats={4} rows={8} />;
}
