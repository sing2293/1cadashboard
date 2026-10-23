import type { ComponentProps, ReactNode } from 'react';
import { renderIcon, type IconProp } from '../lib/render-icon';
import { cn } from '../lib/utils';

export interface PageHeaderProps extends Omit<ComponentProps<'header'>, 'title'> {
  /** The page's name. Rendered as the page's one <h1>. */
  title: ReactNode;
  /** One or two sentences under the title. */
  description?: ReactNode;
  /** Buttons and controls on the right (they wrap under the title on phones). */
  actions?: ReactNode;
  /** A lucide icon (`ChartLine`) or an element, shown in a soft accent tile beside the title. */
  icon?: IconProp;
  /** A small line above the title: the area of the app, a breadcrumb, a date. */
  eyebrow?: ReactNode;
  /**
   * Keeps the header pinned under the app shell's top bar on a frosted band while the page
   * scrolls, from 768px wide and 500px tall up. On phones and short landscape screens it
   * scrolls away with the page, so it never covers a third of the screen. Designed for the
   * first child of <Page>, whose gutters it bleeds into.
   */
  sticky?: boolean;
  /** A row under the title, such as GlassTabs or a FilterBar. */
  children?: ReactNode;
}

/**
 * The top of every page: title (text-2xl), description, actions, and an optional icon,
 * eyebrow and extra row. Server-safe.
 *
 *   <PageHeader
 *     icon={ChartLine}
 *     eyebrow="Reports"
 *     title="Sales overview"
 *     description="ServiceMonster revenue across every company."
 *     actions={<GlassButton size="sm" className="ca-control-sm">Export</GlassButton>}
 *   />
 */
export function PageHeader({
  title,
  description,
  actions,
  icon,
  eyebrow,
  sticky = false,
  children,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      {...props}
      className={cn(
        'flex min-w-0 flex-col gap-4',
        sticky && [
          'ca-frost sticky top-[var(--ca-shell-top,0px)] z-30 border-b border-ca',
          // Pinned only where there is room for it: not on phones, not on a landscape phone.
          'max-md:static [@media(max-height:31.25rem)]:static',
          // Bleed to the Page's edges and up to the top bar, then pad back in.
          '-mx-[var(--ca-page-gutter,0px)] -mt-[var(--ca-page-top,0px)] px-[var(--ca-page-gutter,1rem)] pt-[calc(var(--ca-page-top,1rem)*0.75)] pb-4',
        ],
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        {/* A real basis (20rem, or the whole row when narrower), so the row wraps and the
            actions drop under the title on phones instead of squeezing it. */}
        <div className="flex min-w-0 grow basis-[min(100%,20rem)] items-start gap-3.5">
          {icon ? (
            <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-ca-accent-soft text-ca-accent shadow-[inset_0_0_0_1px_var(--ca-border)]">
              {renderIcon(icon, 'size-5')}
            </span>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? (
              <div className="mb-1 text-xs font-medium tracking-wide text-ca-muted">{eyebrow}</div>
            ) : null}
            <h1 className="text-2xl font-semibold tracking-tight text-balance text-ca-text">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 max-w-3xl text-sm text-pretty text-ca-muted">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex max-w-full shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {children}
    </header>
  );
}
