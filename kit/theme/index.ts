// Brings the kit's missing DOM declarations into any app program that imports the theme, so
// the vendored GlassyUI source type-checks there too. Type-only: nothing reaches the bundle.
import type {} from '../types/view-timeline';

export { ThemeToggle, type ThemeToggleProps } from './theme-toggle';
export { ThemeScript, themeScript, type ThemeScriptOptions, type ThemeScriptProps } from './theme-script';
export { setThemeChoice, useThemeChoice, type ThemeState } from './theme-store';
export {
  DEFAULT_THEME_CHOICE,
  THEME_CHANGE_EVENT,
  THEME_CHOICES,
  THEME_COOKIE,
  THEME_COOKIE_DOMAIN,
  THEME_COOKIE_MAX_AGE,
  htmlThemeProps,
  isThemeChoice,
  parseThemeChoice,
  readThemeCookie,
  resolveTheme,
  serializeThemeCookie,
  themeCookieDomain,
  type GlassLevel,
  type HtmlThemeOptions,
  type HtmlThemeProps,
  type ResolvedTheme,
  type ThemeChoice,
} from './theme';
