import { PREFERENCE_STORAGE_KEY } from '../components/glassyui/lib/preferences';
import { DEFAULT_THEME_CHOICE, SYSTEM_LIGHT_QUERY, THEME_COOKIE, type ResolvedTheme } from './theme';

export type ThemeScriptOptions = {
  /** Pins the page to one theme whatever the visitor chose. Match KitProviders' forcedTheme. */
  forcedTheme?: ResolvedTheme;
};

export type ThemeScriptProps = ThemeScriptOptions & {
  /** The request's CSP nonce, when the app sends a Content-Security-Policy without 'unsafe-inline'. */
  nonce?: string;
};

/*
 * Runs during HTML parsing, before the first paint:
 * 1. reads the ca-theme cookie (falling back to the default), resolves "system" from the OS,
 * 2. puts the theme on <html>: class dark|light, data-lg-theme, data-ca-theme, color-scheme,
 * 3. keeps following the OS while the choice is "system" (re-reading the cookie each time,
 *    so a later explicit choice is never overridden),
 * 4. drops any theme GlassyUI saved in this origin's localStorage, so GlassProvider starts
 *    from the shared cookie rather than a per-subdomain leftover.
 * Plain ES5 and every step guarded: a failure leaves the server-rendered attributes alone.
 */
const SOURCE = `(function(o){var d=document.documentElement,q=null;try{q=window.matchMedia(o.q)}catch(e){}
function read(){var all=document.cookie.split(';');for(var i=0;i<all.length;i++){var kv=all[i].replace(/^\\s+/,'');if(kv.indexOf(o.c+'=')===0){var v=kv.slice(o.c.length+1);if(v==='light'||v==='dark'||v==='system')return v}}return o.d}
function apply(){var c=o.f||read(),r=c==='system'?(q&&q.matches?'light':'dark'):c;d.classList.remove(r==='dark'?'light':'dark');d.classList.add(r);d.setAttribute('data-lg-theme',r);d.setAttribute('data-ca-theme',c);d.style.colorScheme=r}
try{apply();if(q&&!o.f){var follow=function(){try{apply()}catch(e){}};if(q.addEventListener)q.addEventListener('change',follow);else q.addListener(follow)}}catch(e){}
try{var saved=localStorage.getItem(o.k),prefs=saved&&JSON.parse(saved);if(prefs&&typeof prefs==='object'&&'theme' in prefs){delete prefs.theme;localStorage.setItem(o.k,JSON.stringify(prefs))}}catch(e){}})`;

/** The inline script's source, for apps that place it themselves (for example with next/script). */
export function themeScript({ forcedTheme }: ThemeScriptOptions = {}): string {
  const config = JSON.stringify({
    c: THEME_COOKIE,
    d: DEFAULT_THEME_CHOICE,
    f: forcedTheme ?? '',
    k: PREFERENCE_STORAGE_KEY,
    q: SYSTEM_LIGHT_QUERY,
  }).replace(/</g, '\\u003c');

  return `${SOURCE}(${config})`;
}

/**
 * Applies the visitor's theme before first paint, with no flash in either theme. Render it
 * first thing in the root layout's <head>, and give <html> suppressHydrationWarning (included
 * in htmlThemeProps) because this script corrects <html>'s attributes before React hydrates.
 *
 * It only runs from the server's HTML. On the client it renders as text/plain, which keeps React
 * from re-running it (and from warning about a <script> in a component).
 */
export function ThemeScript({ forcedTheme, nonce }: ThemeScriptProps) {
  return (
    <script
      nonce={nonce}
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeScript({ forcedTheme }) }}
    />
  );
}
