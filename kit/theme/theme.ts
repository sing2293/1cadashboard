/**
 * The 1CA theme model, shared by every *.1cleanair.info app: types, constants and pure helpers.
 * Nothing here touches the DOM or Next, so it runs on the server, in the browser and in the
 * inline head script alike.
 */

/** What a visitor picked. "system" follows the operating system's light or dark setting. */
export type ThemeChoice = 'light' | 'dark' | 'system';

/** The theme actually on screen. */
export type ResolvedTheme = 'light' | 'dark';

export const THEME_CHOICES = ['light', 'dark', 'system'] as const satisfies readonly ThemeChoice[];

/** One cookie carries the choice to every app, so switching in one app switches them all. */
export const THEME_COOKIE = 'ca-theme';

/** Hosts under this domain share the cookie; anything else (localhost, previews) keeps its own. */
export const THEME_COOKIE_DOMAIN = '1cleanair.info';

/** One year, in seconds. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * What a visitor without the cookie sees: their operating system's light or dark setting. Every
 * app styles itself from the --ca-* tokens and has its own themed 404 and error pages, so both
 * themes hold everywhere. The head script, the server helper and the providers all read this one
 * constant.
 */
export const DEFAULT_THEME_CHOICE: ThemeChoice = 'system';

/** Fired on window after this page changes the choice, so every hook re-reads it. */
export const THEME_CHANGE_EVENT = 'ca-theme-change';

/** The media query the kit treats as "the system is light"; anything else counts as dark. */
export const SYSTEM_LIGHT_QUERY = '(prefers-color-scheme: light)';

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** The choice a raw cookie value names, or undefined when it names none. */
export function parseThemeChoice(value: string | null | undefined): ThemeChoice | undefined {
  return isThemeChoice(value) ? value : undefined;
}

/** Reads the choice out of a Cookie header or document.cookie string. */
export function readThemeCookie(cookieString: string | null | undefined): ThemeChoice | undefined {
  if (!cookieString) return undefined;

  for (const part of cookieString.split(';')) {
    const pair = part.trim();

    if (pair.startsWith(`${THEME_COOKIE}=`)) {
      const choice = parseThemeChoice(pair.slice(THEME_COOKIE.length + 1));

      if (choice) return choice;
    }
  }

  return undefined;
}

/**
 * The theme a choice puts on screen. `systemTheme` is what the OS asks for; while it is
 * unknown (on the server, or before hydration) "system" resolves to undefined.
 */
export function resolveTheme(
  choice: ThemeChoice,
  systemTheme: ResolvedTheme | undefined,
): ResolvedTheme | undefined {
  return choice === 'system' ? systemTheme : choice;
}

/** The Domain attribute for a host: shared across 1cleanair.info, host-only anywhere else. */
export function themeCookieDomain(hostname: string): string | undefined {
  const host = hostname.toLowerCase().replace(/\.$/, '');

  return host === THEME_COOKIE_DOMAIN || host.endsWith(`.${THEME_COOKIE_DOMAIN}`)
    ? `.${THEME_COOKIE_DOMAIN}`
    : undefined;
}

/** The Set-Cookie / document.cookie string that stores a choice for a year. */
export function serializeThemeCookie(
  choice: ThemeChoice,
  { hostname, secure = false }: { hostname: string; secure?: boolean },
): string {
  const domain = themeCookieDomain(hostname);

  return [
    `${THEME_COOKIE}=${choice}`,
    'Path=/',
    `Max-Age=${THEME_COOKIE_MAX_AGE}`,
    'SameSite=Lax',
    domain ? `Domain=${domain}` : null,
    secure ? 'Secure' : null,
  ]
    .filter(Boolean)
    .join('; ');
}

/**
 * "lite" trims the glass for always-on screens such as wallboards: no edge lens or refraction
 * and a lighter frost (see kit.css). Unlike GlassyUI's own data-lg-quality, which GlassProvider
 * recomputes per device, this attribute stays as the server rendered it.
 */
export type GlassLevel = 'full' | 'lite';

export type HtmlThemeOptions = {
  /** Other classes for <html>, such as a next/font variable class. Merged with the theme class. */
  className?: string;
  /** Pins this app to one theme whatever the visitor chose. Pass the same value to ThemeScript and KitProviders. */
  forcedTheme?: ResolvedTheme;
  glass?: GlassLevel;
};

export type HtmlThemeProps = {
  className?: string;
  style: { colorScheme: ResolvedTheme | 'light dark' };
  'data-ca-theme': ThemeChoice;
  'data-lg-theme'?: ResolvedTheme;
  'data-ca-glass'?: 'lite';
  /**
   * The head script corrects these attributes before first paint (a "system" visitor, or a page
   * rendered before the cookie changed), so React must accept the DOM's values for <html> itself.
   * This only silences <html>'s own attributes, never its children.
   */
  suppressHydrationWarning: true;
};

/**
 * The attributes <html> should server-render for a choice: the theme class Tailwind's `dark:`
 * variant reads, GlassyUI's data-lg-theme, and color-scheme for native controls and scrollbars.
 * For "system" the server cannot know the answer, so it leaves the theme to ThemeScript.
 *
 *   <html lang="en" {...htmlThemeProps(await getThemeChoice(), { className: font.variable })}>
 */
export function htmlThemeProps(
  choice: ThemeChoice = DEFAULT_THEME_CHOICE,
  { className, forcedTheme, glass }: HtmlThemeOptions = {},
): HtmlThemeProps {
  const effective: ThemeChoice = forcedTheme ?? choice;
  const resolved = resolveTheme(effective, undefined);
  const classes = [className, resolved].filter(Boolean).join(' ');

  return {
    ...(classes ? { className: classes } : null),
    style: { colorScheme: resolved ?? 'light dark' },
    'data-ca-theme': effective,
    ...(resolved ? { 'data-lg-theme': resolved } : null),
    ...(glass === 'lite' ? { 'data-ca-glass': 'lite' as const } : null),
    suppressHydrationWarning: true,
  };
}
