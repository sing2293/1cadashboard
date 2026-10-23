import { ChartColumn, ChevronRight } from 'lucide-react';
import { useId, type CSSProperties, type ReactNode } from 'react';
import { CHART_TOKENS, chartColor, type ChartSlot } from '../lib/chart';
import { formatCurrency } from '../lib/format';
import { cn } from '../lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './data-table';
import { EmptyState } from './empty-state';

/*
 * The 1CA chart set: bars over time, horizontal bar lists, an area chart, a donut and ring
 * gauges, with a legend and a table-cell bar. Server-safe (no client JavaScript): marks are
 * HTML/SVG in --ca-chart-* colours, axis text is HTML in text tokens so it stays 12px at any
 * width, and every chart sits on a solid card.
 *
 *   <Card variant="solid">
 *     <CardHeader>
 *       <CardTitle as="h2">Call volume</CardTitle>
 *       <ChartLegend items={SERIES} />
 *     </CardHeader>
 *     <CardContent>
 *       <BarChart ariaLabel="Calls by hour" series={SERIES} variant="overlay" data={…} tableLabel="Calls by hour" />
 *     </CardContent>
 *   </Card>
 *
 * Colour follows the entity: give a company, branch or category the same slot in every chart.
 * Good/bad meaning (missed, failed) uses a status tone, not a slot. Motion (bars grow, lines
 * wipe in, rings draw) lasts at most 400ms and stops under reduced motion.
 */

/** A palette slot: 1-8, or "other" for everything folded together. */
export type Slot = ChartSlot | 'other';

/** A status colour for a series whose colour means good or bad: "Missed" is danger. */
export type ChartTone = 'success' | 'warning' | 'danger';

/** A series' name and colour: what a legend row, a bar series and a table column share. */
export interface ChartSeriesStyle {
  label: string;
  /** A palette slot. Defaults to the series' position: 1, 2, 3 … */
  slot?: Slot;
  /** A status colour instead of a slot (wins over `slot`). */
  tone?: ChartTone;
}

const TONE_COLOR: Record<ChartTone, string> = {
  success: 'var(--ca-success)',
  warning: 'var(--ca-warning)',
  danger: 'var(--ca-danger)',
};

/** A slot's colour as a CSS variable reference: slotColor(2) is "var(--ca-chart-2)". */
export const slotColor = (slot: Slot): string => chartColor(slot);

/** A series' colour: its tone, else its slot, else the slot for its position. */
export function seriesColor(series: Pick<ChartSeriesStyle, 'slot' | 'tone'>, index = 0): string {
  if (series.tone) return TONE_COLOR[series.tone];
  return chartColor(series.slot ?? index + 1);
}

// Staggers stop growing here, so a long chart has landed within about 600ms.
const MAX_STAGGER_MS = 240;

function chartDelay(ms: number): CSSProperties {
  return { '--ca-chart-delay': `${Math.round(Math.min(Math.max(0, ms), MAX_STAGGER_MS))}ms` } as CSSProperties;
}

/* --------------------------------------------------------------------------
   Scale, grid and labels
   -------------------------------------------------------------------------- */

const round = (n: number) => Number(n.toPrecision(12));

function niceStep(rough: number, integer: boolean): number {
  const base = 10 ** Math.floor(Math.log10(rough));
  const fraction = rough / base;
  const nice =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  const step = round(nice * base);
  return integer ? Math.max(1, Math.ceil(step)) : step;
}

/**
 * A y scale from 0 to `dataMax`: a round top and three to five evenly spaced ticks (2, 4, 6, 8
 * for a top value of 7; never 1.75). `integer` keeps ticks whole for counts.
 */
export function niceScale(dataMax: number, integer = false): { max: number; ticks: number[] } {
  const top = Number.isFinite(dataMax) && dataMax > 0 ? dataMax : 1;
  const step = niceStep(top / 4, integer);
  const count = Math.max(1, Math.ceil(top / step - 1e-9));
  return {
    max: round(count * step),
    ticks: Array.from({ length: count }, (_, index) => round((index + 1) * step)),
  };
}

export interface YGridProps {
  /** The value at the top of the plot. */
  max: number;
  /** Formats the tick labels. */
  format: (n: number) => string;
  /** Tick values above 0, up to `max`. Defaults to quarters of `max`. */
  ticks?: readonly number[];
}

