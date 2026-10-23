import type { Metadata } from "next";
import { NoAccess } from "@1ca/ui/shell";

export const metadata: Metadata = { title: "No access" };

// proxy.ts rewrites here when the signed-in user has no grant for this app.
export default function NoAccessPage() {
  return (
    <NoAccess appId="sales" supportEmail={process.env.NEXT_PUBLIC_SUPPORT_EMAIL} />
  );
}
