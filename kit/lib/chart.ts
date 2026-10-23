/**
 * The 1CA chart palette, as CSS variable references that follow the theme. Eight categorical
 * series colours in a fixed, colour-blind-checked order, plus "other", gridline and axis
 * colours (defined for light and dark in kit.css as --ca-chart-*).
 *
 * Rules that keep charts readable:
 * - Give series 1, 2, 3 ... in order and never cycle. A ninth series folds into "Other"
 *   (chartColor('other')), facets, or a table.
 * - Colour follows the entity, not its rank: keep a series' slot when filters hide others.
 * - Scatter plots and maps (where any two colours can touch) use the first three slots only.
 * - Text (axis labels, values, legends) uses text tokens (var(--ca-text-muted)), never a
 *   series colour. Good/bad meaning uses the status tokens (--ca-success, --ca-danger), not
 *   series colours.
 * - In light mode slots 3-5 sit under 3:1 on white: show values as labels or offer a table.
 *
 * SVG: put the reference in `style` or a class (style={{ fill: chartColor(1) }},
 * className="fill-ca-chart-1"); var() in an SVG presentation attribute is not reliable
 * everywhere. Canvas libraries need real colours: readChartColors().
 */

export const CHART_SERIES_COUNT = 8;

export type ChartSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const SERIES = [
  'var(--ca-chart-1)',
  'var(--ca-chart-2)',
  'var(--ca-chart-3)',
  'var(--ca-chart-4)',
  'var(--ca-chart-5)',
  'var(--ca-chart-6)',
  'var(--ca-chart-7)',
  'var(--ca-chart-8)',
] as const;

/** Chart chrome: gridlines, the baseline/axis line, tick and legend text, and "Other". */
export const CHART_TOKENS = {
  grid: 'var(--ca-chart-grid)',
  axis: 'var(--ca-chart-axis)',
  label: 'var(--ca-text-muted)',
  text: 'var(--ca-text)',
  other: 'var(--ca-chart-other)',
  surface: 'var(--ca-surface-solid)',
} as const;

/**
 * The series colours as CSS variable references, slot 1 first: ["var(--ca-chart-1)", ...].
 * `count` (1-8) returns only the first slots.
 */
export function chartColors(count: number = CHART_SERIES_COUNT): string[] {
  const n = Math.max(0, Math.min(CHART_SERIES_COUNT, Math.floor(count)));
  return SERIES.slice(0, n);
}

/**
 * One series colour by 1-based slot. Slots past 8 (and "other") return the neutral "Other"
 * colour rather than cycling back to slot 1.
 */
export function chartColor(slot: number | 'other'): string {
  if (slot === 'other' || !Number.isInteger(slot) || slot < 1 || slot > CHART_SERIES_COUNT) {
    return CHART_TOKENS.other;
  }
  return SERIES[slot - 1];
}

export interface ResolvedChartColors {
  series: string[];
  grid: string;
  axis: string;
  label: string;
  text: string;
  other: string;
  surface: string;
}

function readVar(style: CSSStyleDeclaration, name: string) {
  return style.getPropertyValue(name).trim();
}

/**
 * The palette as actual colour strings for the current theme, read from `element` (default
 * <html>), for canvas-based chart libraries that cannot use var(). Browser only; read it again
 * after a theme change (useThemeChoice().resolvedTheme in the effect's dependencies).
 */
export function readChartColors(element?: Element): ResolvedChartColors {
  const target = element ?? document.documentElement;
  const style = window.getComputedStyle(target);
  return {
    series: SERIES.map((_, index) => readVar(style, `--ca-chart-${index + 1}`)),
    grid: readVar(style, '--ca-chart-grid'),
    axis: readVar(style, '--ca-chart-axis'),
    label: readVar(style, '--ca-text-muted'),
    text: readVar(style, '--ca-text'),
    other: readVar(style, '--ca-chart-other'),
    surface: readVar(style, '--ca-surface-solid'),
  };
}
