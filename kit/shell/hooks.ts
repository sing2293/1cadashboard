"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useEffectEvent, useMemo, useSyncExternalStore } from "react";
import { toHubAccess, type HubAccessMetadata } from "../config/access";

export interface HubViewer {
  /** False until Clerk has loaded the user. */
  isLoaded: boolean;
  isSignedIn: boolean;
  /** Full name, else username, else email. Empty while loading. */
  name: string;
  email: string | null;
  /** A real photo only; null means show initials. */
  imageUrl: string | null;
  /** The resolved access fields from the user's Clerk publicMetadata. Empty until known. */
  access: HubAccessMetadata;
  /** True once `access` reflects the person, rather than the empty placeholder. */
  accessKnown: boolean;
}

/**
 * The signed-in person and what the hub lets them open, from the user's
 * publicMetadata via Clerk's useUser(). Until the user has loaded, the session
 * token's "metadata" claim stands in, and before Clerk has loaded at all (the
 * server render and hydration) `initialAccess` does: the same claim, read on the
 * server and passed down (AppShell's `initialAccess`). Needs ClerkProvider above
 * it. For hiding UI only: the server (proxy, pages, APIs) still decides what is
 * allowed.
 */
export function useHubViewer(initialAccess?: unknown): HubViewer {
  const { isLoaded, isSignedIn, user } = useUser();
  const { sessionClaims } = useAuth();
  // Only read while the user is loading, so token refreshes don't re-render the shell later.
  const claimed = user ? undefined : sessionClaims?.metadata;

  return useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress ?? null;
    const source: unknown = user ? user.publicMetadata : (claimed ?? initialAccess);
    return {
      isLoaded,
      isSignedIn: Boolean(isSignedIn),
      name: user?.fullName || user?.username || email || "",
      email,
      imageUrl: user?.hasImage ? user.imageUrl : null,
      access: toHubAccess(source),
      accessKnown: source !== undefined && source !== null,
    };
  }, [claimed, initialAccess, isLoaded, isSignedIn, user]);
}

// ---------------------------------------------------------------------------
// A remembered flag. localStorage when it works, memory when it doesn't (a
// private window, blocked storage), so toggles always take effect.

const STORE_EVENT = "1ca-shell-store";
const memory = new Map<string, string>();

function subscribeStore(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(STORE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(STORE_EVENT, onChange);
  };
}

function readStore(key: string): string | null {
  const unsaved = memory.get(key);
  if (unsaved !== undefined) return unsaved;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStore(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
    memory.delete(key);
  } catch {
    memory.set(key, value);
  }
  window.dispatchEvent(new Event(STORE_EVENT));
}

/**
 * A choice kept in localStorage under `key`: true, false, or null while the
 * person hasn't made one. The server render, and the first render in the
 * browser, see null; the stored value follows.
 */
export function useStoredChoice(key: string): [boolean | null, (value: boolean) => void] {
  const stored = useSyncExternalStore(
    subscribeStore,
    () => readStore(key),
    () => null,
  );
  const set = useCallback((value: boolean) => writeStore(key, value ? "1" : "0"), [key]);
  return [stored === null ? null : stored === "1", set];
}

// ---------------------------------------------------------------------------

/**
 * Whether a media query matches, kept live. The server render, and the first
 * render in the browser, use `serverValue`; the real answer follows.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => (typeof window.matchMedia === "function" ? window.matchMedia(query).matches : serverValue),
    () => serverValue,
  );
}

// ---------------------------------------------------------------------------

const subscribeNever = () => () => {};

function readApplePlatform(): boolean {
  const nav = window.navigator as Navigator & { userAgentData?: { platform?: string } };
  return /mac|iphone|ipad|ipod/i.test(nav.userAgentData?.platform || nav.platform || "");
}

/** True on Apple devices, where the palette shortcut reads ⌘K. False on the server. */
export function useIsApplePlatform(): boolean {
  return useSyncExternalStore(subscribeNever, readApplePlatform, () => false);
}

const TEXT_INPUT_TYPES =
  /^(?:text|search|email|url|tel|password|number|date|datetime-local|month|time|week)$/;

/**
 * A field someone is typing in: a text input, a textarea or a rich-text editor.
 * There ⌘K / Ctrl+K stays the browser's or the editor's (focus the address bar,
 * insert a link). The palette's own search field is the exception, so the
 * shortcut still closes it.
 */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element) || target.closest("[cmdk-root]")) return false;
  if (target instanceof HTMLInputElement) return TEXT_INPUT_TYPES.test(target.type);
  if (target instanceof HTMLTextAreaElement) return true;
  return target instanceof HTMLElement && target.isContentEditable;
}

/**
 * Calls `onPress` on ⌘K (Apple) or Ctrl+K (everywhere else), from anywhere on
 * the page except a field someone is typing in.
 */
export function useCommandShortcut(onPress: () => void) {
  const press = useEffectEvent(onPress);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.repeat) return;
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      // Browser autofill sends keydown events without a key.
      if (typeof event.key !== "string" || event.key.toLowerCase() !== "k") return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      press();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
