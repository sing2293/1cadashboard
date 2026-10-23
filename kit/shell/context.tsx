"use client";

import { useClerk } from "@clerk/nextjs";
import { createContext, useCallback, useContext } from "react";
import { HUB_APP_ID, HUB_URL, type AppEntry } from "../config/apps";
import type { HubViewer } from "./hooks";
import type { NavItem } from "./types";

export interface ShellState {
  /** The app this shell belongs to. */
  app: AppEntry;
  /** Where the app's name leads. */
  homeHref: string;
  /** The nav, already filtered to what this person may see. */
  nav: NavItem[];
  preserveSearchParams: boolean;
  /**
   * Apps for the switcher and the palette: the hub, this app, and every other
   * app this person may open, shared-login apps before own-login ones.
   */
  apps: AppEntry[];
  viewer: HubViewer;
  openPalette: () => void;
}

export const ShellContext = createContext<ShellState | null>(null);

export function useShell(): ShellState {
  const state = useContext(ShellContext);
  if (!state) throw new Error("This part of the app shell must be rendered inside <AppShell>.");
  return state;
}

/**
 * A page on the hub, seen from `appId`. On the hub itself it stays a relative
 * path, so it works on any host (localhost, previews).
 */
export function hubHref(appId: string, path = "/"): string {
  if (appId === HUB_APP_ID) return path;
  return path === "/" ? HUB_URL : `${HUB_URL}${path}`;
}

/**
 * Signs out of the shared 1CleanAir login, which signs out of every app at
 * once. It lands on the app's own home, as the apps' sign-out always did: the
 * app's proxy then sends the signed-out visitor to the hub's sign-in with a
 * link back, so signing in again returns them to the app they left. On the hub
 * it lands on the hub's sign-in page.
 *
 * `appId` is the app whose address the page is on (the shell's app), which is
 * not always the app a screen is about.
 *
 * By default it ends the current session, as Clerk's UserButton did in the
 * account menus the shell replaced; `everySession` ends all of the browser's
 * sessions, as the apps' SignOutButton did on their no-access pages. With
 * Clerk's single-session mode the two are the same.
 */
export function useSignOut(
  appId: string,
  { everySession = false }: { everySession?: boolean } = {},
): () => Promise<void> {
  const clerk = useClerk();
  return useCallback(
    () =>
      clerk.signOut({
        redirectUrl: appId === HUB_APP_ID ? "/sign-in" : "/",
        sessionId: everySession ? undefined : clerk.session?.id,
      }),
    [appId, clerk, everySession],
  );
}
