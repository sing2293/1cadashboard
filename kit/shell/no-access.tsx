"use client";

import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useContext, type ReactNode } from "react";
import { Card } from "../components/card";
import { GlassButton } from "../components/glassyui/glass-button";
import { getApp } from "../config/apps";
import { cn } from "../lib/utils";
import { AppTile } from "./brand";
import { hubHref, ShellContext, useSignOut } from "./context";
import { useHubViewer } from "./hooks";
import { TEXT, TEXT_MUTED } from "./styles";

export interface NoAccessProps {
  /** The app the person was turned away from, e.g. "sales". */
  appId: string;
  /** Adds a "contact support" mail link. Pass process.env.NEXT_PUBLIC_SUPPORT_EMAIL. */
  supportEmail?: string;
  /**
   * "main" (default) for a /no-access page of its own. "div" when the page
   * already has a <main>, such as inside AppShell.
   */
  as?: "main" | "div";
  /** The heading. Defaults to "No access yet"; an admin-only screen says "Admins only". */
  title?: string;
  /**
   * The explanation under the heading, replacing the default "Your 1CleanAir
   * login hasn't been given …" sentence. With `supportEmail` set, a
   * "contact support" line follows it.
   */
  description?: ReactNode;
  /**
   * The "Sign out" button (on by default). Turn it off for a screen inside an
   * app the person can otherwise use, such as an admin-only page.
   */
  showSignOut?: boolean;
}

/**
 * The page body for every app's /no-access route, where the proxy sends
 * people whose 1CleanAir login hasn't been given this app. Needs ClerkProvider.
 *
 *   <NoAccess appId="sales" supportEmail={process.env.NEXT_PUBLIC_SUPPORT_EMAIL} />
 *
 * An admin-only screen inside an app's shell reuses it with its own words:
 *
 *   <NoAccess as="div" appId="hub" title="Admins only"
 *     description="Roles and access are managed by hub admins." showSignOut={false} />
 */
export function NoAccess({
  appId,
  supportEmail,
  as: Root = "main",
  title = "No access yet",
  description,
  showSignOut = true,
}: NoAccessProps) {
  const app = getApp(appId);
  const appName = app?.name ?? appId;
  const viewer = useHubViewer();
  // The app whose address this page is on: the shell's app when NoAccess sits inside one (the
  // hub's /apps/[id] screen shows another app's lock on the hub), else the app itself (its own
  // /no-access page). "Back to the hub" and "Sign out" leave from there.
  const shell = useContext(ShellContext);
  const hostAppId = shell?.app.id ?? appId;
  // Every session, as the apps' no-access SignOutButton did: a way out to another login.
  const signOut = useSignOut(hostAppId, { everySession: true });

  return (
    <Root
      className={cn(
        "flex items-center justify-center px-4",
        Root === "main" ? "min-h-dvh py-10" : "py-16",
        TEXT,
      )}
    >
      {/* The same card, width and spacing as the 404 and error screens (RouteStateFrame). */}
      <Card className="ca-enter w-full max-w-md text-center">
        <div className="flex flex-col items-center gap-3 px-6 py-14">
          <span className="relative mb-1">
            {app ? <AppTile app={app} size="lg" /> : null}
            <span
              aria-hidden
              className={cn(
                "grid place-items-center rounded-full bg-[color:var(--ca-surface-solid,var(--lg-opaque-surface))] shadow-md",
                app ? "absolute -bottom-1.5 -right-1.5 size-7" : "size-14",
              )}
            >
              <LockKeyhole className={app ? "size-3.5" : "size-6"} />
            </span>
          </span>
          <h1 className="text-lg font-semibold tracking-tight text-balance">{title}</h1>
          {description === undefined ? (
            <p className={cn("max-w-sm text-sm text-pretty", TEXT_MUTED)}>
              Your 1CleanAir login hasn&rsquo;t been given{" "}
              <span className={cn("font-medium", TEXT)}>{appName}</span>. Ask a hub admin to add it
              for you
              {supportEmail ? (
                <>
                  , or{" "}
                  <a href={supportHref(supportEmail, appName)} className="ca-link">
                    contact support
                  </a>
                </>
              ) : null}
              .
            </p>
          ) : (
            <>
              <div className={cn("max-w-sm text-sm text-pretty", TEXT_MUTED)}>{description}</div>
              {supportEmail ? (
                <p className={cn("max-w-sm text-sm", TEXT_MUTED)}>
                  Need a hand?{" "}
                  <a href={supportHref(supportEmail, appName)} className="ca-link">
                    Contact support
                  </a>
                  .
                </p>
              ) : null}
            </>
          )}
          {viewer.email ? (
            <p className={cn("text-xs", TEXT_MUTED)}>Signed in as {viewer.email}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <GlassButton asChild variant="prominent" size="sm" className="ca-control-sm">
              <Link href={hubHref(hostAppId)}>Back to the hub</Link>
            </GlassButton>
            {showSignOut ? (
              <GlassButton
                variant="soft"
                size="sm"
                className="ca-control-sm"
                onClick={() => void signOut()}
              >
                Sign out
              </GlassButton>
            ) : null}
          </div>
        </div>
      </Card>
    </Root>
  );
}

function supportHref(email: string, appName: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(`Access request: ${appName}`)}`;
}
