import type { Metadata } from "next";
import { NotFoundView } from "@1ca/ui/components/route-states";

export const metadata: Metadata = { title: "Page not found" };

// notFound() inside the dashboard, shown within the shell.
export default function NotFound() {
  return <NotFoundView appId="sales" />;
}
