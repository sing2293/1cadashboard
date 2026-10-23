import {
  CalendarDays,
  ChartLine,
  Clapperboard,
  Clock,
  LayoutDashboard,
  Phone,
  Receipt,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { APP_IDS, HUB_URL, type AppId } from "./app-ids";

export { APP_IDS, HUB_APP_ID, HUB_URL, isAppId, type AppId } from "./app-ids";

/**
 * The one list of 1CleanAir apps. The hub's tiles, every app's switcher and the
 * command palette all read it.
 *
 * How each kind signs people in:
 * - "hub"      — the hub itself, where everyone signs in and access is managed.
 * - "shared"   — uses the hub's Clerk login on a *.1cleanair.info subdomain, so
 *                the session carries over and access comes from the hub's grants.
 * - "external" — still has its own separate login. We only link to it, in a new
 *                tab, and say so ("own login").
 */
export type AppKind = "hub" | "shared" | "external";

export interface AppEntry {
  /** Stable id, used in access grants (`apps` in publicMetadata), routes and status checks. */
  id: AppId;
  name: string;
  /** For tight spots: the top bar on a phone, the app switcher's grid. */
  shortName: string;
  description: string;
  /** Where the app lives. External apps open in a new tab. */
  url: string;
  kind: AppKind;
  /**
   * A lucide-react icon component. Being a component, it cannot cross from a
   * server component to a client one: pass the app's id and look it up there.
   */
  icon: LucideIcon;
  /** Two colours for the app's tile gradient, from first to second. */
  accent: readonly [string, string];
  /** The hub shows this app as its large tile. */
  featured?: boolean;
  /** Still being built: shown, but marked as in development. */
  underDev?: boolean;
}

type AppDetails = Omit<AppEntry, "id">;

// Keyed by id so the compiler insists on an entry for every id in APP_IDS.
const DETAILS = {
  hub: {
    name: "1CleanAir Hub",
    shortName: "Hub",
    description: "One login. Every 1CleanAir app.",
    url: HUB_URL,
    kind: "hub",
    icon: LayoutDashboard,
    accent: ["#38bdf8", "#34d399"],
  },
  sales: {
    name: "Sales Dashboard",
    shortName: "Sales",
    description: "ServiceMonster unified analytics across 1CleanAir, Home Depot & Enviro Duct",
    url: "https://sales.1cleanair.info",
    kind: "shared",
    icon: ChartLine,
    accent: ["#38bdf8", "#6366f1"],
    featured: true,
  },
  calls: {
    name: "RingCentral Hub",
    shortName: "Calls",
    description: "Call activity, recordings and phone analytics",
    url: "https://calls.1cleanair.info",
    kind: "shared",
    icon: Phone,
    accent: ["#34d399", "#0ea5e9"],
  },
  collections: {
    name: "Collections",
    shortName: "Collections",
    description: "Outstanding invoices and payment follow-ups",
    url: "https://collections.1cleanair.info",
    kind: "external",
    icon: Wallet,
    accent: ["#fbbf24", "#f97316"],
  },
  uploader: {
    name: "Content Uploader",
    shortName: "Uploader",
    description: "Upload and manage media content",
    url: "https://upload.1cleanair.info",
    kind: "shared",
    icon: Clapperboard,
    accent: ["#c084fc", "#818cf8"],
  },
  booking: {
    name: "Internal Booking",
    shortName: "Booking",
    description: "Staff-facing booking and schedule management",
    url: "https://internal.1cleanair.app",
    kind: "external",
    icon: CalendarDays,
    accent: ["#22d3ee", "#34d399"],
  },
  punches: {
    name: "Mobile Punches",
    shortName: "Punches",
    description: "Employee clock-ins, daily shifts and punch locations",
    url: "https://time.1cleanair.info",
    kind: "shared",
    icon: Clock,
    accent: ["#60a5fa", "#2dd4bf"],
  },
  bills: {
    name: "Auto-Invoice Transfer",
    shortName: "Bills",
    description: "Automated invoice transfer pipeline",
    url: "https://bills.1cleanair.info",
    kind: "external",
    icon: Receipt,
    accent: ["#f472b6", "#fb7185"],
    underDev: true,
  },
} satisfies Record<AppId, AppDetails>;

/** Every app, the hub first, in the hub's display order. */
export const APPS: readonly AppEntry[] = APP_IDS.map((id): AppEntry => ({ id, ...DETAILS[id] }));

/** The hub's own entry. */
export const HUB_APP: AppEntry = { id: "hub", ...DETAILS.hub };

/** The apps people are granted, as the hub's tiles show them: every app but the hub. */
export const GRANTABLE_APPS: readonly AppEntry[] = APPS.filter((app) => app.kind !== "hub");

export function getApp(id: string): AppEntry | undefined {
  return APPS.find((app) => app.id === id);
}

/** External apps keep their own login and open in a new tab. */
export function isExternalApp(app: Pick<AppEntry, "kind">): boolean {
  return app.kind === "external";
}

/** CSS for an app's tile: its two accent colours as a diagonal gradient. */
export function accentGradient(app: Pick<AppEntry, "accent">, angle = 135): string {
  return `linear-gradient(${angle}deg, ${app.accent[0]}, ${app.accent[1]})`;
}
