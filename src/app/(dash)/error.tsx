"use client";

import { ErrorView } from "@1ca/ui/components/route-states";

// A page that failed to render (a database error, say), shown within the shell.
export default function DashError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorView error={error} reset={reset} appId="sales" />;
}
