/**
 * The 1CleanAir app ids and the hub's address. This module has no imports, so a
 * proxy, a server action or a script can use it without pulling in React or the
 * icon set. The full registry (names, links, icons, colours) is ./apps.ts.
 */

/** Every app the hub knows, in the hub's display order. "hub" is the hub itself. */
export const APP_IDS = [
  "hub",
  "sales",
  "pipedrive",
  "calls",
  "collections",
  "uploader",
  "booking",
  "punches",
  "bills",
] as const;

export type AppId = (typeof APP_IDS)[number];

/** The hub's own id. Everyone who can sign in may open it. */
export const HUB_APP_ID = "hub" satisfies AppId;

export function isAppId(value: unknown): value is AppId {
  return typeof value === "string" && (APP_IDS as readonly string[]).includes(value);
}

// The kit type-checks without Node's types. This module-scoped declaration
// only describes the global for the compiler and emits nothing, so in an app
// (which has @types/node) it simply shadows the same global.
declare const process: { env: Partial<Record<string, string>> };

/**
 * The hub's address, without a trailing slash. NEXT_PUBLIC_HUB_URL points a
 * local or staging build at another hub. It is read as a literal
 * process.env.NEXT_PUBLIC_* expression so Next inlines it into browser code.
 */
export const HUB_URL = (process.env.NEXT_PUBLIC_HUB_URL || "https://www.1cleanair.info").replace(
  /\/+$/,
  "",
);
