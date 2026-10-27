import { APP_IDS, HUB_APP_ID, type AppId } from "./app-ids";

/**
 * Who may open what, shared by the hub and every app so they can never
 * disagree. It reads the RESOLVED fields the hub's /admin writes to a person's
 * Clerk publicMetadata, which every app also sees in the session token's
 * "metadata" claim:
 *
 *   { role: "admin" }              → every app and every permission
 *   { apps: "*" }                  → every app
 *   { apps: ["sales", "calls"] }   → just those apps
 *   { perms: ["sales:sync"] }      → in-app powers (see PERMS)
 *   {}                             → no apps yet; the hub still opens
 *
 * Pure functions with no Clerk or React import: safe in a proxy, on the server
 * and in the browser.
 */
export interface HubAccessMetadata {
  role?: string | null;
  apps?: readonly string[] | "*" | null;
  perms?: readonly string[] | null;
}

export const ADMIN_ROLE = "admin";

/** The in-app powers a hub role can hand out. Each app checks its own. */
export const PERMS = {
  /** Sales: run data syncs (the Sync page and its API). */
  salesSync: "sales:sync",
  /** Sales: tech pay rates and each truck's sales after pay (Trucks, Tech pay). */
  salesPay: "sales:pay",
  /** Lead Attribution: send the sales and FB reports to n8n by hand. */
  pipedriveReports: "pipedrive:reports",
  /** Punches: create and revoke export API keys. */
  punchesApiKeys: "punches:api-keys",
  /** Hub: roles and access (the hub's /admin page). */
  hubAccess: "hub:access",
} as const;

export type Perm = (typeof PERMS)[keyof typeof PERMS];

/** Every app that takes a grant: all but the hub, which everyone may open. */
export const GRANTABLE_APP_IDS: readonly AppId[] = APP_IDS.filter((id) => id !== HUB_APP_ID);

// Metadata arrives as untyped JSON, so lists are read defensively.
function stringsIn(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

/**
 * Narrows anything (Clerk's publicMetadata, the session token's "metadata"
 * claim) to the resolved access fields, dropping malformed values.
 */
export function toHubAccess(value: unknown): HubAccessMetadata {
  if (typeof value !== "object" || value === null) return {};
  const { role, apps, perms } = value as Record<string, unknown>;
  return {
    role: typeof role === "string" ? role : null,
    apps: apps === "*" ? "*" : stringsIn(apps),
    perms: stringsIn(perms),
  };
}

export function isAdmin(meta: HubAccessMetadata | null | undefined): boolean {
  return meta?.role === ADMIN_ROLE;
}

/**
 * The apps someone may open besides the hub, in the hub's display order. An
 * empty list means "no apps yet", as on the hub's home page.
 */
export function appIdsFor(meta: HubAccessMetadata | null | undefined): AppId[] {
  if (!meta) return [];
  if (isAdmin(meta) || meta.apps === "*") return [...GRANTABLE_APP_IDS];
  const granted = stringsIn(meta.apps);
  return GRANTABLE_APP_IDS.filter((id) => granted.includes(id));
}

/** May this person open the app? The hub always; any other app needs a grant. */
export function canOpenApp(meta: HubAccessMetadata | null | undefined, appId: string): boolean {
  if (appId === HUB_APP_ID) return true;
  return (appIdsFor(meta) as string[]).includes(appId);
}

/** Admins hold every permission; anyone else holds what their roles resolved to. */
export function hasPermission(meta: HubAccessMetadata | null | undefined, perm: string): boolean {
  if (!meta) return false;
  return isAdmin(meta) || stringsIn(meta.perms).includes(perm);
}

/** May open the hub's /admin ("Roles & access"): Admins and anyone given "hub:access". */
export function canManageAccess(meta: HubAccessMetadata | null | undefined): boolean {
  return hasPermission(meta, PERMS.hubAccess);
}
