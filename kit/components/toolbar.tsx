import { Search } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';
import { GlassInput, type GlassInputProps } from './glassyui/glass-input';
import { GlassPanel } from './glassyui/glass-panel';

export interface ToolbarProps extends ComponentProps<'div'> {
  /**
   * "plain" (default): a bare row, for the top of a Card or under a PageHeader.
   * "glass": the row sits on a rounded glass bar of its own.
   */
  variant?: 'plain' | 'glass';
  /** Names the group for assistive technology ("Filters", "Table actions"). */
  label?: string;
  /** Pins the bar under the app shell's top bar on a frosted band (plain variant). */
  sticky?: boolean;
}

/**
 * A row of filters, search and actions that wraps onto more lines on narrow screens. Lay it
 * out with ToolbarGroup and ToolbarSpacer; give controls className="ca-control-sm" so every
 * input, select and button is 36px tall. Server-safe.
 *
 *   <Toolbar label="Filters">
 *     <ToolbarSearch placeholder="Search calls" value={q} onChange={…} />
 *     <ToolbarGroup>…GlassSelect, GlassSegmentedControl…</ToolbarGroup>
 *     <ToolbarSpacer />
 *     <ToolbarGroup>…GlassButtons…</ToolbarGroup>
 *   </Toolbar>
 */
export function Toolbar({
  variant = 'plain',
  label,
  sticky = false,
  className,
  children,
  ...props
}: ToolbarProps) {
  const layout = cn(
    'flex min-w-0 flex-wrap items-center gap-2 sm:gap-3',
    sticky &&
      variant === 'plain' &&
      'ca-frost sticky top-[var(--ca-shell-top,0px)] z-20 -mx-[var(--ca-page-gutter,0px)] border-b border-ca px-[var(--ca-page-gutter,0px)] py-2',
    className,
  );
  const a11y = { role: label ? 'group' : undefined, 'aria-label': label };

  if (variant === 'glass') {
    return (
      <GlassPanel
        {...props}
        {...a11y}
        variant="card"
        preset="standard"
        refraction="none"
        lens={false}
        className={cn('rounded-2xl p-2 sm:p-2.5', layout)}
      >
        {children}
      </GlassPanel>
    );
  }

  return (
    <div {...props} {...a11y} className={layout}>
      {children}
    </div>
  );
}

/** Same as Toolbar, named for a page's filter row; defaults to the glass bar and the label "Filters". */
export function FilterBar({ variant = 'glass', label = 'Filters', ...props }: ToolbarProps) {
  return <Toolbar variant={variant} label={label} {...props} />;
}

/** Keeps a few controls together on one line when the toolbar wraps. */
export function ToolbarGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div {...props} className={cn('flex min-w-0 flex-wrap items-center gap-2', className)} />
  );
}

/** Pushes what follows to the right-hand end of the row. */
export function ToolbarSpacer({ className, ...props }: ComponentProps<'span'>) {
  return <span aria-hidden {...props} className={cn('ms-auto', className)} />;
}

export interface ToolbarSearchProps extends Omit<GlassInputProps, 'label' | 'hint' | 'type'> {
  /** Names the field; defaults to the placeholder, else "Search". */
  'aria-label'?: string;
  /** Classes for the wrapper, which sets the width (default: grows from 12rem up to 20rem). */
  wrapperClassName?: string;
}

/**
 * A compact GlassInput with a search icon. Every input prop passes through (value, onChange,
 * name, defaultValue...), so it drops into an existing form or a controlled filter unchanged.
 */
export function ToolbarSearch({
  wrapperClassName,
  className,
  placeholder = 'Search',
  'aria-label': ariaLabel,
  ...props
}: ToolbarSearchProps) {
  return (
    <div className={cn('relative min-w-[12rem] flex-1 sm:max-w-xs', wrapperClassName)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 z-[3] size-4 -translate-y-1/2 text-ca-muted"
      />
      <GlassInput
        type="search"
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        {...props}
        className={cn('ca-control-sm pl-9', className)}
      />
    </div>
  );
}
