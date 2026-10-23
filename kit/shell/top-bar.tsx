"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { GlassButton } from "../components/glassyui/glass-button";
import { GlassSurface } from "../components/glassyui/glass-surface";
import { cn } from "../lib/utils";
import { ThemeToggle } from "../theme";
import { BrandMark } from "./brand";
import { useShell } from "./context";
import { SearchButton } from "./search-button";
import { FOCUS_RING, TEXT_MUTED } from "./styles";
import { UserMenu } from "./user-menu";

interface TopBarProps {
  /** Wallboards: a slimmer bar, and the menu button at every width. */
  slim: boolean;
  navOpen: boolean;
  onOpenNav: () => void;
  actions?: ReactNode;
}

/**
 * The glass bar across the top: the menu button (phones, wallboards), 1CleanAir
 * and the app's name, search, the app's actions, theme and account.
 */
export function TopBar({ slim, navOpen, onOpenNav, actions }: TopBarProps) {
  const { app, homeHref } = useShell();
  const isHub = app.kind === "hub";

  // z-40 keeps the bar over a page's own sticky headers (z-30 and below), while
  // dialogs, sheets and an app's own z-50 overlays still cover it.
  return (
    <header className={cn("sticky top-0 z-40 shrink-0", slim ? "h-12" : "h-14")}>
      {/* Pages scroll under the bar, so its frost carries GlassyUI's overlay tint, which keeps
          the bar's text at 4.5:1 over a white or a black page. */}
      <GlassSurface
        preset="standard"
        className="flex h-full items-center gap-1.5 rounded-none px-2 before:bg-[color:var(--lg-overlay-surface)] sm:gap-2 sm:px-3"
      >
        <GlassButton
          variant="ghost"
          size="sm"
          onClick={onOpenNav}
          aria-label="Open navigation"
          aria-haspopup="dialog"
          aria-expanded={navOpen}
          className={cn("size-9 shrink-0 p-0", !slim && "md:hidden")}
        >
          <Menu aria-hidden className="size-5" />
        </GlassButton>

        <Link
          href={homeHref}
          className={cn("flex min-w-0 items-center gap-2.5 rounded-lg py-1 pl-1 pr-2", FOCUS_RING)}
        >
          <BrandMark size="sm" />
          <span className="flex min-w-0 items-baseline gap-2">
            <span
              className={cn(
                "shrink-0 text-[15px] font-semibold tracking-tight",
                isHub ? "inline" : "hidden sm:inline",
              )}
            >
              1CleanAir
            </span>
            {isHub ? (
              <span className={cn("text-[15px] font-medium", TEXT_MUTED)}>Hub</span>
            ) : (
              <>
                <span aria-hidden className={cn("hidden select-none sm:inline", TEXT_MUTED)}>
                  /
                </span>
                <span className="min-w-0 truncate text-sm font-medium">
                  <span className="sm:hidden">{app.shortName}</span>
                  <span className="hidden sm:inline">{app.name}</span>
                </span>
              </>
            )}
          </span>
          <span className="sr-only">, home</span>
        </Link>

        <div className="min-w-2 flex-1" />

        <SearchButton />
        {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
        <ThemeToggle variant="menu" className="size-9 shrink-0 p-0" />
        <UserMenu />
      </GlassSurface>
    </header>
  );
}
