import { PageSkeleton } from "@1ca/ui/components/route-states";

// Executive overview: the report filters, four KPIs, then charts and company cards.
export default function Loading() {
  return <PageSkeleton filters stats={4} rows={6} />;
}
