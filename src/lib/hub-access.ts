/**
 * Login and access come from the 1CleanAir Hub (www.1cleanair.info): one Clerk
 * login shared across every *.1cleanair.info app, with per-app grants in the
 * user's `publicMetadata` (managed on the hub's /admin page):
 *   { "role": "admin" }              → every app (+ this app's /admin pages)
 *   { "apps": "*" }                  → every app
 *   { "apps": ["sales", "calls"] }   → just those apps
 *   {}                               → nothing yet
 * Roles on the hub can also hand out `perms`, e.g. "sales:sync" for the Sync
 * page, or "sales:pay" for the Trucks and Tech pay pages, without making
 * someone a hub administrator.
 */
export const APP_ID = "sales";

export const HUB_URL =
  process.env.NEXT_PUBLIC_HUB_URL ?? "https://www.1cleanair.info";

export interface HubAccess {
  role?: string;
  apps?: string[] | "*";
  perms?: string[];
}

export function isHubAdmin(meta: HubAccess | null | undefined): boolean {
  return meta?.role === "admin";
}

/** Run data syncs (/admin/sync and /api/admin/*). */
export function canSync(meta: HubAccess | null | undefined): boolean {
  return isHubAdmin(meta) || !!meta?.perms?.includes("sales:sync");
}

/** See tech pay rates and each truck's sales after pay (/trucks, /tech-pay). */
export function canSeePay(meta: HubAccess | null | undefined): boolean {
  return isHubAdmin(meta) || !!meta?.perms?.includes("sales:pay");
}

export function canOpenApp(meta: HubAccess | null | undefined): boolean {
  if (!meta) return false;
  if (isHubAdmin(meta) || meta.apps === "*") return true;
  return Array.isArray(meta.apps) && meta.apps.includes(APP_ID);
}
