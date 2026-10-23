import type { CSSProperties } from "react";
import type { Slot } from "@1ca/ui/components/charts";
import type { StatDelta } from "@1ca/ui/components/stat-card";
import type { ChartSlot } from "@1ca/ui/lib/chart";
import { formatCurrency, formatInt, formatPercent } from "@1ca/ui/lib/format";

// The kit's number formats (en-CA, whole CAD), under the names these pages use.
export const fmtMoney = (n: number) => formatCurrency(n);

export const fmtMoneyCompact = (n: number) => formatCurrency(n, { compact: true });

export const fmtInt = (n: number) => formatInt(n);

/** A ratio as a percentage: fmtPct(0.123) is "12.3%". */
export const fmtPct = (n: number, decimals = 1) => formatPercent(n, decimals);

export function pctDelta(current: number, prev: number): {
  text: string;
  positive: boolean;
} | null {
  if (prev === 0) return null;
  const pct = ((current - prev) / prev) * 100;
  return { text: `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(1)}%`, positive: pct >= 0 };
}

/** pctDelta's result in the kit StatCard's shape: the card draws its own arrow. */
export function toStatDelta(
  delta: ReturnType<typeof pctDelta>,
  against = "the previous period",
): StatDelta | null {
  if (!delta) return null;
  const value = delta.text.replace(/^[▲▼]\s*/, "");
  const flat = value === "0.0%";
  const trend = flat ? "flat" : delta.positive ? "up" : "down";
  const word = flat ? "No change" : delta.positive ? "Up" : "Down";
  return {
    value: flat ? value : `${delta.positive ? "+" : "−"}${value}`,
    trend,
    label: flat ? `${word} on ${against}` : `${word} ${value} on ${against}`,
  };
}

/** A staggered entrance for the nth card in a row (the kit's .ca-enter). */
export function enterDelay(index: number, step = 50): CSSProperties {
  return { "--ca-enter-delay": `${index * step}ms` } as CSSProperties;
}

/* --------------------------------------------------------------------------
   Series slots for the kit charts (@1ca/ui/components/charts). Colour
   follows the entity, so a company or category keeps its slot in every chart,
   legend and table on every page.
   -------------------------------------------------------------------------- */

const COMPANY_SLOT: Record<string, ChartSlot> = {
  "1cleanair": 1,
  homedepot: 2,
  enviroduct: 3,
};

const CATEGORY_SLOT: Record<string, ChartSlot> = {
  duct: 1,
  "dryer-vent": 2,
  carpet: 3,
  upholstery: 4,
  hvac: 5,
  sealing: 6,
  sanitization: 7,
  insulation: 8,
};

export const companySlot = (slug: string): Slot => COMPANY_SLOT[slug] ?? "other";

/** The catalog's eight service categories; repair, fees, discounts and unmapped lines share "Other". */
export const categorySlot = (category: string): Slot =>
  CATEGORY_SLOT[category] ?? "other";
