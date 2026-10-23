import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { Card, CardHeader } from './card';
import { GlassSkeleton } from './glassyui/glass-skeleton';
import { Page, type PageWidth } from './page';
import { RouteStateFrame } from './route-state-frame';

/*
 * Route states: what every app shows for a 404, a thrown error and a page still loading, so
 * these screens are themed and branded like the rest of the product instead of Next's plain
 * fallbacks (which ignore the theme cookie and paint black on white).
 *
 *   app/(group)/not-found.tsx   export default function NotFound() { return <NotFoundView appId="sales" />; }
 *   app/not-found.tsx           the same, for URLs outside every group (it centres itself)
 *   app/(group)/error.tsx       'use client' → <ErrorView error={error} reset={reset} appId="sales" />
 *   app/(group)/x/loading.tsx   export default function Loading() { return <PageSkeleton stats={4} rows={8} />; }
 *
 * NotFoundView and PageSkeleton are server-safe; ErrorView is a client component, as error.tsx
 * files must be.
 */

export { ErrorView, type ErrorViewProps } from './error-view';

export interface NotFoundViewProps {
  /** The app's registry id ("sales"). Inside AppShell it defaults to the shell's app. */
  appId?: string;
  /** Where "Back to …" leads. Defaults to the shell's home inside AppShell, else "/". */
  homeHref?: string;
  /** Defaults to "Page not found". */
  title?: string;
  /** Replaces the default explanation (inline text: it renders inside a paragraph). */
  description?: ReactNode;
}

/**
 * The whole page body of a not-found.tsx: a narrow page with a "Page not found" card and a way
 * back. Inside AppShell it sits under the shell's top bar; rendered by the root
 * app/not-found.tsx (outside every group) it centres itself and shows the app's tile and a link
 * to the hub. Server-safe.
 *
 *   export default function NotFound() {
 *     return <NotFoundView appId="uploader" homeHref="/dashboard" />;
 *   }
 */
export function NotFoundView({
  appId,
  homeHref,
  title = 'Page not found',
  description,
}: NotFoundViewProps) {
  return (
    <RouteStateFrame
      kind="not-found"
      appId={appId}
      homeHref={homeHref}
      title={title}
      description={description}
    />
  );
}

export interface PageSkeletonProps {
  /** A PageHeader-shaped placeholder: icon tile, title and description. On by default. */
  title?: boolean;
  /** How many StatCard placeholders, in the KPI grid under an "Overview"-sized heading. */
  stats?: number;
  /** How many rows in the solid table card at the bottom. 0 leaves the card out. */
  rows?: number;
  /** The Page width the real page uses, so nothing jumps when it arrives. */
  width?: PageWidth;
  /** A FilterBar-shaped row of control placeholders under the title. */
  filters?: boolean;
  /**
   * What screen readers hear while the page loads. Name the screen, as every loading.tsx should:
   * "Loading the operations report" (an ellipsis is added). The fallback is a bare "Loading".
   */
  label?: string;
}

// The KPI grid the pages use, by card count: one column at 360px, the row at xl.
const STAT_GRID: Record<number, string> = {
  1: 'grid gap-4',
  2: 'grid gap-4 sm:grid-cols-2',
  3: 'grid gap-4 sm:grid-cols-3',
  4: 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4',
  5: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  6: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6',
};

// Cell widths that vary row to row, so the placeholder reads as a table rather than stripes.
const FIRST_CELL = ['w-[72%]', 'w-[58%]', 'w-[66%]', 'w-[50%]', 'w-[62%]'];
const SECOND_CELL = ['w-[46%]', 'w-[60%]', 'w-[38%]', 'w-[54%]'];

/**
 * The body of a loading.tsx: the page's frame in placeholders (header, filters, KPI cards and a
 * table card), matching the real page's shape so it settles in place when the data streams in.
 * Marks the page busy and tells screen readers it is loading. Server-safe.
 *
 *   export default function Loading() {
 *     return <PageSkeleton filters stats={5} rows={8} label="Loading the operations report" />;
 *   }
 */
