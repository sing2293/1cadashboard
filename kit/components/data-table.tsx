import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import { cn } from '../lib/utils';
import { EmptyState, type EmptyStateProps } from './empty-state';

/*
 * Table primitives on a solid surface. Dense data never sits on glass: the frame is an opaque
 * .ca-solid panel with no backdrop-filter, so scrolling and live updates stay cheap.
 * All server-safe; only `onSort` needs a client parent.
 *
 *   <Table density="compact" stickyHeader maxHeight="32rem" label="Calls">
 *     <TableHeader>
 *       <TableRow>
 *         <TableHead sort={sortKey === 'name' ? dir : 'none'} onSort={() => sortBy('name')}>Name</TableHead>
 *         <TableHead numeric>Calls</TableHead>
 *       </TableRow>
 *     </TableHeader>
 *     <TableBody>
 *       {rows.length === 0 ? <TableEmpty colSpan={2} icon={Inbox} title="No calls today" /> : null}
 *       {rows.map((row) => (
 *         <TableRow key={row.id} selected={row.id === selectedId}>
 *           <TableCell>{row.name}</TableCell>
 *           <TableCell numeric>{row.calls}</TableCell>
 *         </TableRow>
 *       ))}
 *     </TableBody>
 *   </Table>
 */

export type TableDensity = 'compact' | 'comfortable';

export interface TableProps extends ComponentProps<'table'> {
  /** "comfortable" (default): 48px rows. "compact": 36px rows for long lists and wallboards. */
  density?: TableDensity;
  /** Keeps the header row visible while the table scrolls. Needs `maxHeight`, which makes the frame the scroller. */
  stickyHeader?: boolean;
  /** A max height for the frame (e.g. "32rem"); taller tables scroll inside it. */
  maxHeight?: CSSProperties['maxHeight'];
  /**
   * "solid" (default): the table brings its own rounded-xl solid panel, border and shadow.
   * "none": just the scroll wrapper, for a table inside a <Card variant="solid"> (use
   * CardContent flush, and className="overflow-hidden pb-0" on the Card). The first and last
   * columns get 1.25rem of outer padding, so the text lines up with the CardHeader above.
   * Both show edge shadows on a side with more to scroll to.
   */
  surface?: 'solid' | 'none';
  /**
   * Names the scrolling frame for assistive technology and makes it focusable, so keyboard users
   * can scroll a wide table. Give one to any table that may scroll.
   */
  label?: string;
  /** Classes for the scrolling frame. `className` goes on the <table>. */
  containerClassName?: string;
}

export function Table({
  density = 'comfortable',
  stickyHeader = false,
  maxHeight,
  surface = 'solid',
  label,
  containerClassName,
  className,
  ...props
}: TableProps) {
  return (
    <div
      role={label ? 'region' : undefined}
      aria-label={label}
      tabIndex={label ? 0 : undefined}
      style={maxHeight === undefined ? undefined : { maxHeight }}
      className={cn(
        // Edge shadows at every surface: inside a solid card the covers match it, so cut-off
        // columns still read as "scroll for more".
        'ca-scroll-shadows relative w-full min-w-0 overflow-auto overscroll-x-contain',
        surface === 'solid' && 'ca-solid rounded-xl border border-ca shadow-ca',
        containerClassName,
      )}
    >
      <table
        {...props}
        data-density={density}
        data-surface={surface}
        data-sticky-header={stickyHeader || undefined}
        className={cn(
          'group/table w-full border-separate border-spacing-0 text-left text-sm text-ca-text',
          className,
        )}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }: ComponentProps<'thead'>) {
  return <thead {...props} className={cn(className)} />;
}

export function TableBody({ className, ...props }: ComponentProps<'tbody'>) {
  return (
    <tbody
      {...props}
      className={cn(
        '[&>tr:last-child>td]:border-b-0',
        '[&>tr:not([data-selected=true]):not([data-empty]):hover]:bg-ca-row-hover',
        '[&>tr[data-selected=true]]:bg-ca-row-selected',
        className,
      )}
    />
  );
}

export function TableFooter({ className, ...props }: ComponentProps<'tfoot'>) {
  return (
    <tfoot
      {...props}
      className={cn(
        'bg-ca-surface-sunken font-medium [&>tr>td]:border-t [&>tr>td]:border-b-0 [&>tr>td]:border-ca',
        className,
      )}
    />
  );
}

export interface TableRowProps extends ComponentProps<'tr'> {
  /** The selected row: an accent wash and an accent bar on its leading edge. */
  selected?: boolean;
  /** A pointer cursor, for rows that open something on click. */
  interactive?: boolean;
}

export function TableRow({ selected = false, interactive = false, className, ...props }: TableRowProps) {
  return (
    <tr
      {...props}
      data-selected={selected || undefined}
      className={cn(
        'transition-colors duration-150 motion-reduce:transition-none',
        '[&[data-selected=true]>td:first-child]:shadow-[inset_2px_0_0_var(--ca-accent)]',
        interactive && 'cursor-pointer',
        className,
      )}
    />
  );
}

type CellAlign = 'left' | 'center' | 'right';

