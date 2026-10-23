import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface StatusPillProps extends ComponentProps<'span'> {
  /** neutral (default), info (accent), success, warning or danger. */
  tone?: StatusTone;
  /** The leading dot. On by default; the text label always carries the meaning too. */
  dot?: boolean;
  /**
   * A soft ping on the dot for something happening right now: live ("Live", "On shift",
   * "Online") or in progress ("Syncing", "Running", "Publishing"). Waiting and settled states
   * ("Queued", "Scheduled", "Succeeded") and settings ("Auto refresh") never pulse. The tone
   * follows the state, not the pulse: success for live, info for work in progress. It stops
   * under the system's reduced-motion setting and GlassyUI's reduce-motion preference alike.
   */
  pulse?: boolean;
  size?: 'sm' | 'md';
}

const TONE: Record<StatusTone, string> = {
  neutral: 'bg-ca-muted/12 text-ca-muted ring-ca-muted/20',
  info: 'bg-ca-accent-soft text-ca-accent ring-ca-accent/25',
  success: 'bg-ca-success-soft text-ca-success ring-ca-success/25',
  warning: 'bg-ca-warning-soft text-ca-warning ring-ca-warning/25',
  danger: 'bg-ca-danger-soft text-ca-danger ring-ca-danger/25',
};

/**
 * A status label with a coloured dot: "Active", "Missed", "Failed". Colour never carries the
 * meaning alone; the words do. Server-safe. Every status in the product is a StatusPill (not
 * GlassyUI's GlassBadge, whose fixed palette is outside the brand tokens):
 *
 *   <StatusPill tone="success" pulse>Live</StatusPill>       live states: success + pulse, sentence case
 *   <StatusPill tone="info" pulse>Syncing</StatusPill>       work in progress: info + pulse
 *   <StatusPill tone="danger">Failed</StatusPill>            a human label, never a raw enum value
 *   <StatusPill dot={false}>12 people</StatusPill>           counts and role chips: no dot
 */
export function StatusPill({
  tone = 'neutral',
  dot = true,
  pulse = false,
  size = 'sm',
  className,
  children,
  ...props
}: StatusPillProps) {
  return (
    <span
      {...props}
      data-tone={tone}
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full font-medium whitespace-nowrap ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        TONE[tone],
        className,
      )}
    >
      {dot ? (
        <span aria-hidden className="relative flex size-1.5 shrink-0">
          {pulse ? (
            <span className="absolute inline-flex size-full rounded-full bg-current opacity-60 motion-ok:animate-ping" />
          ) : null}
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      <span className="truncate">{children}</span>
    </span>
  );
}
