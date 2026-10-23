'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { useMemo, type ComponentProps } from 'react';
import { DEFAULT_THEME_CHOICE, type ResolvedTheme, type ThemeChoice } from '../theme/theme';
import { ThemeConfigContext, useThemeChoice, type ThemeConfig } from '../theme/theme-store';
import { clerkAppearance, mergeClerkAppearance } from './appearance';

type ClerkProviderProps = ComponentProps<typeof ClerkProvider>;

export type ThemedClerkProviderProps = Omit<ClerkProviderProps, 'dynamic'> & {
  /** The choice the root layout rendered <html> with (await getThemeChoice()); same as KitProviders. */
  initialTheme?: ThemeChoice;
  /** A pinned theme, as passed to KitProviders and htmlThemeProps. */
  forcedTheme?: ResolvedTheme;
};

/**
 * ClerkProvider in the 1CA look, following the visitor's light/dark choice live. Every
 * ClerkProvider prop passes through; an `appearance` you pass is layered over the kit's
 * (mergeClerkAppearance). Put it in the root layout inside <body>, around KitProviders:
 *
 *   <body>
 *     <ThemedClerkProvider initialTheme={theme}>
 *       <KitProviders initialTheme={theme}>{children}</KitProviders>
 *     </ThemedClerkProvider>
 *   </body>
 *
 * It is the client ClerkProvider, which reads the same NEXT_PUBLIC_CLERK_* settings. The
 * server-only `dynamic` prop is not available here.
 */
export function ThemedClerkProvider({
  initialTheme = DEFAULT_THEME_CHOICE,
  forcedTheme,
  ...props
}: ThemedClerkProviderProps) {
  const config = useMemo<ThemeConfig>(
    () => ({ initialChoice: initialTheme, forcedTheme }),
    [forcedTheme, initialTheme],
  );

  return (
    <ThemeConfigContext.Provider value={config}>
      <ThemedClerk {...props} />
    </ThemeConfigContext.Provider>
  );
}

function ThemedClerk({ appearance, children, ...props }: Omit<ClerkProviderProps, 'dynamic'>) {
  const { resolvedTheme } = useThemeChoice();
  // Undefined only while a "system" page hydrates; Clerk's UI has not mounted yet then.
  const theme: ResolvedTheme = resolvedTheme ?? 'dark';

  const merged = useMemo(
    () => mergeClerkAppearance(clerkAppearance(theme), appearance),
    [appearance, theme],
  );

  return (
    <ClerkProvider {...props} appearance={merged}>
      {children}
    </ClerkProvider>
  );
}
