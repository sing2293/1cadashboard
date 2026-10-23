import { PageSkeleton } from "@1ca/ui/components/route-states";

// Operations: the report filters, five KPIs, the appointments chart and the tech table.
export default function Loading() {
  return <PageSkeleton filters stats={5} rows={8} />;
}
