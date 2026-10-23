import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/utils';
import { GlassPanel } from './glassyui/glass-panel';

export type CardVariant = 'glass' | 'solid' | 'sunken';

export interface CardProps extends ComponentProps<'div'> {
  /**
   * "glass" (default): GlassyUI frost, for summaries, KPIs and short content.
   * "solid": an opaque panel (.ca-solid), for tables, charts, maps and long lists.
   * "sunken": a recessed well inside another surface.
   */
  variant?: CardVariant;
  /** Lifts on hover with a faint accent rim. On by default when `href` is set. */
  interactive?: boolean;
  /**
   * Makes the whole card one link (next/link). Keep buttons and other links out of a linked
   * card; for several actions use buttons in a CardFooter instead.
   */
  href?: string;
  /** With `href`: "_blank" opens a new tab (rel="noopener noreferrer" is added). */
  target?: string;
}

const VARIANT: Record<CardVariant, string> = {
  // GlassPanel brings position, radius, frost and shadow; the parts below pad themselves.
  glass: 'px-0',
  solid: 'ca-solid relative border border-ca shadow-ca',
  sunken: 'relative border border-ca bg-ca-surface-sunken text-ca-text',
};

/**
 * A rounded-2xl surface for one block of content. Compose it from CardHeader (CardTitle,
 * CardDescription), CardContent and CardFooter, which carry the 20px side padding; the card
 * spaces them 16px apart. Server-safe.
 *
 *   <Card>
 *     <CardHeader actions={<GlassButton size="sm" variant="ghost">View all</GlassButton>}>
 *       <CardTitle>Top technicians</CardTitle>
 *       <CardDescription>Revenue this month</CardDescription>
 *     </CardHeader>
 *     <CardContent>…</CardContent>
 *   </Card>
 */
export function Card({
  variant = 'glass',
  interactive,
  href,
  target,
  className,
  children,
  ...props
}: CardProps) {
  const lift = interactive ?? Boolean(href);
  const classes = cn(
    'flex min-w-0 flex-col gap-4 rounded-2xl py-5',
    VARIANT[variant],
    lift && 'ca-lift',
    className,
  );

  const card =
    variant === 'glass' ? (
      <GlassPanel
        {...props}
        variant="card"
        preset="standard"
        refraction="none"
        lens={false}
        interactive={lift}
        className={classes}
      >
        {children}
      </GlassPanel>
    ) : (
      <div {...props} className={classes}>
        {children}
      </div>
    );

  if (!href) return card;

  return (
    <Link
      href={href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      // A one-cell grid, so the card still fills a stretched grid or flex cell.
      className="grid min-w-0 rounded-2xl"
    >
      {card}
    </Link>
  );
}

export interface CardHeaderProps extends ComponentProps<'div'> {
  /**
   * Controls on the right of the title, such as a menu, a small ghost button or a ChartLegend.
   * When the title would get less than 9rem, they drop under it instead of squeezing it.
   */
  actions?: ReactNode;
  /** A hairline under the header. */
  divided?: boolean;
}

export function CardHeader({ actions, divided = false, className, children, ...props }: CardHeaderProps) {
  return (
    <div
      {...props}
      className={cn(
        'flex min-w-0 flex-wrap items-start justify-between gap-3 px-5',
        divided && 'border-b border-ca pb-4',
        className,
      )}
    >
      {/* A 9rem basis: the row wraps once the title would get less, so a legend or the actions
          move under the title on a narrow card and stay on the right on a wide one. */}
      <div className="flex min-w-0 grow basis-[min(100%,9rem)] flex-col gap-1">{children}</div>
      {actions ? (
        <div className="-my-1 flex max-w-full shrink-0 items-center gap-1.5">{actions}</div>
      ) : null}
    </div>
  );
}

export interface CardTitleProps extends Omit<ComponentProps<'h3'>, 'ref'> {
  /** The heading level. h3 suits a card inside a Section (h2); use h2 for a card directly on a page. */
  as?: 'h2' | 'h3' | 'h4' | 'p' | 'div';
}

export function CardTitle({ as: Tag = 'h3', className, ...props }: CardTitleProps) {
  return (
    <Tag {...props} className={cn('text-sm font-semibold tracking-tight text-ca-text', className)} />
  );
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p {...props} className={cn('text-sm text-pretty text-ca-muted', className)} />;
}

export interface CardContentProps extends ComponentProps<'div'> {
  /** No side padding, for a table, chart or list that runs edge to edge. */
  flush?: boolean;
}

export function CardContent({ flush = false, className, ...props }: CardContentProps) {
  return <div {...props} className={cn('min-w-0', flush ? 'px-0' : 'px-5', className)} />;
}

export interface CardFooterProps extends ComponentProps<'div'> {
  /** A hairline above the footer. */
  divided?: boolean;
}

export function CardFooter({ divided = false, className, ...props }: CardFooterProps) {
  return (
    <div
      {...props}
      className={cn(
        'flex flex-wrap items-center gap-2 px-5 text-sm text-ca-muted',
        divided && 'border-t border-ca pt-4',
        className,
      )}
    />
  );
}
