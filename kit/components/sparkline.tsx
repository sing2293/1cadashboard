import { useId, type ComponentProps } from 'react';
import { cn } from '../lib/utils';

export interface SparklineProps extends Omit<ComponentProps<'svg'>, 'children' | 'color'> {
  /** The values, oldest first. Fewer than two draws nothing. */
  data: readonly number[];
  /** A soft wash under the line. On by default. */
  area?: boolean;
  /** A dot on the latest value. On by default. */
  dot?: boolean;
  /**
   * The line's colour, e.g. chartColor(2). Leave it out to colour the line with a class:
   * className="text-ca-chart-1" (or text-ca-success, text-ca-accent); without either it takes
   * the surrounding text colour.
   */
  color?: string;
  /** Names the trend for assistive technology ("Revenue, last 12 weeks, rising"). Without it the sparkline is decorative. */
  label?: string;
}

const W = 100;
const H = 32;
const PAD = 3;

/**
 * A tiny trend line for a StatCard's `sparkline` slot or a table cell. It stretches to its box
 * (give it a size, e.g. className="h-10 w-24") and keeps a 1.75px line at any size.
 * Server-safe.
 */
export function Sparkline({
  data,
  area = true,
  dot = true,
  color,
  label,
  className,
  ...props
}: SparklineProps) {
  const gradientId = `ca-spark-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const values = data.filter((value) => Number.isFinite(value));

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => ({
    x: values.length > 1 ? (index / (values.length - 1)) * W : W,
    // A flat series sits in the middle rather than on the floor.
    y: max === min ? H / 2 : PAD + (1 - (value - min) / span) * (H - PAD * 2),
  }));

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      overflow="visible"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...props}
      className={cn('block h-8 w-full', className)}
      // An inline colour only when one is passed: an inline "currentColor" would beat the
      // text-* class and paint the line in the parent's text colour.
      style={color ? { color, ...props.style } : props.style}
    >
      {points.length > 1 ? (
        <>
          {area ? (
            <>
              <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                </linearGradient>
              </defs>
              <path d={`${line} L${W} ${H} L0 ${H} Z`} fill={`url(#${gradientId})`} stroke="none" />
            </>
          ) : null}
          <path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {dot && last ? (
            <path
              d={`M${last.x} ${last.y}h0`}
              stroke="currentColor"
              strokeWidth={6}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </>
      ) : null}
    </svg>
  );
}
