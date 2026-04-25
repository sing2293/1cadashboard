/**
 * ServiceMonster's REST API returns timestamps in a tz-naive form like
 * `"2024-04-26T07:19:28.81"` and likewise interprets `wValue` strings naively.
 * If we let JS parse these via `new Date(s)`, the local timezone gets applied
 * silently and we lose ~4h of rows per page boundary as the cursor shifts.
 *
 * The safe approach: treat every API timestamp as UTC regardless of any Z, so
 * round-tripping a string through Date and back is lossless.
 */

export function parseSmTimestamp(value: string | undefined | null): Date | null {
  if (!value) return null;
  const normalized = /[Z+\-]\d{2}:?\d{2}$|Z$/.test(value) ? value : `${value}Z`;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatSmCursor(d: Date): string {
  return d.toISOString().replace(/Z$/, "");
}
