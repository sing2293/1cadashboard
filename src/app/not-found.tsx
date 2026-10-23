import type { Metadata } from "next";
import { NotFoundView } from "@1ca/ui/components/route-states";

export const metadata: Metadata = { title: "Page not found" };

// Any URL no route matches.
export default function NotFound() {
  return <NotFoundView appId="sales" />;
}
