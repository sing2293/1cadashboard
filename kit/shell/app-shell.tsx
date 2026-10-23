"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { GlassTooltipProvider } from "../components/glassyui/glass-tooltip";
import { canOpenApp } from "../config/access";
import { APPS, getApp, HUB_APP, type AppEntry } from "../config/apps";
import { cn } from "../lib/utils";
import { CommandPalette } from "./command-palette";
import { ShellContext, type ShellState } from "./context";
import { useCommandShortcut, useHubViewer, useMediaQuery, useStoredChoice } from "./hooks";
import { MobileNav } from "./mobile-nav";
import { isExternalHref, visibleNav } from "./nav-model";
import { Sidebar } from "./sidebar";
import { FOCUS_RING, TEXT } from "./styles";
import { TopBar } from "./top-bar";
import type { AppShellProps } from "./types";

const KIND_ORDER = { hub: 0, shared: 1, external: 2 } as const;

/**
 * Tablet widths, where the sidebar shows (768px up) but its full 248px would
 * leave the page too little room: the icon rail is the default there.
 */
const RAIL_BY_DEFAULT = "(max-width: 1023.98px)";

/**
 * The frame every 1CleanAir app shares: a glass top bar (1CleanAir and the
 * app's name, ⌘K search, the app's own actions, theme and account), a
 * collapsible sidebar with the app switcher and the app's links, and the page
 * on a plain background. Below 768px the sidebar becomes a sheet.
 *
 * A client component that needs ClerkProvider and KitProviders above it.
 * Render it in the layout that wraps the app's signed-in pages, not around
 * /no-access. The top bar is 56px (48px full-bleed), exposed to the page as
 * --ca-shell-top for its own sticky headers.
 */
export function AppShell({
  appId,
  nav,
  actions,
  fullBleed = false,
  sidebarFooter,
  homeHref,
  preserveSearchParams = false,
  initialAccess,
  children,
}: AppShellProps) {
  const viewer = useHubViewer(initialAccess);
  const app = useMemo(() => getApp(appId) ?? unknownApp(appId), [appId]);

  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // The person's own choice wins at every width; without one, the rail below 1024px. Both are
  // known only in the browser, so the server renders the full sidebar and the rail follows on
  // hydration (see README, "App shell").
  const [railChoice, setRail] = useStoredChoice(`1ca.shell.${app.id}.sidebar-collapsed`);
  const railByDefault = useMediaQuery(RAIL_BY_DEFAULT);
  const rail = railChoice ?? railByDefault;
  // The width animates only after the person toggles it, never on load.
  const [animateRail, setAnimateRail] = useState(false);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  useCommandShortcut(() => setPaletteOpen((open) => !open));

  const state = useMemo<ShellState>(() => {
    const shownNav = visibleNav(nav, viewer.access);
    const firstLink = shownNav.find((item) => !isExternalHref(item.href))?.href;
    // Until access is known, only the apps everyone here can open: the hub and this one.
    const apps = APPS.filter(
      (entry) =>
        entry.id === HUB_APP.id ||
        entry.id === app.id ||
        (viewer.accessKnown && canOpenApp(viewer.access, entry.id)),
    ).sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
    return {
      app,
      homeHref: homeHref ?? firstLink ?? "/",
      nav: shownNav,
      preserveSearchParams,
      apps,
      viewer,
      openPalette,
    };
  }, [app, homeHref, nav, openPalette, preserveSearchParams, viewer]);

  return (
    <ShellContext.Provider value={state}>
      {/* --ca-shell-top is the top bar's height, for a page's own sticky header:
          className="sticky top-[var(--ca-shell-top)]". */}
      <div
        className={cn(
          "flex min-h-dvh flex-col",
          fullBleed ? "[--ca-shell-top:3rem]" : "[--ca-shell-top:3.5rem]",
          TEXT,
        )}
      >
        <a
          href="#main-content"
          className={cn(
            "sr-only rounded-full bg-[color:var(--lg-overlay-surface)] px-4 py-2 text-sm font-medium shadow-lg",
            "focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60]",
            FOCUS_RING,
          )}
        >
          Skip to content
        </a>

        <ChromeTooltips>
          <TopBar
            slim={fullBleed}
            navOpen={navOpen}
            onOpenNav={() => setNavOpen(true)}
            actions={actions}
          />
        </ChromeTooltips>

        <div className="flex min-h-0 flex-1">
          {fullBleed ? null : (
            <ChromeTooltips>
              <Sidebar
                rail={rail}
                onRailChange={(next) => {
                  setAnimateRail(true);
                  setRail(next);
                }}
                animate={animateRail}
                footer={sidebarFooter}
              />
            </ChromeTooltips>
          )}
          <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
            {children}
          </main>
        </div>

        <ChromeTooltips>
          <MobileNav open={navOpen} onOpenChange={setNavOpen} footer={sidebarFooter} />
        </ChromeTooltips>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
    </ShellContext.Provider>
  );
}

/**
 * The shell's own tooltip timing, around its chrome only: the page keeps
 * whatever KitProviders sets, and the shell still works without it.
 */
function ChromeTooltips({ children }: { children: ReactNode }) {
  return (
    <GlassTooltipProvider delayDuration={300} skipDelayDuration={200}>
      {children}
    </GlassTooltipProvider>
  );
}

// An id missing from the registry still gets a working shell, named after the id.
function unknownApp(id: string): AppEntry {
  return {
    ...HUB_APP,
    id: id as AppEntry["id"],
    name: id,
    shortName: id,
    kind: "shared",
    url: "/",
  };
}
