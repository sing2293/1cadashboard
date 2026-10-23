"use client";

import { useClerk } from "@clerk/nextjs";
import {
  ArrowUpRight,
  Check,
  CornerDownLeft,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { isValidElement } from "react";
import {
  GlassCommand,
  GlassCommandDialog,
  GlassCommandEmpty,
  GlassCommandGroup,
  GlassCommandInput,
  GlassCommandItem,
  GlassCommandList,
  GlassCommandShortcut,
} from "../components/glassyui/glass-command";
import { GlassKbd } from "../components/glassyui/glass-kbd";
import { canManageAccess } from "../config/access";
import type { AppEntry } from "../config/apps";
import { cn } from "../lib/utils";
import { useThemeChoice, type ThemeChoice } from "../theme";
import { AppTile } from "./brand";
import { hubHref, useShell, useSignOut } from "./context";
import { isExternalHref, withSearch } from "./nav-model";
import { TEXT_MUTED } from "./styles";
import type { NavItem } from "./types";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * ⌘K / Ctrl+K: this app's pages, the other apps this person may open, the
 * theme, and account actions. Arrow keys move, Enter runs, Escape closes and
 * hands focus back to wherever it was.
 */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { app, nav, apps, viewer, preserveSearchParams } = useShell();
  const router = useRouter();
  const clerk = useClerk();
  const signOut = useSignOut(app.id);

  // Close first, so focus is back on the page before it changes.
  const run = (action: () => void) => () => {
    onOpenChange(false);
    action();
  };

  const go = (href: string) => {
    if (isExternalHref(href)) window.open(href, "_blank", "noopener,noreferrer");
    else router.push(preserveSearchParams ? withSearch(href, window.location.search) : href);
  };

  const openApp = (entry: AppEntry) => {
    if (entry.kind === "external") window.open(entry.url, "_blank", "noopener,noreferrer");
    else window.location.assign(entry.url);
  };

  const pages = flattenWithParents(nav);
  const otherApps = apps.filter((entry) => entry.id !== app.id);

  return (
    <GlassCommandDialog open={open} onOpenChange={onOpenChange} title="Search and commands">
      <GlassCommand loop>
        <GlassCommandInput placeholder="Search pages, apps and actions…" />
        <GlassCommandList>
          <GlassCommandEmpty>Nothing matches that</GlassCommandEmpty>

          {pages.length > 0 ? (
            <GlassCommandGroup heading={app.name}>
              {pages.map(({ item, parent }) => (
                <GlassCommandItem
                  key={`page:${item.href}:${parent ?? ""}`}
                  value={`page ${item.label} ${parent ?? ""} ${item.href}`}
                  keywords={parent ? [parent] : undefined}
                  onSelect={run(() => go(item.href))}
                >
                  <PageIcon icon={item.icon} />
                  <span className="min-w-0 truncate">{item.label}</span>
                  {parent ? (
                    <span className={cn("truncate text-xs", TEXT_MUTED)}>in {parent}</span>
                  ) : null}
                  {isExternalHref(item.href) ? (
                    <GlassCommandShortcut>
                      <ArrowUpRight aria-hidden className="size-3.5" />
                      <span className="sr-only">Opens in a new tab</span>
                    </GlassCommandShortcut>
                  ) : null}
                </GlassCommandItem>
              ))}
            </GlassCommandGroup>
          ) : null}

          {otherApps.length > 0 ? (
            <GlassCommandGroup heading="Apps">
              {otherApps.map((entry) => (
                <GlassCommandItem
                  key={`app:${entry.id}`}
                  value={`app ${entry.name} ${entry.shortName}`}
                  keywords={[entry.id, entry.description]}
                  onSelect={run(() => openApp(entry))}
                >
                  <AppTile app={entry} size="xs" />
                  <span className="min-w-0 truncate">{entry.name}</span>
                  {entry.kind === "external" ? (
                    <GlassCommandShortcut>
                      Own login
                      <ArrowUpRight aria-hidden className="ml-0.5 size-3.5" />
                      <span className="sr-only">, opens in a new tab</span>
                    </GlassCommandShortcut>
                  ) : null}
                </GlassCommandItem>
              ))}
            </GlassCommandGroup>
          ) : null}

          <ThemeCommands run={run} />

          <GlassCommandGroup heading="Account">
            <GlassCommandItem
              value="account manage account"
              keywords={["profile", "password", "email", "security", "two-step", "devices", "sessions"]}
              onSelect={run(() => clerk.openUserProfile())}
            >
              <UserCog aria-hidden />
              Manage account
            </GlassCommandItem>
            {canManageAccess(viewer.access) ? (
              <GlassCommandItem
                value="account roles and access"
                keywords={["admin", "permissions", "people", "invite"]}
                onSelect={run(() => window.location.assign(hubHref(app.id, "/admin")))}
              >
                <ShieldCheck aria-hidden />
                Roles &amp; access
              </GlassCommandItem>
            ) : null}
            {app.kind === "hub" ? null : (
              <GlassCommandItem
                value="account back to hub"
                keywords={["home", "apps"]}
                onSelect={run(() => window.location.assign(hubHref(app.id)))}
              >
                <LayoutDashboard aria-hidden />
                Back to hub
              </GlassCommandItem>
            )}
            <GlassCommandItem
              value="account sign out"
              keywords={["log out", "logout", "switch account"]}
              onSelect={run(() => void signOut())}
            >
              <LogOut aria-hidden />
              Sign out
            </GlassCommandItem>
          </GlassCommandGroup>
        </GlassCommandList>
        {/* The keyboard legend; touch screens have no keys to press, so it hides there. */}
        <div
          aria-hidden
          className={cn(
            "flex items-center justify-end gap-3 border-t border-[color:var(--lg-border)] px-4 py-2 text-xs [@media(pointer:coarse)]:hidden",
            TEXT_MUTED,
          )}
        >
          <span className="flex items-center gap-1.5">
            <GlassKbd>↑</GlassKbd>
            <GlassKbd>↓</GlassKbd>
            to move
          </span>
          <span className="flex items-center gap-1.5">
            <GlassKbd>
              <CornerDownLeft className="size-3" />
            </GlassKbd>
            to open
          </span>
          <span className="flex items-center gap-1.5">
            <GlassKbd>esc</GlassKbd>
            to close
          </span>
        </div>
      </GlassCommand>
    </GlassCommandDialog>
  );
}

