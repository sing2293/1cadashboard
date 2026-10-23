import type { ComponentProps, ReactNode } from 'react';
import { renderIcon, type IconProp } from '../lib/render-icon';
import { cn } from '../lib/utils';

export interface EmptyStateProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** A lucide icon (`Inbox`, `SearchX`) or an element. */
  icon?: IconProp;
  /** What is missing, in a few words: "No calls yet". */
  title: ReactNode;
  /** Why, or what to do next. */
  description?: ReactNode;
  /** One next step, usually a GlassButton. */
  action?: ReactNode;
  /** "md" (default) for a page or card; "sm" inside a table or a narrow panel. */
  size?: 'sm' | 'md';
  /**
   * The title's element. "p" (default) inside a page that has its own headings; "h1" when the
   * empty state is the whole page (a 404, an admin-only screen); h2/h3 inside a Section or Card.
   */
  titleAs?: 'p' | 'h1' | 'h2' | 'h3' | 'h4';
  /** The icon tile's colour: "accent" (default), or a status tone such as "danger" for an error. */
  tone?: EmptyStateTone;
}

export type EmptyStateTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger';

const TILE_TONE: Record<EmptyStateTone, string> = {
  accent:
    'bg-ca-accent-soft text-ca-accent before:bg-[radial-gradient(closest-side,var(--ca-accent-soft),transparent)]',
  neutral:
    'bg-ca-muted/12 text-ca-muted before:bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--ca-text-muted)_12%,transparent),transparent)]',
  success:
    'bg-ca-success-soft text-ca-success before:bg-[radial-gradient(closest-side,var(--ca-success-soft),transparent)]',
  warning:
    'bg-ca-warning-soft text-ca-warning before:bg-[radial-gradient(closest-side,var(--ca-warning-soft),transparent)]',
  danger:
    'bg-ca-danger-soft text-ca-danger before:bg-[radial-gradient(closest-side,var(--ca-danger-soft),transparent)]',
};

/**
 * What a list, table or page shows when it has nothing: an icon in a soft halo, a title, a
 * hint and one action. Server-safe. Inside a table use TableEmpty, which wraps this.
 *
 *   <EmptyState icon={SearchX} title="No matches" description="Try a wider date range."
 *     action={<GlassButton size="sm" variant="soft">Clear filters</GlassButton>} />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  titleAs: Title = 'p',
  tone = 'accent',
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      {...props}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        size === 'sm' ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-14',
        className,
      )}
    >
      {icon ? (
        <span
          className={cn(
            'relative isolate mb-1 grid place-items-center rounded-2xl shadow-[inset_0_0_0_1px_var(--ca-border)]',
            // A soft halo in the tile's colour behind it.
            'before:absolute before:-inset-3 before:-z-10 before:rounded-full',
            TILE_TONE[tone],
            size === 'sm' ? 'size-10' : 'size-12',
          )}
        >
          {renderIcon(icon, size === 'sm' ? 'size-5' : 'size-6')}
        </span>
      ) : null}
      <Title
        className={cn(
          'font-semibold text-balance text-ca-text',
          Title === 'h1' ? 'text-lg tracking-tight' : 'text-sm',
        )}
      >
        {title}
      </Title>
      {description ? (
        <p className="max-w-sm text-sm text-pretty text-ca-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