export function PageSkeleton({
  title = true,
  stats = 0,
  rows = 6,
  width = 'wide',
  filters = false,
  label = 'Loading',
}: PageSkeletonProps) {
  const statCount = Math.max(0, Math.floor(stats));
  const rowCount = Math.max(0, Math.floor(rows));

  // Phones get one row of two half-width controls, as a FilterBar of two selects lays out
  // there; wider screens get the full row.
  const filterRow = filters ? (
    <div
      aria-hidden
      className="grid grid-cols-2 items-center gap-2 rounded-2xl border border-ca bg-ca-surface p-2 sm:flex sm:flex-wrap sm:gap-3 sm:p-2.5"
    >
      <GlassSkeleton className="h-9 w-full rounded-xl sm:max-w-64" />
      <GlassSkeleton className="h-9 w-full rounded-xl sm:w-40" />
      <GlassSkeleton className="hidden h-9 w-32 rounded-xl sm:block" />
      <GlassSkeleton className="ms-auto hidden h-9 w-28 rounded-xl sm:block" />
    </div>
  ) : null;

  return (
    <Page width={width} aria-busy="true">
      <p role="status" className="sr-only">
        {`${label}…`}
      </p>

      {title ? (
        <div aria-hidden className="flex min-w-0 flex-col gap-4">
          <div className="flex min-w-0 items-start gap-3.5">
            <GlassSkeleton className="mt-0.5 size-10 shrink-0 rounded-xl" />
            <div className="flex min-w-0 flex-1 flex-col gap-2.5 pt-1">
              <GlassSkeleton className="h-7 w-56 max-w-full rounded-lg" />
              <GlassSkeleton className="h-4 w-80 max-w-full rounded-full" />
            </div>
          </div>
          {filterRow}
        </div>
      ) : (
        filterRow
      )}

      {statCount > 0 ? (
        <div aria-hidden className="flex min-w-0 flex-col gap-3">
          <GlassSkeleton className="h-4 w-24 rounded-full" />
          <div className={STAT_GRID[statCount] ?? STAT_GRID[4]}>
            {Array.from({ length: statCount }, (_, index) => (
              <Card key={index} className="gap-3 px-5 py-4">
                <GlassSkeleton className="h-4 w-24 max-w-full rounded-full" />
                <GlassSkeleton className="h-8 w-28 max-w-full rounded-lg" />
                <GlassSkeleton className="h-4 w-20 max-w-full rounded-full" />
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {rowCount > 0 ? (
        <Card aria-hidden variant="solid" className="overflow-hidden pb-0">
          <CardHeader>
            <GlassSkeleton className="h-4 w-40 max-w-full rounded-full" />
            <GlassSkeleton className="h-3.5 w-60 max-w-full rounded-full" />
          </CardHeader>
          <div className="border-t border-ca">
            <div className="flex h-10 items-center gap-4 bg-ca-surface-sunken px-5">
              <GlassSkeleton className="h-3 w-24 rounded-full" />
              <GlassSkeleton className="hidden h-3 w-20 rounded-full sm:block" />
              <GlassSkeleton className="ms-auto h-3 w-16 rounded-full" />
            </div>
            {Array.from({ length: rowCount }, (_, index) => (
              <div
                key={index}
                className="flex h-12 items-center gap-4 border-t border-ca px-5"
                style={{ opacity: Math.max(0.4, 1 - index * 0.07) }}
              >
                <div className="min-w-0 flex-[3]">
                  <GlassSkeleton
                    className={cn('h-4 rounded-full', FIRST_CELL[index % FIRST_CELL.length])}
                  />
                </div>
                <div className="hidden min-w-0 flex-[2] sm:block">
                  <GlassSkeleton
                    className={cn('h-4 rounded-full', SECOND_CELL[index % SECOND_CELL.length])}
                  />
                </div>
                <GlassSkeleton className="h-4 w-16 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </Page>
  );
}
