/**
 * 1CA Glass app shell: the top bar, sidebar, app switcher, user menu and ⌘K
 * palette every 1CleanAir app wraps its signed-in pages in, plus the shared
 * /no-access page body.
 *
 * They are client components and need, above them in the root layout,
 * ClerkProvider and KitProviders (from "@1ca/ui/providers"). AppShell goes in
 * the layout around the signed-in pages, never around /no-access. Icons are
 * components, which a server layout cannot hand to a client component, so the
 * nav lives in a small client wrapper:
 *
 *   // app/(app)/shell.tsx
 *   "use client";
 *   import { ChartLine, LayoutDashboard, RefreshCw } from "lucide-react";
 *   import { AppShell, type NavItem } from "@1ca/ui/shell";
 *
 *   const NAV: NavItem[] = [
 *     { label: "Dashboard", href: "/", icon: LayoutDashboard },
 *     { label: "Sales", href: "/sales", icon: ChartLine },
 *     { label: "Sync", href: "/admin/sync", icon: RefreshCw, perm: "sales:sync" },
 *   ];
 *
 *   export function Shell({ children }: { children: React.ReactNode }) {
 *     return <AppShell appId="sales" nav={NAV}>{children}</AppShell>;
 *   }
 *
 *   // app/(app)/layout.tsx (a server component; children stay server-rendered)
 *   export default function Layout({ children }: LayoutProps<"/">) {
 *     return <Shell>{children}</Shell>;
 *   }
 *
 *   // app/no-access/page.tsx
 *   import { NoAccess } from "@1ca/ui/shell";
 *   export default function Page() {
 *     return <NoAccess appId="sales" />;
 *   }
 *
 * A server layout can also pass the nav itself if each icon is an element
 * (`icon: <ChartLine />`) rather than the component.
 */
export { AppShell } from "./app-shell";
export { NoAccess, type NoAccessProps } from "./no-access";
export { AppTile, BrandMark, type AppTileSize } from "./brand";
export { useHubViewer, type HubViewer } from "./hooks";
export type { AppShellProps, NavItem } from "./types";
