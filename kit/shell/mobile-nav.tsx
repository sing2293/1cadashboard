"use client";

import type { ReactNode } from "react";
import {
  GlassSheet,
  GlassSheetContent,
  GlassSheetTitle,
} from "../components/glassyui/glass-sheet";
import { cn } from "../lib/utils";
import { AppSwitcher } from "./app-switcher";
import { useShell } from "./context";
import { RoutedNavList } from "./nav-list";
import { BORDER, TEXT_MUTED } from "./styles";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  footer?: ReactNode;
}

/**
 * The sidebar as a sheet from the left, opened by the top bar's menu button:
 * on phones, and on full-bleed pages at any width. Following a link closes it.
 */
export function MobileNav({ open, onOpenChange, footer }: MobileNavProps) {
  const { app } = useShell();
  const close = () => onOpenChange(false);

  return (
    <GlassSheet open={open} onOpenChange={onOpenChange}>
      <GlassSheetContent
        side="left"
        closeLabel="Close navigation"
        aria-describedby={undefined}
        className="w-[min(20rem,calc(100vw-1rem))] gap-2 p-3 [--lg-panel-radius:1.5rem]"
      >
        <GlassSheetTitle className="sr-only">{app.name} navigation</GlassSheetTitle>
        {/* Room on the right for the sheet's own close button. */}
        <div className="shrink-0 pr-11">
          <AppSwitcher onNavigate={close} />
        </div>
        <nav aria-label={app.name} className="min-h-0 flex-1 overflow-y-auto px-0.5 py-1">
          <RoutedNavList rail={false} onNavigate={close} />
        </nav>
        {footer ? (
          <div className={cn("shrink-0 border-t px-1 pt-3 text-xs", BORDER, TEXT_MUTED)}>
            {footer}
          </div>
        ) : null}
      </GlassSheetContent>
    </GlassSheet>
  );
}