/**
 * Horizontal gridlines with their values in the left gutter, and the baseline. Fills its
 * positioned parent (the plot); the labels hang off its left edge, so give the plot a left
 * margin (the charts size it from the longest label).
 */
export function YGrid({ max, format, ticks }: YGridProps) {
  const values = ticks ?? [0.25, 0.5, 0.75, 1].map((f) => f * max);
  const label = 'absolute right-full mr-2 -translate-y-1/2 text-xs whitespace-nowrap text-ca-muted tabular-nums';
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {values.map((tick) => (
        <div
          key={tick}
          className="absolute inset-x-0 border-t"
          style={{ bottom: `${(tick / max) * 100}%`, borderColor: CHART_TOKENS.grid }}
        >
          <span className={label}>{format(tick)}</span>
        </div>
      ))}
      <div className="absolute inset-x-0 bottom-0 border-t" style={{ borderColor: CHART_TOKENS.axis }}>
        <span className={label}>{format(0)}</span>
      </div>
    </div>
  );
}

/** The plot's left margin: room for the longest tick label at 12px, plus its 8px gap. */
function gutterFor(labels: string[]): string {
  const longest = Math.max(1, ...labels.map((text) => text.length));
  return `calc(${longest}ch + 0.875rem)`;
}

/**
 * Which x labels to print: about 12 on wide screens and 5 on phones, always the last. The
 * phone set is a subset of the wide one, and no label crowds the last one, so the end never
 * collides ("10-2110-23"): on wide screens a label keeps the full spacing from it, on phones
 * (where the spacing is roomy) three quarters of it.
 */
function xLabelVisibility(n: number) {
  const every = Math.max(1, Math.ceil(n / 12));
  // A multiple of `every`, so a phone label is also a wide-screen label.
  const everyNarrow = every * Math.max(1, Math.ceil(n / 5 / every));
  const last = n - 1;
  return (index: number): 'all' | 'wide' | null => {
    if (index === last) return 'all';
    if (index % every !== 0) return null;
    const fromLast = last - index;
    if (fromLast < every) return null;
    return index % everyNarrow === 0 && fromLast >= Math.ceil(everyNarrow * 0.75) ? 'all' : 'wide';
  };
}

interface EmptyProps {
  /** The empty state's title when there is nothing to plot. Default "No data". */
  emptyTitle?: string;
  /** Its hint. Default "Try a longer date range or another filter." */
  emptyDescription?: ReactNode;
}

function NoChartData({ emptyTitle = 'No data', emptyDescription }: EmptyProps) {
  return (
    <EmptyState
      size="sm"
      icon={ChartColumn}
      title={emptyTitle}
      description={emptyDescription ?? 'Try a longer date range or another filter.'}
    />
  );
}

