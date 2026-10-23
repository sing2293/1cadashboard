"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { ReactNode } from "react";
import { GlassSurface } from "../components/glassyui/glass-surface";
import {
  GlassTooltip,
  GlassTooltipContent,
  GlassTooltipTrigger,
} from "../components/glassyui/glass-tooltip";
import { cn } from "../lib/utils";
import { AppSwitcher } from "./app-switcher";
import { useShell } from "./context";
import { RoutedNavList } from "./nav-list";
import { BORDER, FOCUS_RING, TEXT_MUTED, TRANSITION, WASH_HOVER } from "./styles";

interface SidebarProps {
  /** The 64px icon rail instead of the full 248px sidebar. */
  rail: boolean;
  onRailChange: (rail: boolean) => void;
  /** Animate the width; off until the person toggles, so a remembered rail doesn't slide in on load. */
  animate: boolean;
  footer?: ReactNode;
}

/**
 * The desktop sidebar (768px and up): the app switcher, the app's links, a
 * footer, and the toggle between the full sidebar and the icon rail.
 */
export function Sidebar({ rail, onRailChange, animate, footer }: SidebarProps) {
  const { app } = useShell();
  const toggleLabel = rail ? "Expand sidebar" : "Collapse sidebar";

  const toggle = (
    <button
      type="button"
      onClick={() => onRailChange(!rail)}
      aria-label={rail ? toggleLabel : undefined}
      className={cn(
        "flex h-9 items-center gap-3 rounded-[10px] text-sm font-medium",
        rail ? "mx-auto w-10 justify-center" : "w-full px-2.5",
        TEXT_MUTED,
        WASH_HOVER,
        FOCUS_RING,
        TRANSITION,
      )}
    >
      {rail ? (
        <PanelLeftOpen aria-hidden className="size-[18px] shrink-0" strokeWidth={1.9} />
      ) : (
        <PanelLeftClose aria-hidden className="size-[18px] shrink-0" strokeWidth={1.9} />
      )}
      {rail ? null : <span className="truncate">{toggleLabel}</span>}
    </button>
  );

  return (
    <aside
      aria-label="Sidebar"
      className={cn(
        "sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 py-2 pl-2 md:block",
        rail ? "w-[4.5rem]" : "w-62",
        animate && "transition-[width] duration-200 ease-out motion-reduce:transition-none",
      )}
    >
      {/* A card on the page backdrop: the brand's translucent surface tints its frost. */}
      <GlassSurface
        preset="standard"
        className="flex h-full flex-col rounded-[20px] before:bg-[color:var(--ca-surface,rgb(255_255_255/0.08))]"
      >
        <div className="shrink-0 p-2">
          <AppSwitcher rail={rail} />
        </div>
        <nav
          aria-label={app.name}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-1.5 [scrollbar-width:thin]"
        >
          <RoutedNavList rail={rail} />
        </nav>
        {footer && !rail ? (
          <div className={cn("shrink-0 border-t px-3 py-3 text-xs", BORDER, TEXT_MUTED)}>
            {footer}
          </div>
        ) : null}
        <div className={cn("shrink-0 border-t p-2", BORDER)}>
          {rail ? (
            <GlassTooltip>
              <GlassTooltipTrigger asChild>{toggle}</GlassTooltipTrigger>
              <GlassTooltipContent side="right">{toggleLabel}</GlassTooltipContent>
            </GlassTooltip>
          ) : (
            toggle
          )}
        </div>
      </GlassSurface>
    </aside>
  );
}
