'use client';

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useSyncExternalStore } from 'react';
import {
  DEFAULT_THEME_CHOICE,
  SYSTEM_LIGHT_QUERY,
  THEME_CHANGE_EVENT,
  THEME_COOKIE,
  readThemeCookie,
  resolveTheme,
  serializeThemeCookie,
  themeCookieDomain,
  type ResolvedTheme,
  type ThemeChoice,
} from './theme';

/**
 * The browser's ca-theme cookie is the source of truth. The server's reading of it only seeds the
 * first render, so the server markup and hydration agree; the cookie wins as soon as the page runs.
 */
export type ThemeConfig = {
  /** The choice the server rendered with (getThemeChoice), reported until the cookie is read. */
  initialChoice: ThemeChoice;
  /** Set when this app pins one theme whatever the visitor chose. */
  forcedTheme?: ResolvedTheme;
};

export const ThemeConfigContext = createContext<ThemeConfig>({
  initialChoice: DEFAULT_THEME_CHOICE,
});

export type ThemeState = {
  /** The saved choice: "light", "dark" or "system". */
  choice: ThemeChoice;
  /**
   * The theme on screen. Undefined only while a "system" choice is server rendered or
   * hydrating, when the operating system's setting is not known yet.
   */
  resolvedTheme: ResolvedTheme | undefined;
  /** What the operating system asks for; undefined on the server and during hydration. */
  systemTheme: ResolvedTheme | undefined;
  /** This app's pinned theme, if it has one (KitProviders forcedTheme). */
  forcedTheme: ResolvedTheme | undefined;
  /** Saves the choice for every 1cleanair.info app and applies it to this page at once. */
  setChoice: (choice: ThemeChoice) => void;
};

let systemQuery: MediaQueryList | null | undefined;

function getSystemQuery(): MediaQueryList | null {
  if (systemQuery === undefined) {
    systemQuery =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia(SYSTEM_LIGHT_QUERY)
        : null;
  }

  return systemQuery;
}

/** The theme the operating system asks for right now. */
export function readSystemTheme(): ResolvedTheme {
  return getSystemQuery()?.matches ? 'light' : 'dark';
}

/** The choice saved in this browser's cookie, or the default when there is none. */
export function readStoredChoice(): ThemeChoice {
  try {
    return readThemeCookie(document.cookie) ?? DEFAULT_THEME_CHOICE;
  } catch {
    // Sandboxed documents throw on document.cookie.
    return DEFAULT_THEME_CHOICE;
  }
}

const readServerSystemTheme = (): ResolvedTheme | undefined => undefined;

type ChangeSource = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

/**
 * Re-reads the choice when this page changes it, when the OS theme flips, and when the
 * visitor comes back to the tab, which picks up a choice made in another 1cleanair.info app.
 * Where the Cookie Store API exists, another tab's change arrives immediately.
 */
function subscribe(onChange: () => void) {
  const query = getSystemQuery();
  // SAFETY: the Cookie Store API is absent in some engines; only its EventTarget side is used.
  const cookieStore = (window as Window & { cookieStore?: ChangeSource }).cookieStore;

  const onVisible = () => {
    if (document.visibilityState === 'visible') onChange();
  };

  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener('focus', onChange);
  document.addEventListener('visibilitychange', onVisible);
  query?.addEventListener('change', onChange);
  cookieStore?.addEventListener('change', onChange);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener('focus', onChange);
    document.removeEventListener('visibilitychange', onVisible);
    query?.removeEventListener('change', onChange);
    cookieStore?.removeEventListener('change', onChange);
  };
}

/** Saves a choice: shared across 1cleanair.info, host-only elsewhere (localhost, previews). */
export function writeThemeCookie(choice: ThemeChoice) {
  const { hostname, protocol } = window.location;

  if (themeCookieDomain(hostname)) {
    // A host-only copy on this host would shadow the shared cookie here, so it goes first.
    document.cookie = `${THEME_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  }

  document.cookie = serializeThemeCookie(choice, { hostname, secure: protocol === 'https:' });
}

const NO_TRANSITIONS = '*,*::before,*::after{-webkit-transition:none!important;transition:none!important}';

/**
 * Turns transitions off while the theme flips, so every surface changes in the same frame
 * instead of each fading at its own speed. Returns the function that turns them back on.
 */
function pauseTransitions() {
  const style = document.createElement('style');
  style.textContent = NO_TRANSITIONS;
  document.head.appendChild(style);

  return () => {
    // Style the page in its new colours while transitions are still off, then restore them.
    void window.getComputedStyle(document.documentElement).getPropertyValue('color-scheme');
    window.setTimeout(() => style.remove(), 1);
  };
}

/**
 * Puts a theme on <html>: the class Tailwind's dark: variant reads, GlassyUI's data-lg-theme,
 * the saved choice for CSS hooks, and color-scheme for native controls. A no-op when nothing
 * differs, so it is safe to call after every render.
 */
export function applyThemeToDocument(resolved: ResolvedTheme, choice: ThemeChoice) {
  const root = document.documentElement;
  const stale = resolved === 'dark' ? 'light' : 'dark';

  const differs =
    root.classList.contains(stale) ||
    !root.classList.contains(resolved) ||
    root.getAttribute('data-lg-theme') !== resolved ||
    root.style.colorScheme !== resolved;

  if (differs) {
    const resume = pauseTransitions();

    root.classList.remove(stale);
    root.classList.add(resolved);
    root.setAttribute('data-lg-theme', resolved);
    root.style.colorScheme = resolved;
    resume();
  }

  if (root.getAttribute('data-ca-theme') !== choice) {
    root.setAttribute('data-ca-theme', choice);
  }
}

/**
 * Saves a choice and shows it at once, before React renders anything, then lets every
 * useThemeChoice() caller re-read it. In an app with a forced theme the choice is still
 * saved for the other apps, but this page keeps its pinned theme.
 */
export function setThemeChoice(choice: ThemeChoice, forcedTheme?: ResolvedTheme) {
  writeThemeCookie(choice);

  if (!forcedTheme) {
    applyThemeToDocument(choice === 'system' ? readSystemTheme() : choice, choice);
  }

  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/** The visitor's theme choice, the theme on screen, and a setter shared by every 1CA app. */
export function useThemeChoice(): ThemeState {
  const { initialChoice, forcedTheme } = useContext(ThemeConfigContext);

  const choice = useSyncExternalStore(subscribe, readStoredChoice, () => initialChoice);

  const systemTheme = useSyncExternalStore<ResolvedTheme | undefined>(
    subscribe,
    readSystemTheme,
    readServerSystemTheme,
  );

  const resolvedTheme = forcedTheme ?? resolveTheme(choice, systemTheme);

  const setChoice = useCallback(
    (next: ThemeChoice) => setThemeChoice(next, forcedTheme),
    [forcedTheme],
  );

  return useMemo(
    () => ({ choice, resolvedTheme, systemTheme, forcedTheme, setChoice }),
    [choice, forcedTheme, resolvedTheme, setChoice, systemTheme],
  );
}

/**
 * Keeps <html> on the theme after every render of the component that owns the theme. The head
 * script set it before first paint, but React resets <html> to the attributes it renders in
 * two cases: Strict Mode's development remount, and a server re-render of the root layout
 * (say "dark" becoming "system"). A layout effect re-applies it before the browser paints.
 */
export function useDocumentThemeSync({ choice, resolvedTheme, forcedTheme }: ThemeState) {
  useLayoutEffect(() => {
    if (resolvedTheme) applyThemeToDocument(resolvedTheme, forcedTheme ?? choice);
  });
}
