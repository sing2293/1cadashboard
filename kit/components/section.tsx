import { useId, type ComponentProps, type ReactNode } from 'react';
import { renderIcon, type IconProp } from '../lib/render-icon';
import { cn } from '../lib/utils';

export interface SectionProps extends Omit<ComponentProps<'section'>, 'title'> {
  /** The section's heading (text-sm, semibold). Also names the region for assistive technology. */
  title?: ReactNode;
  description?: ReactNode;
  /** Controls on the right of the heading: a GlassSegmentedControl, a "View all" link. */
  actions?: ReactNode;
  /** A small lucide icon (or element) before the title. */
  icon?: IconProp;
  /** The heading level. Defaults to 2, under the page's h1. */
  level?: 2 | 3;
}

/**
 * A titled group of content on a page: a KPI row, a chart and its table, a set of cards. It
 * has no surface of its own; put Cards, StatCards or a Table inside. Server-safe.
 *
 *   <Section title="This month" description="Compared with last month" actions={…}>
 *     <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">…StatCards…</div>
 *   </Section>
 */
export function Section({
  title,
  description,
  actions,
  icon,
  level = 2,
  className,
  children,
  id,
  ...props
}: SectionProps) {
  const generatedId = useId();
  const headingId = `${id ?? generatedId}-title`;
  const Heading = level === 3 ? 'h3' : 'h2';
  const hasHeader = Boolean(title || description || actions);

  return (
    <section
      {...props}
      id={id}
      aria-labelledby={title ? headingId : undefined}
      className={cn('flex min-w-0 flex-col gap-3', className)}
    >
      {hasHeader ? (
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            {title ? (
              <Heading
                id={headingId}
                className="flex items-center gap-2 text-sm font-semibold tracking-tight text-ca-text"
              >
                {renderIcon(icon, 'size-4 shrink-0 text-ca-muted')}
                {title}
              </Heading>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-sm text-pretty text-ca-muted">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
