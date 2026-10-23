/**
 * One way to write dates, times and numbers in every 1CleanAir app: Canadian English, on
 * Toronto time. Server and browser produce the same text whatever their own zone or locale, so
 * a timestamp rendered on the server hydrates without a mismatch.
 *
 *   formatDateTime(call.startedAt)        // "Oct 23, 2026, 3:04 p.m."
 *   formatDate('2026-10-23')              // "Oct 23, 2026"  (a date-only string stays that day)
 *   formatLongDate('2026-10-23')          // "Friday, October 23, 2026"
 *   formatWeekdayDate('2026-10-23')       // "Fri, Oct 23"
 *   formatMonth('2026-10')                // "October 2026"
 *   formatTime(punch.at)                  // "3:04 p.m."; { seconds: true } gives "3:04:05 p.m."
 *   formatHour(9)                         // "9 a.m." (an hour of the day, for chart axes)
 *   formatRelative(run.finishedAt)        // "just now", "5 min ago", "3 h ago", "yesterday", "Oct 2, 2026"
 *   formatInt(1234567)                    // "1,234,567"
 *   formatNumber(7.25, 1)                 // "7.3"
 *   formatPercent(0.1234)                 // "12.3%"
 *   formatCurrency(184230)                // "$184,230"; { compact: true } gives "$184.2K"
 *
 * Every helper returns "—" for null, undefined, NaN or an unparseable date, so a missing value
 * never prints "Invalid Date". Clocks are 12-hour like every other time; label them with
 * TIME_ZONE_LABEL ("Toronto time").
 */

export const LOCALE = 'en-CA';

export const TIME_ZONE = 'America/Toronto';

/** How a clock or a timestamp column names the zone: "Toronto time". */
export const TIME_ZONE_LABEL = 'Toronto time';

/** What every helper prints for a missing or unreadable value. */
export const EMPTY_VALUE = '—';

/**
 * A moment: a Date, an ISO string ("2026-10-23T19:04:05Z"), a calendar day ("2026-10-23"), a
 * calendar month ("2026-10") or epoch milliseconds.
 */
export type DateInput = Date | string | number;

// The words come from these tables, never from the runtime's locale data, which differs
// between Node and browsers.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

const MONTH_ONLY = /^(\d{4})-(\d{2})$/;

interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

// Numeric parts only, for the same reason as the tables above.
let partsFormatter: Intl.DateTimeFormat | undefined;

function zoneParts(date: Date): WallClock {
  partsFormatter ??= new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  });
  const parts: Record<string, number> = {};
  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    // Some engines print midnight as 24 even with h23.
    hour: parts.hour % 24,
    minute: parts.minute,
    second: parts.second,
  };
}

function toDate(value: DateInput): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * The Toronto wall clock for a value. A date-only string ("2026-10-23") is a calendar day and a
 * month string ("2026-10") a calendar month, not midnight UTC, so they keep their day and month
 * instead of slipping to the evening before.
 */
function wallClock(value: DateInput | null | undefined): WallClock | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') {
    const text = value.trim();
    const day = DATE_ONLY.exec(text);
    if (day) {
      const [, year, month, date] = day;
      return { year: Number(year), month: Number(month), day: Number(date), hour: 0, minute: 0, second: 0 };
    }
    const month = MONTH_ONLY.exec(text);
    if (month && Number(month[2]) >= 1 && Number(month[2]) <= 12) {
      return { year: Number(month[1]), month: Number(month[2]), day: 1, hour: 0, minute: 0, second: 0 };
    }
  }
  const date = toDate(value);
  return date ? zoneParts(date) : null;
}

/** The day of the week of a calendar date, 0 for Sunday. Plain arithmetic, no zone involved. */
function weekdayOf({ year, month, day }: WallClock): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function dateText({ year, month, day }: WallClock): string {
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

function timeText({ hour, minute, second }: WallClock, seconds = false): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const mm = String(minute).padStart(2, '0');
  const ss = seconds ? `:${String(second).padStart(2, '0')}` : '';
  return `${h12}:${mm}${ss} ${hour < 12 ? 'a.m.' : 'p.m.'}`;
}

/** "Oct 23, 2026, 3:04 p.m." on Toronto time. */
export function formatDateTime(value: DateInput | null | undefined): string {
  const clock = wallClock(value);
  return clock ? `${dateText(clock)}, ${timeText(clock)}` : EMPTY_VALUE;
}

/** "Oct 23, 2026" on Toronto time. A date-only string ("2026-10-23") prints that same day. */
export function formatDate(value: DateInput | null | undefined): string {
  const clock = wallClock(value);
  return clock ? dateText(clock) : EMPTY_VALUE;
}

/**
 * The date in full, with its weekday: "Friday, October 23, 2026" on Toronto time, for a page's
 * date heading or a greeting. `{ year: false }` leaves the year off: "Friday, October 23".
 */
export function formatLongDate(
  value: DateInput | null | undefined,
  { year = true }: { year?: boolean } = {},
): string {
  const clock = wallClock(value);
  if (!clock) return EMPTY_VALUE;
  const text = `${WEEKDAYS[weekdayOf(clock)]}, ${MONTHS_LONG[clock.month - 1]} ${clock.day}`;
  return year ? `${text}, ${clock.year}` : text;
}

/**
 * A short date with its weekday: "Fri, Oct 23" on Toronto time, for day pickers, lists of days
 * and table rows. `{ year: true }` adds the year: "Fri, Oct 23, 2026".
 */
