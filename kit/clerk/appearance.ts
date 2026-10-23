import type { ClerkProvider } from '@clerk/nextjs';
import type { ComponentProps } from 'react';
import type { ResolvedTheme } from '../theme/theme';

/** Clerk Core 3's `appearance` object, as ClerkProvider (and every Clerk component) takes it. */
export type ClerkAppearance = NonNullable<ComponentProps<typeof ClerkProvider>['appearance']>;
export type ClerkVariables = NonNullable<ClerkAppearance['variables']>;
export type ClerkElements = NonNullable<ClerkAppearance['elements']>;

/*
 * Clerk derives its shades (hover, borders, muted fills) from these in JavaScript in older
 * browsers, so they are literal colours: the --ca-* palette's values for each theme. Keep them
 * in step with kit.css.
 *
 * colorBorder is opaque on purpose: Clerk draws every border as a small share of it (11% at
 * rest, 28% on hover), and in current browsers that share multiplies a translucent colour's own
 * alpha, so rgba(…, 0.2) left borders at about 2%. The opaque base of --ca-border gives Clerk's
 * hairlines the kit's weight in every browser; text fields get --ca-border-strong below.
 */
const VARIABLES: Record<ResolvedTheme, ClerkVariables> = {
  dark: {
    colorPrimary: '#38bdf8', // --ca-accent
    colorPrimaryForeground: '#03131f', // --ca-accent-fg
    colorBackground: '#0e1729', // --ca-surface-solid
    colorForeground: '#f2f6fc', // --ca-text
    colorMutedForeground: '#9babc2', // --ca-text-muted
    colorMuted: '#091120', // --ca-surface-sunken
    colorInput: '#091120', // --ca-surface-sunken
    colorInputForeground: '#f2f6fc',
    colorBorder: '#94b8e9', // the opaque base of --ca-border
    colorNeutral: '#f2f6fc',
    colorRing: '#38bdf8', // --ca-ring
    colorDanger: '#f87171',
    colorSuccess: '#34d399',
    colorWarning: '#fbbf24',
    colorShadow: '#000000',
    colorModalBackdrop: '#02060f',
    borderRadius: '0.625rem',
    fontFamily: 'inherit',
    fontFamilyButtons: 'inherit',
  },
  light: {
    colorPrimary: '#0369a1',
    colorPrimaryForeground: '#ffffff',
    colorBackground: '#ffffff',
    colorForeground: '#0b1526',
    colorMutedForeground: '#43506a',
    colorMuted: '#eaf0f7',
    colorInput: '#ffffff',
    colorInputForeground: '#0b1526',
    colorBorder: '#0f2850', // the opaque base of --ca-border
    colorNeutral: '#0b1526',
    colorRing: '#0284c7',
    colorDanger: '#c81e1e',
    colorSuccess: '#047857',
    colorWarning: '#a64b07',
    colorShadow: '#0f2850',
    colorModalBackdrop: '#0c1c38',
    borderRadius: '0.625rem',
    fontFamily: 'inherit',
    fontFamilyButtons: 'inherit',
  },
};

const FOCUS_RING = {
  '&:focus-visible': { outline: '2px solid var(--ca-ring)', outlineOffset: '2px' },
} as const;

const GLASS = {
  backgroundColor: 'var(--ca-glass-bg)',
  backdropFilter: 'var(--ca-glass-filter)',
  WebkitBackdropFilter: 'var(--ca-glass-filter)',
  border: '1px solid var(--ca-border)',
  boxShadow: 'var(--ca-shadow-lift)',
} as const;

/*
 * Clerk's primary button ("Continue") as the kit's prominent GlassButton: the deep sky fill
 * with white text and a lit top edge, instead of a flat block of the bright accent with dark
 * text. colorPrimary stays the accent, so Clerk's links keep their contrast. Focus shows the
 * kit's outline ring (FOCUS_RING), so Clerk's own focus shadows are replaced too. Only the
 * primary colour scheme: a destructive submit (data-color="danger", such as deleting the
 * account in the profile) stays red.
 */
const PRIMARY_FILL = 'var(--lg-prominent-fill, #0277b5)';
const PRIMARY_SHADOW = 'inset 0 1px 0 rgb(255 255 255 / 0.25), inset 0 0 0 1px rgb(2 30 56 / 0.3)';

const PRIMARY_BUTTON = {
  ...FOCUS_RING,
  '&[data-color="primary"]': {
    backgroundColor: PRIMARY_FILL,
    borderColor: PRIMARY_FILL,
    color: '#ffffff',
    // Darker on hover, so the white label keeps 4.5:1.
    '&:hover': { backgroundColor: `color-mix(in srgb, ${PRIMARY_FILL} 85%, #000)` },
  },
  '&[data-variant="solid"][data-color="primary"]': {
    boxShadow: PRIMARY_SHADOW,
    '&:focus, &:focus:not(:focus-visible), &:focus-visible': { boxShadow: PRIMARY_SHADOW },
  },
} as const;

