/**
 * The shell's colours, as Tailwind classes. Each reads the theme's --ca-*
 * variable and falls back to GlassyUI's matching --lg-* token, which follows
 * data-lg-theme, so the chrome reads well in light and dark either way.
 * Kept as whole class strings so Tailwind's scanner finds them.
 */

export const TEXT = "text-[color:var(--ca-text,var(--lg-foreground))]";

export const TEXT_MUTED = "text-[color:var(--ca-text-muted,var(--lg-muted-foreground))]";

export const BORDER = "border-[color:var(--ca-border,var(--lg-border))]";

/*
 * Hover and selected rows: a mid-grey wash, which lightens a dark surface and
 * darkens a light one, so one class serves both themes. Plain rgb() rather
 * than color-mix(), whose Tailwind fallback would paint the row solid.
 */
export const WASH = "bg-[rgb(128_128_128/0.2)]";

export const WASH_HOVER = "hover:bg-[rgb(128_128_128/0.13)]";

/** The current page, app or open trigger. */
export const WASH_ACTIVE = WASH;

export const FOCUS_RING =
  "outline-offset-2 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-[color:var(--ca-ring,var(--lg-focus-ring))]";

/** Colour fades, switched off when the person asks for reduced motion. */
export const TRANSITION = "transition-colors duration-150 motion-reduce:transition-none";