export function formatWeekdayDate(
  value: DateInput | null | undefined,
  { year = false }: { year?: boolean } = {},
): string {
  const clock = wallClock(value);
  if (!clock) return EMPTY_VALUE;
  const text = `${WEEKDAYS_SHORT[weekdayOf(clock)]}, ${MONTHS[clock.month - 1]} ${clock.day}`;
  return year ? `${text}, ${clock.year}` : text;
}

/**
 * A month and its year: "October 2026" on Toronto time; a month string ("2026-10") is that
 * month. `{ short: true }` gives "Oct 2026", for axes and tight spots.
 */
export function formatMonth(
  value: DateInput | null | undefined,
  { short = false }: { short?: boolean } = {},
): string {
  const clock = wallClock(value);
  if (!clock) return EMPTY_VALUE;
  return `${(short ? MONTHS : MONTHS_LONG)[clock.month - 1]} ${clock.year}`;
}

/**
 * "3:04 p.m." on Toronto time. `{ seconds: true }` adds the seconds, for a live wall clock:
 * "3:04:05 p.m.". Every clock in the product is 12-hour, like this.
 */
export function formatTime(
  value: DateInput | null | undefined,
  { seconds = false }: { seconds?: boolean } = {},
): string {
  const clock = wallClock(value);
  return clock ? timeText(clock, seconds) : EMPTY_VALUE;
}

/**
 * An hour of the day, 0 to 23, as an axis or a column labels it: formatHour(9) is "9 a.m.",
 * formatHour(12) is "12 p.m." and formatHour(0) is "12 a.m.". It takes the hour itself, not a
 * moment: read the hour of a moment on Toronto time first.
 */
export function formatHour(hour: number | null | undefined): string {
  if (hour === null || hour === undefined || !Number.isFinite(hour)) return EMPTY_VALUE;
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${h < 12 ? 'a.m.' : 'p.m.'}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * How long ago (or how soon): "just now", "5 min ago", "3 h ago", "yesterday", "4 days ago",
 * "in 10 min"; past a week, the date ("Oct 2, 2026"). The text depends on the moment it is
 * rendered, so in server-rendered UI pass the same `now` the client will use, or render it in
 * a client component that ticks.
 */
export function formatRelative(
  value: DateInput | null | undefined,
  now: DateInput = Date.now(),
): string {
  if (value === null || value === undefined || value === '') return EMPTY_VALUE;
  const date = toDate(value);
  const reference = toDate(now);
  if (!date || !reference) return EMPTY_VALUE;

  const diff = reference.getTime() - date.getTime();
  const past = diff >= 0;
  const abs = Math.abs(diff);
  const say = (amount: number, unit: string) => (past ? `${amount} ${unit} ago` : `in ${amount} ${unit}`);

  if (abs < 45_000) return 'just now';
  if (abs < 45 * MINUTE) return say(Math.max(1, Math.round(abs / MINUTE)), 'min');
  if (abs < 22 * HOUR) return say(Math.max(1, Math.round(abs / HOUR)), 'h');
  const days = Math.max(1, Math.round(abs / DAY));
  if (days === 1) return past ? 'yesterday' : 'tomorrow';
  if (days < 7) return say(days, 'days');
  return formatDate(date);
}

let intFormatter: Intl.NumberFormat | undefined;

/** A whole number with thousands separators: "1,234,567". */
export function formatInt(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return EMPTY_VALUE;
  intFormatter ??= new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
  return intFormatter.format(value);
}

const numberFormatters = new Map<number, Intl.NumberFormat>();

/**
 * A number with thousands separators and exactly `digits` decimals (default 0), in place of
 * toFixed(): formatNumber(7.25, 1) is "7.3", formatNumber(1234.5, 2) is "1,234.50".
 */
export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return EMPTY_VALUE;
  const fraction = Math.max(0, Math.min(20, Math.floor(digits)));
  let formatter = numberFormatters.get(fraction);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: fraction,
      maximumFractionDigits: fraction,
    });
    numberFormatters.set(fraction, formatter);
  }
  return formatter.format(value);
}

const percentFormatters = new Map<number, Intl.NumberFormat>();

/** A ratio as a percentage: formatPercent(0.1234) is "12.3%", formatPercent(0.5, 0) is "50%". */
export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return EMPTY_VALUE;
  const fraction = Math.max(0, Math.min(20, Math.floor(digits)));
  let formatter = percentFormatters.get(fraction);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, {
      style: 'percent',
      minimumFractionDigits: fraction,
      maximumFractionDigits: fraction,
    });
    percentFormatters.set(fraction, formatter);
  }
  return formatter.format(value);
}

let moneyFormatter: Intl.NumberFormat | undefined;
let compactMoneyFormatter: Intl.NumberFormat | undefined;

/**
 * Canadian dollars, whole: "$184,230". `compact` shortens big amounts for axes and tight
 * spots: "$184.2K", "$25K", "$1.2M".
 */
export function formatCurrency(
  value: number | null | undefined,
  { compact = false }: { compact?: boolean } = {},
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return EMPTY_VALUE;
  if (compact) {
    compactMoneyFormatter ??= new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency: 'CAD',
      notation: 'compact',
      // Said outright: left to the runtime, Node pads to "$25.0K" while browsers print "$25K",
      // and a server-rendered figure then fails to hydrate.
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    return compactMoneyFormatter.format(value);
  }
  moneyFormatter ??= new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  });
  return moneyFormatter.format(value);
}
