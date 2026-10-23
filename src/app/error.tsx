"use client";

import { ErrorView } from "@1ca/ui/components/route-states";

// What (dash)/error.tsx can't catch. A segment's error.tsx never wraps that
// segment's own layout, so a failure in (dash)/layout.tsx (its listCompanies()
// query when the database is down, say) lands here, as does one in
// /no-access. Rendered outside the shell, ErrorView centres itself, owns the
// <main> landmark and signs itself with the app's tile.
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorView error={error} reset={reset} appId="sales" />;
}