const THEMES: readonly { value: ThemeChoice; label: string; Icon: LucideIcon }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "Match system", Icon: Monitor },
];

/** Light / Dark / System, shared with every 1cleanair.info app. Absent where an app pins its theme. */
function ThemeCommands({ run }: { run: (action: () => void) => () => void }) {
  const { choice, forcedTheme, setChoice } = useThemeChoice();
  if (forcedTheme) return null;

  return (
    <GlassCommandGroup heading="Theme">
      {THEMES.map(({ value, label, Icon }) => (
        <GlassCommandItem
          key={value}
          value={`theme ${label}`}
          keywords={["appearance", "mode", "colour", "color", value]}
          onSelect={run(() => setChoice(value))}
        >
          <Icon aria-hidden />
          {label}
          {choice === value ? (
            <GlassCommandShortcut>
              <Check aria-hidden className="size-4" />
              <span className="sr-only">(current)</span>
            </GlassCommandShortcut>
          ) : null}
        </GlassCommandItem>
      ))}
    </GlassCommandGroup>
  );
}

function PageIcon({ icon }: { icon: NavItem["icon"] }) {
  if (isValidElement(icon)) {
    return (
      <span
        aria-hidden
        className="grid size-[18px] shrink-0 place-items-center [&>svg]:size-[18px]"
      >
        {icon}
      </span>
    );
  }
  if (icon) {
    const Icon = icon as LucideIcon;
    return <Icon aria-hidden />;
  }
  return <span aria-hidden className="size-[18px] shrink-0" />;
}

function flattenWithParents(
  items: NavItem[],
  parent?: string,
): { item: NavItem; parent?: string }[] {
  return items.flatMap((item) => [
    { item, parent },
    ...flattenWithParents(item.children ?? [], item.label),
  ]);
}
