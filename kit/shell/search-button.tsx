"use client";

import { Search } from "lucide-react";
import { GlassKbd, GlassKbdGroup } from "../components/glassyui/glass-kbd";
import { cn } from "../lib/utils";
import { useShell } from "./context";
import { useIsApplePlatform } from "./hooks";
import { BORDER, FOCUS_RING, TEXT_MUTED, TRANSITION, WASH_HOVER } from "./styles";

/**
 * Opens the ⌘K palette. A search field from 640px up; on a phone, an icon
 * button like its neighbours.
 */
export function SearchButton({ className }: { className?: string }) {
  const { openPalette } = useShell();
  const apple = useIsApplePlatform();

  return (
    <button
      type="button"
      onClick={openPalette}
      aria-haspopup="dialog"
      aria-keyshortcuts="Meta+K Control+K"
      className={cn(
        "flex h-9 shrink-0 items-center gap-2 rounded-full text-sm",
        "w-9 justify-center",
        WASH_HOVER,
        "sm:w-52 sm:justify-start sm:border sm:pl-3 sm:pr-1.5 lg:w-64",
        "sm:bg-[color:var(--lg-control-surface)] sm:hover:bg-[color:var(--lg-control-surface-hover)]",
        BORDER,
        TEXT_MUTED,
        FOCUS_RING,
        TRANSITION,
        className,
      )}
    >
      <Search aria-hidden className="size-[18px] shrink-0 sm:size-4" />
      <span className="hidden min-w-0 flex-1 truncate text-left sm:inline">Search or jump to…</span>
      <span className="sr-only sm:hidden">Search or jump to</span>
      <GlassKbdGroup aria-hidden className="hidden sm:inline-flex">
        <GlassKbd className={apple ? undefined : "px-1.5"}>{apple ? "⌘" : "Ctrl"}</GlassKbd>
        <GlassKbd>K</GlassKbd>
      </GlassKbdGroup>
    </button>
  );
}
