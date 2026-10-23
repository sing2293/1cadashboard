'use client';

import { useCallback } from 'react';
import { useOptionalPreferences } from '../components/glassyui/glass-provider';
import type { GlassyUiQuality } from '../components/glassyui/lib/preferences';

export type GlassEffects = {
  /** True when glass is drawn as opaque panels: the visitor asked, or the OS reduces transparency. */
  reduced: boolean;
  /** The rendering quality GlassyUI picked for this device (or the visitor's explicit choice). */
  quality: GlassyUiQuality;
  /** Turns reduced glass on or off for this visitor. */
  setReduced: (reduced: boolean) => void;
};

/**
 * "Reduce glass effects", for a settings menu: a passthrough to GlassyUI's reduce-transparency
 * preference, which swaps frost and refraction for opaque surfaces. GlassyUI remembers it per
 * app (this origin's localStorage), unlike the theme, which every app shares. For a screen that
 * should always run light glass, such as a wallboard, render <html data-ca-glass="lite"> instead
 * (htmlThemeProps(choice, { glass: 'lite' })), which leaves the visitor's preferences alone.
 */
export function useGlassEffects(): GlassEffects {
  const { preferences, setPreferences } = useOptionalPreferences();

  const setReduced = useCallback(
    (reduced: boolean) => setPreferences({ reduceTransparency: reduced }),
    [setPreferences],
  );

  return { reduced: preferences.reduceTransparency, quality: preferences.quality, setReduced };
}
