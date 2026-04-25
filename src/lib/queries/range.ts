export type RangePreset =
  | "7d"
  | "30d"
  | "90d"
  | "mtd"
  | "qtd"
  | "ytd"
  | "12m";

export type ResolvedRange = {
  from: Date;
  to: Date;
  prevFrom: Date;
  prevTo: Date;
  preset: RangePreset;
  label: string;
  /** Length of the range in days; useful for picking chart bucket size. */
  days: number;
};

const DEFAULT_PRESET: RangePreset = "30d";

const LABELS: Record<RangePreset, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  mtd: "Month to date",
  qtd: "Quarter to date",
  ytd: "Year to date",
  "12m": "Last 12 months",
};

export const PRESETS: ReadonlyArray<{ value: RangePreset; label: string }> = (
  Object.keys(LABELS) as RangePreset[]
).map((p) => ({ value: p, label: LABELS[p] }));

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function parseRange(value: string | undefined): ResolvedRange {
  const preset: RangePreset = (PRESETS.find((p) => p.value === value)?.value ??
    DEFAULT_PRESET) as RangePreset;
  const now = new Date();
  const to = new Date(now);
  let from: Date;

  switch (preset) {
    case "7d":
      from = new Date(to);
      from.setUTCDate(from.getUTCDate() - 7);
      break;
    case "30d":
      from = new Date(to);
      from.setUTCDate(from.getUTCDate() - 30);
      break;
    case "90d":
      from = new Date(to);
      from.setUTCDate(from.getUTCDate() - 90);
      break;
    case "mtd":
      from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));
      break;
    case "qtd": {
      const q = Math.floor(to.getUTCMonth() / 3);
      from = new Date(Date.UTC(to.getUTCFullYear(), q * 3, 1));
      break;
    }
    case "ytd":
      from = new Date(Date.UTC(to.getUTCFullYear(), 0, 1));
      break;
    case "12m":
      from = new Date(to);
      from.setUTCMonth(from.getUTCMonth() - 12);
      break;
  }

  from = startOfUtcDay(from);

  const ms = to.getTime() - from.getTime();
  const prevTo = new Date(from);
  const prevFrom = new Date(from.getTime() - ms);

  return {
    from,
    to,
    prevFrom,
    prevTo,
    preset,
    label: LABELS[preset],
    days: Math.max(1, Math.round(ms / 86400000)),
  };
}
