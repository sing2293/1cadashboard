'use client';

import { SearchX, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useContext, type ReactNode } from 'react';
import { getApp, HUB_APP_ID, HUB_URL } from '../config/apps';
import { AppTile, BrandMark } from '../shell/brand';
import { ShellContext } from '../shell/context';
import { Card } from './card';
import { EmptyState } from './empty-state';
import { GlassButton } from './glassyui/glass-button';
import { Page } from './page';

/*
 * The shared body of the 404 and error screens (NotFoundView, ErrorView). Internal: apps use
 * those two from @1ca/ui/components/route-states.
 *
 * It works out where it is rendered. Inside AppShell (an app's group not-found.tsx or
 * error.tsx) it is a narrow page under the shell's top bar. Outside it (the root
 * app/not-found.tsx, which Next renders for unmatched URLs without any group layout) it
 * centres itself on the screen like NoAccess, owns the <main> landmark and signs itself with
 * the app's tile, so the page is never unbranded.
 */

export type RouteStateKind = 'not-found' | 'error';

export interface RouteStateFrameProps {
  kind: RouteStateKind;
  /** The app's registry id. Inside AppShell it defaults to the shell's app. */
  appId?: string;
  /** Where "Back to …" leads. Defaults to the shell's home inside AppShell, else "/". */
  homeHref?: string;
  title: string;
  /** Replaces the default explanation. */
  description?: ReactNode;
  /** The error's digest, shown as a reference to quote to support. */
  digest?: string;
  /** The main action, placed before "Back to …" (the error screen's "Try again"). */
  primaryAction?: ReactNode;
}

export function RouteStateFrame({
  kind,
  appId,
  homeHref,
  title,
  description,
  digest,
  primaryAction,
}: RouteStateFrameProps) {
  const shell = useContext(ShellContext);
  const app = (appId ? getApp(appId) : undefined) ?? shell?.app;
  const home = homeHref ?? shell?.homeHref ?? '/';
  const isHub = app?.id === HUB_APP_ID;
  const appName = app ? (isHub ? 'the hub' : app.name) : 'the start';
  const backLabel = !app ? 'Back to the start' : isHub ? 'Back to the hub' : `Back to ${app.shortName}`;
  const standalone = shell === null;

  const explanation =
    description ??
    (kind === 'not-found' ? (
      <>This page doesn&rsquo;t exist or has moved. Check the address, or go back to {appName}.</>
    ) : (
      <>
        This page couldn&rsquo;t load. It&rsquo;s often a passing problem, so try again in a
        moment.
        {digest ? ' If it keeps happening, send support the reference below.' : null}
      </>
    ));

  const body = (
    <Card className="ca-enter">
      <EmptyState
        titleAs="h1"
        tone={kind === 'error' ? 'danger' : 'accent'}
        icon={kind === 'error' ? TriangleAlert : SearchX}
        title={title}
        description={
          <>
            {explanation}
            {digest ? (
              <span className="mt-3 block text-xs">
                Reference <code className="ca-code">{digest}</code>
              </span>
            ) : null}
          </>
        }
        action={
          <>
            {primaryAction}
            <GlassButton
              asChild
              variant={primaryAction ? 'soft' : 'prominent'}
              size="sm"
              className="ca-control-sm"
            >
              <Link href={home}>{backLabel}</Link>
            </GlassButton>
            {standalone && !isHub ? (
              <GlassButton asChild variant="ghost" size="sm" className="ca-control-sm">
                <a href={HUB_URL}>1CleanAir Hub</a>
              </GlassButton>
            ) : null}
          </>
        }
      />
    </Card>
  );

  if (!standalone) return <Page width="narrow">{body}</Page>;

  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10"
    >
      <div className="w-full max-w-md">{body}</div>
      <p className="flex items-center gap-2 text-xs font-medium text-ca-muted">
        {app && !isHub ? <AppTile app={app} size="xs" /> : <BrandMark size="xs" />}
        {app && !isHub ? `1CleanAir · ${app.name}` : '1CleanAir Hub'}
      </p>
    </main>
  );
}
