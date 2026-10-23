import { PageSkeleton } from "@1ca/ui/components/route-states";

// Sync status: four KPIs and the per-company tables (no report filters here).
export default function Loading() {
  return <PageSkeleton stats={4} rows={6} />;
}