/*
 * Text fields hold 3:1 at rest, like the kit's (--ca-border-strong): Clerk's own resting edge
 * is an 11% hairline. Hover and focus are restated so they still read as changes; a field
 * showing feedback (an error, a warning) keeps Clerk's coloured edge.
 */
const FIELD_EDGE = {
  '&[data-variant="default"]:not([data-feedback])': {
    boxShadow: '0px 0px 0px 1px var(--ca-border-strong)',
    '&:hover': { boxShadow: '0px 0px 0px 1px var(--ca-text-muted)' },
    '&:focus, &:focus-within, &[data-focus-within="true"]': {
      boxShadow:
        '0px 0px 0px 1px var(--ca-ring), 0px 0px 0px 4px color-mix(in srgb, var(--ca-ring) 25%, transparent)',
    },
  },
} as const;

/**
 * Element styles shared by both themes. They read the --ca-* variables (so they follow the theme
 * by themselves) and are style objects, which Clerk merges into its own rules, so they win
 * without !important or CSS layers. The card and popovers become 1CA glass that turns solid
 * with reduced transparency.
 */
export const clerkElements: ClerkElements = {
  cardBox: { ...GLASS, borderRadius: '1.25rem' },
  card: { backgroundColor: 'transparent', boxShadow: 'none', border: 'none' },
  footer: { background: 'transparent' },
  headerTitle: { letterSpacing: '-0.01em' },
  dividerLine: { backgroundColor: 'var(--ca-border)' },
  formButtonPrimary: PRIMARY_BUTTON,
  formFieldInput: FIELD_EDGE,
  socialButtonsBlockButton: { ...FOCUS_RING },
  footerActionLink: { fontWeight: 600 },
  userButtonTrigger: { borderRadius: '9999px', ...FOCUS_RING },
  userButtonPopoverCard: { ...GLASS, borderRadius: '1rem' },
  userButtonPopoverMain: { backgroundColor: 'transparent' },
  userButtonPopoverFooter: { background: 'transparent' },
  modalBackdrop: {
    backgroundColor: 'var(--lg-scrim, rgb(2 6 15 / 0.55))',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
  },
};

/** The Clerk variables (colours, radius, fonts) for one theme. */
export function clerkVariables(theme: ResolvedTheme): ClerkVariables {
  return VARIABLES[theme];
}

/**
 * Clerk's appearance in the 1CA look for one theme: --ca-* colours, glass cards and popovers,
 * the kit's focus ring, and a matching CAPTCHA theme. ThemedClerkProvider passes it for you
 * and switches it with the theme; use this directly for a one-off component.
 *
 *   <SignIn appearance={mergeClerkAppearance(clerkAppearance('dark'), signInAppearance)} />
 */
export function clerkAppearance(theme: ResolvedTheme): ClerkAppearance {
  return {
    variables: clerkVariables(theme),
    elements: clerkElements,
    captcha: { theme },
  };
}

/** For a full-page <SignIn /> or <SignUp />: a card that fills a phone and stops at 26rem. */
export const signInAppearance: ClerkAppearance = {
  elements: {
    rootBox: { width: '100%', maxWidth: '26rem' },
    cardBox: { width: '100%', maxWidth: '26rem' },
  },
};

/** For a <UserButton /> in an app's own header: a 32px avatar with the kit's focus ring. */
export const userButtonAppearance: ClerkAppearance = {
  elements: {
    avatarBox: { width: '2rem', height: '2rem' },
  },
};

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function deepMerge(base: PlainObject, extra: PlainObject): PlainObject {
  const out: PlainObject = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    if (value === undefined) continue;
    const current = out[key];
    // A base theme is a tagged object or a list of them: replace it, never blend two.
    out[key] =
      key !== 'theme' && isPlainObject(current) && isPlainObject(value)
        ? deepMerge(current, value)
        : value;
  }
  return out;
}

/**
 * Layers appearance objects left to right, later ones winning. Nested objects (variables,
 * elements, each element's style object, per-component sections such as `signIn`) merge
 * key by key; a class-name string replaces an element's style object.
 */
export function mergeClerkAppearance(
  ...layers: ReadonlyArray<ClerkAppearance | null | undefined>
): ClerkAppearance {
  let merged: PlainObject = {};
  for (const layer of layers) {
    if (layer) merged = deepMerge(merged, layer as PlainObject);
  }
  // SAFETY: a key-wise merge of appearance objects is itself an appearance object.
  return merged as ClerkAppearance;
}
