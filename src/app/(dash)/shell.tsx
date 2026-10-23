"use client";

import {
  ChartLine,
  ChartPie,
  Database,
  LayoutDashboard,
  RefreshCw,
  Wrench,
} from "lucide-react";
import { AppShell, type NavItem } from "@1ca/ui/shell";

// Each label is its page's h1. The Sync status link shows only to people
// holding "sales:sync" (hub admins see it too); proxy.ts still guards /admin
// on the server.
const NAV: NavItem[] = [
  { label: "Executive overview", href: "/", icon: LayoutDashboard },
  { label: "Operations", href: "/operations", icon: Wrench },
  { label: "Sales", href: "/sales", icon: ChartLine },
  { label: "Service mix", href: "/service-mix", icon: ChartPie },
  {
    label: "Sync status",
    href: "/admin/sync",
    icon: RefreshCw,
    perm: "sales:sync",
  },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      appId="sales"
      nav={NAV}
      // The date range and company filters ride along between pages.
      preserveSearchParams
      sidebarFooter={<SidebarFooter />}
    >
      {children}
    </AppShell>
  );
}

function SidebarFooter() {
  return (
    <div className="flex items-start gap-2.5 px-1">
      <Database aria-hidden className="mt-px size-3.5 shrink-0" />
      <div className="min-w-0 leading-relaxed">
        {/* Each name keeps its separator and never breaks, so a narrow sidebar
            wraps between companies ("… Home Depot ·" / "Enviro Duct"). */}
        <p>
          <span className="whitespace-nowrap">1CleanAir ·</span>{" "}
          <span className="whitespace-nowrap">Home Depot ·</span>{" "}
          <span className="whitespace-nowrap">Enviro Duct</span>
        </p>
        <p>Synced via SM API</p>
      </div>
    </div>
  );
}