/** "Show data as a table": the accessible, exact view of a chart, collapsed under it. */
function ChartTable({
  label,
  xLabel,
  columns,
  rows,
}: {
  label: string;
  xLabel: string;
  columns: string[];
  rows: { x: string; values: string[] }[];
}) {
  return (
    <details className="group/details mt-4">
      <summary className="inline-flex cursor-pointer items-center gap-1 rounded-md text-xs font-medium text-ca-muted select-none hover:text-ca-text">
        <ChevronRight
          aria-hidden
          className="size-3.5 transition-transform duration-150 group-open/details:rotate-90 motion-reduce:transition-none"
        />
        Show data as a table
      </summary>
      <Table density="compact" label={label} stickyHeader maxHeight="20rem" containerClassName="mt-3">
        <TableHeader>
          <TableRow>
            <TableHead>{xLabel}</TableHead>
            {columns.map((column) => (
              <TableHead key={column} numeric>
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${row.x}-${index}`}>
              <TableCell muted className="tabular-nums">
                {row.x}
              </TableCell>
              {row.values.map((value, column) => (
                <TableCell key={columns[column] ?? column} numeric>
                  {value}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </details>
  );
}

/* --------------------------------------------------------------------------
   Legend and table-cell bar
   -------------------------------------------------------------------------- */

export interface ChartLegendProps {
  /** One row per series, in the chart's order. A BarChart's `series` works as is. */
  items: readonly ChartSeriesStyle[];
  className?: string;
}

/** A colour key: a swatch and a name per series. */
export function ChartLegend({ items, className }: ChartLegendProps) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ca-muted', className)}>
      {items.map((item, index) => (
        <li key={item.label} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-[3px]"
            style={{ backgroundColor: seriesColor(item, index) }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export interface MiniBarProps {
  /** The share to fill, 0 to 1. */
  value: number;
  /** The series' slot; the accent colour when left out. */
  slot?: Slot;
  /** A status colour instead (a miss rate over target: "danger"). */
  tone?: ChartTone;
  className?: string;
}

/** A small share-of-total bar for table cells. Decorative: print the figure beside it. */
export function MiniBar({ value, slot, tone, className }: MiniBarProps) {
  const width = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)) * 100;
  const color = tone ? TONE_COLOR[tone] : slot === undefined ? undefined : slotColor(slot);
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block h-1.5 w-16 overflow-hidden rounded-full bg-ca-chart-grid align-middle',
        className,
      )}
    >
      <span
        className={cn('block h-full rounded-full', color === undefined && 'bg-ca-accent')}
        style={{ width: `${width.toFixed(1)}%`, backgroundColor: color }}
      />
    </span>
  );
}

/* --------------------------------------------------------------------------
   BarChart
   -------------------------------------------------------------------------- */

export interface BarChartDatum {
  /** The x label: "10-23", "9am". */
  label: string;
  /** The bar's value, for one series. */
  value?: number;
  /** With `series`: one value per series, in the same order. */
  values?: readonly number[];
  /** The native tooltip. Defaults to the label and every value. */
  tooltip?: string;
}

/**
 * How several series share a bar. "grouped" (default): side by side. "stacked": one on top of
 * the next, the bar's height is their sum. "overlay": each drawn from the baseline over the
 * one before, for a part of a whole (Missed within Calls).
 */
export type BarChartVariant = 'grouped' | 'stacked' | 'overlay';

export interface BarChartProps extends EmptyProps {
  data: readonly BarChartDatum[];
  /** Names the chart for assistive technology: what it shows, and the headline. */
  ariaLabel: string;
  /** Formats the axis ticks, and the values unless `valueFormat` is set. */
  format?: (n: number) => string;
  /** Formats printed values, tooltips and the table view. Defaults to `format`. */
  valueFormat?: (n: number) => string;
  /** One series' colour (default slot 1). */
  slot?: Slot;
  /**
   * Two or more series, back to front: their names and colours. Pass the same array to
   * ChartLegend. Each datum then carries `values` in this order.
   */
  series?: readonly ChartSeriesStyle[];
  variant?: BarChartVariant;
  /** The plot's height in px. Default 224px, 256px from 640px wide. */
  height?: number;
  /** Adds a "Show data as a table" disclosure under the chart, named by this label. */
  tableLabel?: string;
  /** The table view's first column header. Default "Period". */
  xLabel?: string;
}

/**
 * Vertical bars over time, one series or several (grouped, stacked or overlaid), on a y grid
 * with tick labels. With 12 bars or fewer each bar's value is printed on top (the total for a
 * stack); otherwise hover a column for its tooltip, or open the table view.
 *
 *   <BarChart ariaLabel="Daily appointments" format={formatInt}
 *     data={days.map((d) => ({ label: d.day.slice(5), value: d.scheduled }))} />
 *
 *   <BarChart ariaLabel="Calls by hour: 412 calls, 37 missed" variant="overlay"
 *     series={[{ label: 'Calls', slot: 1 }, { label: 'Missed', tone: 'danger' }]}
 *     data={hours.map((h) => ({ label: h.label, values: [h.total, h.missed] }))}
 *     tableLabel="Calls by hour" xLabel="Hour" />
 */
export function BarChart({
  data,
  ariaLabel,
  format = (n) => String(n),
  valueFormat,
  slot = 1,
  series,
  variant = 'grouped',
  height,
  tableLabel,
  xLabel = 'Period',
  emptyTitle,
  emptyDescription,
}: BarChartProps) {
  if (data.length === 0) {
    return <NoChartData emptyTitle={emptyTitle} emptyDescription={emptyDescription} />;
  }

  const fmtValue = valueFormat ?? format;
  const keys: readonly ChartSeriesStyle[] = series?.length ? series : [{ label: 'Value', slot }];
  const multi = keys.length > 1;
  const stacked = multi && variant === 'stacked';
  const colors = keys.map((key, index) => seriesColor(key, index));

  const rows = data.map((datum) =>
    keys.map((_, index) => {
      const raw = datum.values?.[index] ?? (index === 0 ? datum.value : undefined) ?? 0;
      return Number.isFinite(raw) ? Math.max(0, raw) : 0;
    }),
  );
  // The bar's full height: the sum of a stack, else the tallest series.
  const tops = rows.map((values) =>
    stacked ? values.reduce((sum, value) => sum + value, 0) : Math.max(...values),
  );
  const integer = rows.every((values) => values.every((value) => Number.isInteger(value)));
  const scale = niceScale(Math.max(0, ...tops), integer);
  const pct = (value: number) => `${(value / scale.max) * 100}%`;

  const n = data.length;
  const visibility = xLabelVisibility(n);
  // Few bars get their value printed on top; side-by-side groups rely on tooltips and the table.
  const showValues = n <= 12 && !(multi && variant === 'grouped');
  const gutter = gutterFor([0, ...scale.ticks].map(format));

  const tooltip = (datum: BarChartDatum, values: number[]) =>
    datum.tooltip ??
    (multi
      ? [datum.label, ...keys.map((key, index) => `${key.label}: ${fmtValue(values[index])}`)].join('\n')
      : `${datum.label}: ${fmtValue(values[0])}`);

  return (
    <div className="text-xs">
      <figure role="img" aria-label={ariaLabel} className="m-0">
        <div
          className={cn('relative', height === undefined && 'h-56 sm:h-64', showValues && 'mt-5')}
          style={{ marginLeft: gutter, height }}
        >
          <YGrid max={scale.max} ticks={scale.ticks} format={format} />
          <div className="absolute inset-0 flex">
            {data.map((datum, index) => {
              const values = rows[index];
              const top = tops[index];
              const delay = chartDelay(index * 20);
              return (
                <div
                  key={`${datum.label}-${index}`}
                  title={tooltip(datum, values)}
                  className="group/bar relative flex h-full min-w-0 flex-1 items-end justify-center"
                >
                  {/* The hovered column lights up; the bars keep their full colour. */}
                  <span
                    aria-hidden
                    className="absolute inset-x-[6%] inset-y-0 rounded-md bg-ca-row-hover opacity-0 transition-opacity duration-150 group-hover/bar:opacity-100 motion-reduce:transition-none"
                  />
                  {!multi ? (
                    <div
                      className="ca-chart-grow relative w-[66%] max-w-12 min-w-px rounded-t-[3px]"
                      style={{ height: pct(values[0]), backgroundColor: colors[0], ...delay }}
                    />
                  ) : variant === 'stacked' ? (
                    <div
                      className="ca-chart-grow relative flex w-[66%] max-w-12 min-w-px flex-col-reverse overflow-hidden rounded-t-[3px]"
                      style={{ height: pct(top), ...delay }}
                    >
                      {values.map((value, key) =>
                        value > 0 ? (
                          <div
                            key={keys[key].label}
                            className="w-full shrink-0"
                            style={{
                              height: `${(value / top) * 100}%`,
                              backgroundColor: colors[key],
                              // A hairline of the card between segments.
                              boxShadow: key > 0 ? `inset 0 -1px 0 ${CHART_TOKENS.surface}` : undefined,
                            }}
                          />
                        ) : null,
                      )}
                    </div>
                  ) : variant === 'overlay' ? (
                    <div className="relative h-full w-[66%] max-w-12 min-w-px">
                      {values.map((value, key) => (
                        <div
                          key={keys[key].label}
                          className="ca-chart-grow absolute inset-x-0 bottom-0 rounded-t-[3px]"
                          style={{
                            height: pct(value),
                            backgroundColor: colors[key],
                            boxShadow: key > 0 ? `0 -1px 0 ${CHART_TOKENS.surface}` : undefined,
                            ...delay,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      className="relative flex h-full w-[80%] items-end justify-center gap-px"
                      style={{ maxWidth: `${keys.length * 1.75}rem` }}
                    >
                      {values.map((value, key) => (
                        <div
                          key={keys[key].label}
                          className="ca-chart-grow min-w-px flex-1 rounded-t-[3px]"
                          style={{ height: pct(value), backgroundColor: colors[key], ...delay }}
                        />
                      ))}
                    </div>
                  )}
                  {showValues ? (
                    <span
                      className={cn(
                        'pointer-events-none absolute inset-x-0 mb-1 text-center font-medium whitespace-nowrap text-ca-muted tabular-nums',
                        n > 6 && 'hidden sm:block',
                      )}
                      style={{ bottom: pct(top) }}
                    >
                      {fmtValue(top)}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        <div aria-hidden className="relative mt-2 h-4" style={{ marginLeft: gutter }}>
          {data.map((datum, index) => {
            const show = visibility(index);
            if (!show) return null;
            return (
              <span
                key={`${datum.label}-${index}`}
                className={cn(
                  'absolute top-0 -translate-x-1/2 whitespace-nowrap text-ca-muted tabular-nums',
                  show === 'wide' && 'hidden md:inline',
                )}
                style={{ left: `${((index + 0.5) / n) * 100}%` }}
              >
                {datum.label}
              </span>
            );
          })}
        </div>
      </figure>

      {tableLabel ? (
        <ChartTable
          label={tableLabel}
          xLabel={xLabel}
          columns={[...keys.map((key) => key.label), ...(stacked ? ['Total'] : [])]}
          rows={data.map((datum, index) => ({
            x: datum.label,
            values: [
              ...rows[index].map((value) => fmtValue(value)),
              ...(stacked ? [fmtValue(tops[index])] : []),
            ],
          }))}
        />
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------------------
   BarList
   -------------------------------------------------------------------------- */

export interface BarListDatum {
  label: string;
  value: number;
  /** The entity's slot (colour follows the entity). Defaults to the row's position. */
  slot?: Slot;
  /** A status colour instead of a slot. */
  tone?: ChartTone;
  tooltip?: string;
}

export interface BarListProps extends EmptyProps {
  data: readonly BarListDatum[];
  /** Formats the printed values. */
  format?: (n: number) => string;
  /** Names the list for assistive technology. */
  ariaLabel: string;
  /**
   * Classes for each row's label. Pass labels ready to read ("UV lights", "Dryer vent") rather
   * than raw keys with "capitalize", which title-cases words and mangles acronyms ("Uv Lights").
   */
  labelClassName?: string;
}

/**
 * Horizontal bars with each label and value printed: categories, companies, branches. Every
 * value is readable as text, so it needs no table view.
 */
export function BarList({
  data,
  format = (n) => String(n),
  ariaLabel,
  labelClassName,
  emptyTitle,
  emptyDescription,
}: BarListProps) {
  if (data.length === 0) {
    return <NoChartData emptyTitle={emptyTitle} emptyDescription={emptyDescription} />;
  }
  const max = Math.max(...data.map((datum) => datum.value), 1);

  return (
    <ul aria-label={ariaLabel} className="flex flex-col gap-3">
      {data.map((datum, index) => {
        const color = seriesColor(datum, index);
        return (
          <li key={datum.label} title={datum.tooltip} className="min-w-0">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ backgroundColor: color }}
                />
                <span className={cn('truncate text-ca-text', labelClassName)}>{datum.label}</span>
              </span>
              <span className="shrink-0 font-medium text-ca-text tabular-nums">
                {format(datum.value)}
              </span>
            </div>
            <div aria-hidden className="mt-1.5 h-2 overflow-hidden rounded-full bg-ca-chart-grid">
              <div
                className="ca-chart-grow-x h-full rounded-full"
                style={{
                  width: `${Math.max(0, (datum.value / max) * 100).toFixed(2)}%`,
                  backgroundColor: color,
                  ...chartDelay(index * 40),
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* --------------------------------------------------------------------------
   DonutChart
   -------------------------------------------------------------------------- */

export interface DonutSlice {
  label: string;
  value: number;
  slot: Slot;
  /** Makes the slice's legend row a link (the slices themselves are never focusable). */
  href?: string;
}

export interface DonutChartProps extends EmptyProps {
  slices: readonly DonutSlice[];
  /** The small word in the hole: "Total". */
  centerLabel: string;
  /** The figure in the hole, formatted: "$1.2M". */
  centerValue: string;
  /** Names the chart for assistive technology. */
  ariaLabel: string;
  /** Formats each legend row's value. Default: whole Canadian dollars ("$184,230"). */
  format?: (n: number) => string;
}

/**
 * A share-of-total donut with a legend that prints every value and share. Slices are plain
 * shapes with a hover tooltip; when a slice has an href, its legend row is the link.
 */
export function DonutChart({
  slices,
  centerLabel,
  centerValue,
  ariaLabel,
  format = (n) => formatCurrency(n),
  emptyTitle,
  emptyDescription,
}: DonutChartProps) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (total === 0) {
    return <NoChartData emptyTitle={emptyTitle} emptyDescription={emptyDescription} />;
  }
  const cx = 160;
  const cy = 160;
  const R = 130;
  const r = 82;

  // Running totals are summed up front so the map below never reassigns a variable.
  const starts: number[] = [];
  let running = 0;
  for (const slice of slices) {
    starts.push(running);
    running += slice.value;
  }
  const arcs = slices.map((slice, index) => {
    const startAngle = (starts[index] / total) * Math.PI * 2 - Math.PI / 2;
    // A lone slice is a full ring; stop a hair short so the arc still draws.
    const endAngle =
      Math.min(((starts[index] + slice.value) / total) * Math.PI * 2, Math.PI * 2 - 0.0001) -
      Math.PI / 2;
    const large = endAngle - startAngle > Math.PI ? 1 : 0;
    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle);
    const y2 = cy + R * Math.sin(endAngle);
    const xi1 = cx + r * Math.cos(endAngle);
    const yi1 = cy + r * Math.sin(endAngle);
    const xi2 = cx + r * Math.cos(startAngle);
    const yi2 = cy + r * Math.sin(startAngle);
    const path = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${r} ${r} 0 ${large} 0 ${xi2} ${yi2} Z`;
    return { ...slice, path, share: slice.value / total };
  });

  const row = 'flex items-center gap-3 rounded-lg px-3 py-2';

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-full max-w-[220px]">
        <svg viewBox="0 0 320 320" className="block w-full" role="img" aria-label={ariaLabel}>
          {arcs.map((arc, index) => (
            <path
              key={arc.label}
              d={arc.path}
              className="ca-chart-fade"
              style={{
                fill: slotColor(arc.slot),
                stroke: CHART_TOKENS.surface,
                strokeWidth: 3,
                strokeLinejoin: 'round',
                ...chartDelay(index * 60),
              }}
            >
              <title>{`${arc.label}: ${(arc.share * 100).toFixed(1)}%`}</title>
            </path>
          ))}
        </svg>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
        >
          <span className="text-xs font-medium tracking-wide text-ca-muted uppercase">
            {centerLabel}
          </span>
          <span className="mt-0.5 text-2xl font-semibold tracking-tight text-ca-text tabular-nums">
            {centerValue}
          </span>
        </div>
      </div>
      <ul className="w-full space-y-0.5">
        {arcs.map((arc) => {
          const content = (
            <>
              <span
                aria-hidden
                className="size-3 shrink-0 rounded-[3px]"
                style={{ backgroundColor: slotColor(arc.slot) }}
              />
              <span className="flex-1 truncate text-sm text-ca-text">{arc.label}</span>
              <span className="text-sm font-medium text-ca-text tabular-nums">{format(arc.value)}</span>
              <span className="w-12 text-right text-xs text-ca-muted tabular-nums">
                {(arc.share * 100).toFixed(1)}%
              </span>
            </>
          );
          return (
            <li key={arc.label}>
              {arc.href ? (
                <a
                  href={arc.href}
                  className={cn(
                    row,
                    'transition-colors duration-150 hover:bg-ca-row-hover focus-visible:outline-offset-0 motion-reduce:transition-none',
                  )}
                >
                  {content}
                </a>
              ) : (
                <div className={row}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* --------------------------------------------------------------------------
   AreaChart
   -------------------------------------------------------------------------- */

export interface AreaChartSeries {
  label: string;
  /** The entity's slot (colour follows the entity). Defaults to the series' position. */
  slot?: Slot;
  /** A status colour instead of a slot. */
  tone?: ChartTone;
  /** The points, oldest first; every series shares the first series' x labels. */
  points: readonly { x: string; y: number }[];
}

export interface AreaChartProps extends EmptyProps {
  series: readonly AreaChartSeries[];
  /** Names the chart for assistive technology. */
  ariaLabel: string;
  /** Formats the axis ticks, and the values unless `valueFormat` is set. */
  format?: (n: number) => string;
  /** Formats tooltips and the table view. Defaults to `format`. */
  valueFormat?: (n: number) => string;
  /** The plot's height in px. Default 280. */
  height?: number;
  /** Adds a "Show data as a table" disclosure under the chart, named by this label. */
  tableLabel?: string;
  /** The table view's first column header. Default "Month". */
  xLabel?: string;
}

/**
 * Smooth lines over a soft wash, one per series, with each series' latest value marked. Hover
 * a column for every series' value; `tableLabel` adds the table view.
 */
export function AreaChart({
  series,
  ariaLabel,
  format = (n) => String(n),
  valueFormat,
  height = 280,
  tableLabel,
  xLabel = 'Month',
  emptyTitle,
  emptyDescription,
}: AreaChartProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  if (series.length === 0 || series[0].points.length === 0) {
    return <NoChartData emptyTitle={emptyTitle} emptyDescription={emptyDescription} />;
  }
  const fmtValue = valueFormat ?? format;
  const colors = series.map((entry, index) => seriesColor(entry, index));
  // Plot units: the SVG stretches to its box and its strokes keep their width.
  const W = 1000;
  const H = 1000;
  const PAD_T = 30;

  const xLabels = series[0].points.map((point) => point.x);
  const n = xLabels.length;
  const values = series.flatMap((entry) => entry.points.map((point) => point.y));
  const scale = niceScale(
    Math.max(0, ...values.filter((value) => Number.isFinite(value))),
    values.every((value) => Number.isInteger(value)),
  );
  const xAt = (index: number) => (n === 1 ? W / 2 : (index / (n - 1)) * W);
  const yAt = (value: number) => PAD_T + (H - PAD_T) - (Math.max(0, value) / scale.max) * (H - PAD_T);
  const visibility = xLabelVisibility(n);
  const gutter = gutterFor([0, ...scale.ticks].map(format));

  // A smooth line through every point: quadratic curves through the midpoints, anchored on
  // the data so the line never misstates a value.
  function linePath(points: { x: number; y: number }[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let index = 0; index < points.length - 1; index++) {
      const a = points[index];
      const b = points[index + 1];
      d += ` Q ${a.x} ${a.y}, ${(a.x + b.x) / 2} ${(a.y + b.y) / 2} T ${b.x} ${b.y}`;
    }
    return d;
  }

  return (
    <div className="text-xs">
      <figure role="img" aria-label={ariaLabel} className="m-0">
        <div className="relative" style={{ height, marginLeft: gutter }}>
          {/* The y scale starts below the top padding, so ticks line up with the plot. */}
          <div className="absolute inset-x-0 bottom-0" style={{ top: `${(PAD_T / H) * 100}%` }}>
            <YGrid max={scale.max} ticks={scale.ticks} format={format} />
          </div>
          <svg
            aria-hidden
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="ca-chart-wipe absolute inset-0 block h-full w-full overflow-visible"
          >
            <defs>
              {series.map((entry, index) => (
                <linearGradient key={entry.label} id={`${uid}-area-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: colors[index], stopOpacity: 0.32 }} />
                  <stop offset="100%" style={{ stopColor: colors[index], stopOpacity: 0 }} />
                </linearGradient>
              ))}
            </defs>
            {series.map((entry, index) => {
              const points = entry.points.map((point, i) => ({ x: xAt(i), y: yAt(point.y) }));
              const line = linePath(points);
              const area = `${line} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;
              return (
                <g key={entry.label}>
                  <path d={area} fill={`url(#${uid}-area-${index})`} />
                  <path
                    d={line}
                    fill="none"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    style={{ stroke: colors[index] }}
                  />
                </g>
              );
            })}
          </svg>
          {/* Each series' latest value. */}
          {series.map((entry, index) => {
            const last = entry.points[entry.points.length - 1];
            if (!last) return null;
            return (
              <span
                key={entry.label}
                aria-hidden
                className="ca-chart-fade absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[color:var(--ca-surface-solid)]"
                style={{
                  left: `${(xAt(entry.points.length - 1) / W) * 100}%`,
                  top: `${(yAt(last.y) / H) * 100}%`,
                  backgroundColor: colors[index],
                  ...chartDelay(MAX_STAGGER_MS),
                }}
              />
            );
          })}
          {/* Hover columns: a guide line, and every series' value in the tooltip. */}
          <div className="absolute inset-0 flex">
            {xLabels.map((x, index) => (
              <div
                key={`${x}-${index}`}
                title={`${x}\n${series
                  .map((entry) => `${entry.label}: ${fmtValue(entry.points[index]?.y ?? 0)}`)
                  .join('\n')}`}
                className="group/col relative h-full flex-1"
                style={
                  n === 1
                    ? undefined
                    : // Centre each column on its point: the first and last are half width.
                      { flexGrow: index === 0 || index === n - 1 ? 0.5 : 1 }
                }
              >
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-y-0 w-px opacity-0 transition-opacity duration-150 group-hover/col:opacity-100 motion-reduce:transition-none',
                    n === 1 ? 'left-1/2' : index === 0 ? 'left-0' : index === n - 1 ? 'right-0' : 'left-1/2',
                  )}
                  style={{ backgroundColor: CHART_TOKENS.axis }}
                />
              </div>
            ))}
          </div>
        </div>
        <div aria-hidden className="relative mt-2 h-4" style={{ marginLeft: gutter }}>
          {xLabels.map((label, index) => {
            const show = visibility(index);
            if (!show) return null;
            const edge = n > 1 && (index === 0 || index === n - 1);
            return (
              <span
                key={`${label}-${index}`}
                className={cn(
                  'absolute top-0 whitespace-nowrap text-ca-muted tabular-nums',
                  !edge && '-translate-x-1/2',
                  n > 1 && index === n - 1 && '-translate-x-full',
                  show === 'wide' && 'hidden md:inline',
                )}
                style={{ left: `${(xAt(index) / W) * 100}%` }}
              >
                {label}
              </span>
            );
          })}
        </div>
      </figure>

      {tableLabel ? (
        <ChartTable
          label={tableLabel}
          xLabel={xLabel}
          columns={series.map((entry) => entry.label)}
          rows={xLabels.map((x, index) => ({
            x,
            values: series.map((entry) => fmtValue(entry.points[index]?.y ?? 0)),
          }))}
        />
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------------------
   RingGauge
   -------------------------------------------------------------------------- */

export interface RingGaugeProps {
  value: number;
  total: number;
  /**
   * The name under the ring, as people should read it: sentence case, acronyms intact ("UV
   * lights"). A raw all-lowercase key ("dryer vent") gets a capital first letter.
   */
  label: string;
  /** The text in the ring: "42%". */
  centerLabel: string;
  slot?: Slot;
  /** The ring's size in px. Default 104. */
  size?: number;
  /** A stagger for its draw-in, in ms (capped at 240). */
  delay?: number;
}

/** One share as a ring: a grid-coloured track and a slot-coloured arc, with its name below. */
export function RingGauge({
  value,
  total,
  label,
  centerLabel,
  slot = 1,
  size = 104,
  delay = 0,
}: RingGaugeProps) {
  const R = 40;
  const C = 2 * Math.PI * R;
  const share = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90" aria-hidden>
          <circle cx={50} cy={50} r={R} fill="none" strokeWidth={9} style={{ stroke: CHART_TOKENS.grid }} />
          <circle
            cx={50}
            cy={50}
            r={R}
            fill="none"
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={`${share * C} ${C}`}
            className="ca-chart-ring"
            style={
              {
                stroke: slotColor(slot),
                '--ca-chart-circ': `${C}`,
                ...chartDelay(delay),
              } as CSSProperties
            }
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-sm font-semibold text-ca-text tabular-nums">
          {centerLabel}
        </span>
      </div>
      <div className="mt-2 inline-flex max-w-full items-center gap-1.5 text-xs text-ca-muted">
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: slotColor(slot) }}
        />
        <span className="truncate">{sentenceStart(label)}</span>
      </div>
    </div>
  );
}

/**
 * A capital first letter for a label that has no capitals at all (a raw key such as "dryer
 * vent"); a label that already has its own capitals ("UV lights") is left as written. CSS
 * `capitalize` would title-case every word instead ("Dryer Vent", "Uv Lights").
 */
function sentenceStart(label: string): string {
  if (label !== label.toLowerCase()) return label;
  return label.charAt(0).toUpperCase() + label.slice(1);
}
