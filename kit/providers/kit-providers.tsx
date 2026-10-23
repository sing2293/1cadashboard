'use client';

import { useLayoutEffect, useMemo, type ReactNode } from 'react';
import { GlassProvider, usePreferences } from '../components/glassyui/glass-provider';
import { GlassToastProvider, GlassToastViewport } from '../components/glassyui/glass-toast';
import { GlassTooltipProvider } from '../components/glassyui/glass-tooltip';
import { DEFAULT_THEME_CHOICE, type ResolvedTheme, type ThemeChoice } from '../theme/theme';
import {
  ThemeConfigContext,
  useDocumentThemeSync,
  useThemeChoice,
  type ThemeConfig,
} from '../theme/theme-store';

export type KitProvidersProps = {
  children: ReactNode;
  /**
   * The choice the root layout rendered <html> with (await getThemeChoice()). Leave it out
   * on a static layout; the toggle then shows the default until the browser reads the cookie.
   */
  initialTheme?: ThemeChoice;
  /**
   * Pins this app to one theme whatever the visitor chose elsewhere, as a wallboard read in a
   * lit office does. Pass the same value to htmlThemeProps and ThemeScript. ThemeToggle then
   * renders nothing.
   */
  forcedTheme?: ResolvedTheme;
  /** How long a pointer rests on a GlassTooltip trigger before it opens, in ms. */
  tooltipDelay?: number;
  /** Renders the top-right toast viewport GlassToast portals into. On by default. */
  toastViewport?: boolean;
};

/**
 * Everything the 1CA Glass components need, once, in each app's root layout (inside
 * ClerkProvider): the shared theme, GlassyUI's preferences, tooltips and toasts.
 */
export function KitProviders({
  children,
  initialTheme = DEFAULT_THEME_CHOICE,
  forcedTheme,
  tooltipDelay = 350,
  toastViewport = true,
}: KitProvidersProps) {
  const config = useMemo<ThemeConfig>(
    () => ({ initialChoice: initialTheme, forcedTheme }),
    [forcedTheme, initialTheme],
  );

  return (
    <ThemeConfigContext.Provider value={config}>
      <ThemedGlass>
        <GlassTooltipProvider delayDuration={tooltipDelay}>
          <GlassToastProvider swipeDirection="right">
            {children}
            {toastViewport ? <GlassToastViewport /> : null}
          </GlassToastProvider>
        </GlassTooltipProvider>
      </ThemedGlass>
    </ThemeConfigContext.Provider>
  );
}

/**
 * GlassProvider takes its theme from the shared cookie. Its own choice would come from this
 * origin's localStorage, where an explicit theme outranks defaultTheme; the head script clears
 * that, and GlassThemeGuard corrects anything that sets one later.
 */
function ThemedGlass({ children }: { children: ReactNode }) {
  const theme = useThemeChoice();

  useDocumentThemeSync(theme);

  return (
    <GlassProvider defaultTheme={theme.resolvedTheme}>
      <GlassThemeGuard theme={theme.resolvedTheme} />
      {children}
    </GlassProvider>
  );
}

/**
 * Lens and switch glass rebuild their maps when GlassyUI's theme preference changes, which keeps
 * their labels readable after a switch. If anything (a stored preference, or a call to
 * setPreferences) leaves that preference on another theme, this puts it back before paint.
 */
function GlassThemeGuard({ theme }: { theme: ResolvedTheme | undefined }) {
  const { preferences, setPreferences } = usePreferences();

  useLayoutEffect(() => {
    if (theme && preferences.theme !== theme) setPreferences({ theme });
  }, [preferences.theme, setPreferences, theme]);

  return null;
}