/*
 * Inside a card (surface="none"), the outer columns line up with the CardHeader's 20px side
 * padding at either density. The :first-child/:last-child match outranks the density padding.
 */
const CARD_EDGES =
  'group-data-[surface=none]/table:first:ps-5 group-data-[surface=none]/table:last:pe-5';

const ALIGN: Record<CellAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export type SortDirection = 'asc' | 'desc' | 'none';

export interface TableHeadProps extends ComponentProps<'th'> {
  /** Right-aligned, for numeric columns. */
  numeric?: boolean;
  align?: CellAlign;
  /**
   * Makes the column sortable and says how it is sorted now: "asc", "desc" or "none". The
   * sorted column gets aria-sort. Leave it out for columns that don't sort.
   */
  sort?: SortDirection;
  /** Sorts on click (a button). Needs a client parent. */
  onSort?: () => void;
  /** Sorts by following a link (next/link), e.g. "?sort=revenue&dir=desc". Server-friendly. */
  sortHref?: string;
}

const SORT_ICON = 'size-3.5 shrink-0';

export function TableHead({
  numeric = false,
  align,
  sort,
  onSort,
  sortHref,
  className,
  children,
  scope = 'col',
  ...props
}: TableHeadProps) {
  const sortable = sort !== undefined;
  const resolvedAlign = align ?? (numeric ? 'right' : 'left');

  const icon = !sortable ? null : sort === 'asc' ? (
    <ArrowUp aria-hidden className={cn(SORT_ICON, 'text-ca-accent')} />
  ) : sort === 'desc' ? (
    <ArrowDown aria-hidden className={cn(SORT_ICON, 'text-ca-accent')} />
  ) : (
    <ChevronsUpDown
      aria-hidden
      className={cn(SORT_ICON, 'opacity-45 transition-opacity group-hover/sort:opacity-100')}
    />
  );

  // The label never truncates: it sets the column's minimum width, so a narrow table scrolls
  // sideways instead of clipping "Revenue" to "REVE…".
  const control = cn(
    'group/sort -mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 whitespace-nowrap uppercase',
    'transition-colors hover:text-ca-text motion-reduce:transition-none',
    sort === 'asc' || sort === 'desc' ? 'text-ca-text' : undefined,
    resolvedAlign === 'right' && 'flex-row-reverse',
  );

  let content: ReactNode = children;
  if (sortable && onSort) {
    content = (
      <button type="button" onClick={onSort} className={control}>
        <span>{children}</span>
        {icon}
      </button>
    );
  } else if (sortable && sortHref) {
    content = (
      <Link href={sortHref} className={control}>
        <span>{children}</span>
        {icon}
      </Link>
    );
  } else if (sortable) {
    content = (
      <span className={cn(control, 'hover:text-inherit')}>
        <span>{children}</span>
        {icon}
      </span>
    );
  }

  return (
    <th
      {...props}
      scope={scope}
      aria-sort={sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : undefined}
      className={cn(
        'h-10 border-b border-ca bg-ca-surface-sunken px-4 align-middle text-xs font-semibold tracking-wide whitespace-nowrap text-ca-muted uppercase',
        'group-data-[density=compact]/table:h-8 group-data-[density=compact]/table:px-3',
        'group-data-[sticky-header=true]/table:sticky group-data-[sticky-header=true]/table:top-0 group-data-[sticky-header=true]/table:z-[2]',
        CARD_EDGES,
        ALIGN[resolvedAlign],
        className,
      )}
    >
      {content}
    </th>
  );
}

export interface TableCellProps extends ComponentProps<'td'> {
  /** Right-aligned tabular numerals that don't wrap, for figures. */
  numeric?: boolean;
  align?: CellAlign;
  /** Secondary text colour, for dates, ids and other supporting columns. */
  muted?: boolean;
}

export function TableCell({
  numeric = false,
  align,
  muted = false,
  className,
  ...props
}: TableCellProps) {
  return (
    <td
      {...props}
      className={cn(
        'border-b border-ca px-4 py-3 align-middle',
        'group-data-[density=compact]/table:px-3 group-data-[density=compact]/table:py-2',
        CARD_EDGES,
        ALIGN[align ?? (numeric ? 'right' : 'left')],
        numeric && 'whitespace-nowrap tabular-nums',
        muted && 'text-ca-muted',
        className,
      )}
    />
  );
}

export function TableCaption({ className, ...props }: ComponentProps<'caption'>) {
  return (
    <caption
      {...props}
      className={cn(
        'caption-bottom px-4 py-3 text-left text-xs text-ca-muted group-data-[surface=none]/table:px-5',
        className,
      )}
    />
  );
}

export interface TableEmptyProps extends Omit<EmptyStateProps, 'size'> {
  /** How many columns the table has, so the message spans them all. */
  colSpan: number;
}

/** A body row with an EmptyState across every column, for when there is nothing to list. */
export function TableEmpty({ colSpan, ...props }: TableEmptyProps) {
  return (
    <tr data-empty="">
      <td colSpan={colSpan} className="border-b-0 p-0">
        <EmptyState size="sm" {...props} />
      </td>
    </tr>
  );
}
