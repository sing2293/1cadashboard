import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { renderIcon, type IconProp } from '../lib/render-icon';
import { cn } from '../lib/utils';
import { Card, type CardProps } from './card';
import { GlassSkeleton } from './glassyui/glass-skeleton';

export type StatTrend = 'up' | 'down' | 'flat';

/**
 * Colours the figure. Only for a figure that signals a problem worth a glance: Missed > 0,
 * Out of zone > 0, Failed > 0, Flagged > 0. Never colour a plain count; say any threshold
 * in words in `hint` ("over the 30% target"), since colour alone carries no meaning.
 */
export type StatTone = 'neutral' | 'success' | 'warning' | 'danger';

export interface StatDelta {
  /** The change as shown, already formatted: "+12.4%", "−3", "+$1.2k". */
  value: ReactNode;
  /** Which way the metric moved. Sets the arrow. */
  trend: StatTrend;
  /**
   * Which direction is good news, and so green. "up" (default) for revenue or calls answered,
   * "down" for missed calls or errors, "none" to keep the change neutral.
   */
  good?: 'up' | 'down' | 'none';
  /** What a screen reader hears instead of the arrow and value: "Up 12.4% on last month". */
  label?: string;
}

export interface StatCardProps extends Omit<CardProps, 'children' | 'title'> {
  /** What is measured: "Revenue", "Missed calls". */
  label: ReactNode;
  /**
   * The figure, already formatted. Tabular numerals on one line, never broken mid-number: it
   * steps down a size in narrow cards, and a sparkline that no longer fits beside it wraps under.
   */
  value: ReactNode;
  delta?: StatDelta | null;
  /** Muted context after the delta: "vs last month", "12 branches". */
  hint?: ReactNode;
  /** A lucide icon (`DollarSign`) or an element, in a small accent tile. */
  icon?: IconProp;
  /** A small chart on the right of the value, usually <Sparkline data={…} />. */
  sparkline?: ReactNode;
  /** Shows skeletons for the value and the delta while the figure loads. */
  loading?: boolean;
  /**
   * "neutral" (default) keeps the figure in the text colour. "danger", "warning" or "success"
   * colour it, for figures that flag a problem (Missed > 0, Failed > 0). Never for plain counts.
   */
  tone?: StatTone;
}

const VALUE_TONE: Record<StatTone, string> = {
  neutral: 'text-ca-text',
  success: 'text-ca-success',
  warning: 'text-ca-warning',
  danger: 'text-ca-danger',
};

const TREND_ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: ArrowRight } as const;

function deltaTone({ trend, good = 'up' }: StatDelta) {
  if (trend === 'flat' || good === 'none') return 'bg-ca-muted/12 text-ca-muted';
  return trend === good ? 'bg-ca-success-soft text-ca-success' : 'bg-ca-danger-soft text-ca-danger';
}

/**
 * One KPI: label, big value, change and context, with an optional icon and sparkline. Glass by
 * default; pass variant="solid" over busy content. Server-safe.
 *
 *   <StatCard
 *     label="Revenue"
 *     value={fmtMoney(total)}
 *     delta={{ value: '+12.4%', trend: 'up' }}
 *     hint="vs last month"
 *     icon={DollarSign}
 *     sparkline={<Sparkline data={weekly} className="text-ca-chart-1" />}
 *   />
 *
 *   <StatCard label="Missed" value={formatInt(missed)} tone={missed > 0 ? 'danger' : 'neutral'} />
 */
export function StatCard({
  label,
  value,
  delta,
  hint,
  icon,
  sparkline,
  loading = false,
  tone = 'neutral',
  className,
  ...props
}: StatCardProps) {
  const TrendIcon = delta ? TREND_ICON[delta.trend] : null;

  return (
    <Card
      {...props}
      aria-busy={loading || undefined}
      data-tone={tone === 'neutral' ? undefined : tone}
      className={cn('@container gap-3 px-5 py-4', className)}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium text-ca-muted">{label}</p>
        {icon ? (
          <span className="-mt-0.5 -mr-1 grid size-8 shrink-0 place-items-center rounded-lg bg-ca-accent-soft text-ca-accent">
            {renderIcon(icon, 'size-4')}
          </span>
        ) : null}
      </div>

      {/* When the figure and the sparkline don't fit side by side, the sparkline wraps under the
          figure rather than crowd it; in the narrowest cards it hides. The figure's column is
          sized by the figure (w-min) and then grows, so a long hint wraps inside it instead of
          pushing the sparkline down. */}
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
        <div className="w-min min-w-0 grow">
          {loading ? (
            <GlassSkeleton className="h-8 w-28 max-w-full rounded-lg" />
          ) : (
            <p
              className={cn(
                // A figure never wraps: "$655,810" split after "$655,81" reads as $655.81.
                'text-2xl leading-tight font-semibold tracking-tight whitespace-nowrap tabular-nums @max-[10rem]:text-xl @min-[15rem]:text-[1.75rem]',
                VALUE_TONE[tone],
              )}
            >
              {value}
            </p>
          )}
          {loading ? (
            <GlassSkeleton className="mt-2 h-4 w-20 rounded-full" />
          ) : delta || hint ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              {delta && TrendIcon ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium tabular-nums',
                    deltaTone(delta),
                  )}
                >
                  <TrendIcon aria-hidden className="size-3.5" strokeWidth={2.2} />
                  {delta.label ? (
                    <>
                      <span aria-hidden>{delta.value}</span>
                      <span className="sr-only">{delta.label}</span>
                    </>
                  ) : (
                    delta.value
                  )}
                </span>
              ) : null}
              {hint ? <span className="text-ca-muted">{hint}</span> : null}
            </div>
          ) : null}
        </div>
        {sparkline && !loading ? (
          <div className="h-10 w-24 shrink-0 @max-[13rem]:hidden">{sparkline}</div>
        ) : null}
      </div>
    </Card>
  );
}
