import { cookies } from 'next/headers';
import { DEFAULT_THEME_CHOICE, THEME_COOKIE, parseThemeChoice, type ThemeChoice } from './theme';

export { htmlThemeProps } from './theme';
export type {
  GlassLevel,
  HtmlThemeOptions,
  HtmlThemeProps,
  ResolvedTheme,
  ThemeChoice,
} from './theme';

/**
 * The visitor's saved theme choice, for a root layout to render <html> with:
 *
 *   const theme = await getThemeChoice();
 *   <html lang="en" {...htmlThemeProps(theme)}>
 *
 * Reading cookies makes every route under the layout dynamic (and, under Cache Components,
 * request-time). Our apps are signed-in and dynamic already; a static layout can skip this,
 * call htmlThemeProps() with no choice, and let ThemeScript read the cookie in the browser.
 */
export async function getThemeChoice(): Promise<ThemeChoice> {
  const store = await cookies();

  return parseThemeChoice(store.get(THEME_COOKIE)?.value) ?? DEFAULT_THEME_CHOICE;
}
