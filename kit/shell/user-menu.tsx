"use client";

import { useClerk } from "@clerk/nextjs";
import { LayoutDashboard, LogIn, LogOut, ShieldCheck, UserCog } from "lucide-react";
import { GlassAvatar } from "../components/glassyui/glass-avatar";
import { GlassButton } from "../components/glassyui/glass-button";
import {
  GlassMenu,
  GlassMenuContent,
  GlassMenuItem,
  GlassMenuSeparator,
  GlassMenuTrigger,
} from "../components/glassyui/glass-menu";
import { canManageAccess } from "../config/access";
import { cn } from "../lib/utils";
import { hubHref, useShell, useSignOut } from "./context";
import { FOCUS_RING, TEXT_MUTED, WASH } from "./styles";

/**
 * The person's avatar, opening a menu with who they are, their Clerk account
 * (password, email, two-step verification, signed-in devices, photo), Roles &
 * access (for those who manage it), the hub, and sign out.
 */
export function UserMenu() {
  const { app, viewer } = useShell();
  const clerk = useClerk();
  const signOut = useSignOut(app.id);

  if (!viewer.isLoaded) {
    return (
      <span
        aria-hidden
        className={cn("size-8 shrink-0 rounded-full motion-ok:animate-pulse", WASH)}
      />
    );
  }

  // Behind each app's proxy this never shows; it keeps a public page usable.
  if (!viewer.isSignedIn) {
    return (
      <GlassButton asChild variant="soft" size="sm" className="shrink-0">
        <a href={hubHref(app.id, "/sign-in")}>
          <LogIn aria-hidden className="size-4" />
          Sign in
        </a>
      </GlassButton>
    );
  }

  const name = viewer.name || "Your account";
  const avatar = {
    alt: "",
    name: viewer.name || viewer.email || undefined,
    src: viewer.imageUrl ?? undefined,
  };
  const managesAccess = canManageAccess(viewer.access);
  const onHub = app.kind === "hub";

  return (
    <GlassMenu>
      <GlassMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Account: ${name}`}
          className={cn("shrink-0 rounded-full", FOCUS_RING)}
        >
          <GlassAvatar {...avatar} size="sm" />
        </button>
      </GlassMenuTrigger>
      <GlassMenuContent align="end" className="w-64">
        <div className="flex items-center gap-3 px-3 py-2">
          <GlassAvatar {...avatar} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            {viewer.email ? (
              <p className={cn("truncate text-xs", TEXT_MUTED)}>{viewer.email}</p>
            ) : null}
          </div>
        </div>
        <GlassMenuSeparator />
        {/* Clerk's own account screen, in a modal: what "Manage account" in Clerk's
            UserButton opened before the shell replaced it. */}
        <GlassMenuItem onSelect={() => clerk.openUserProfile()}>
          <UserCog aria-hidden />
          Manage account
        </GlassMenuItem>
        {managesAccess ? (
          <GlassMenuItem asChild>
            <a href={hubHref(app.id, "/admin")}>
              <ShieldCheck aria-hidden />
              Roles &amp; access
            </a>
          </GlassMenuItem>
        ) : null}
        {onHub ? null : (
          <GlassMenuItem asChild>
            <a href={hubHref(app.id)}>
              <LayoutDashboard aria-hidden />
              Back to hub
            </a>
          </GlassMenuItem>
        )}
        <GlassMenuSeparator />
        <GlassMenuItem onSelect={() => void signOut()}>
          <LogOut aria-hidden />
          Sign out
        </GlassMenuItem>
      </GlassMenuContent>
    </GlassMenu>
  );
}
