import { hasPermission, type HubAccessMetadata } from "../config/access";
import type { NavItem } from "./types";

/** A full URL (another site), which opens in a new tab instead of routing in the app. */
export function isExternalHref(href: string): boolean {
  return /^[a-z][a-z\d+.-]*:\/\//i.test(href);
}

/** The path part of an in-app href, without query, hash or trailing slash. */
export function pathOf(href: string): string {
  const cut = href.search(/[?#]/);
  const path = cut === -1 ? href : href.slice(0, cut);
  if (path === "" || path === "/") return "/";
  return path.replace(/\/+$/, "");
}

function matches(item: NavItem, pathname: string): boolean {
  if (isExternalHref(item.href)) return false;
  const path = pathOf(item.href);
  const mode = item.match ?? (path === "/" ? "exact" : "prefix");
  if (pathname === path) return true;
  if (mode === "exact") return false;
  return path === "/" || pathname.startsWith(`${path}/`);
}

/** Every item, parents before their children. */
export function flattenNav(items: readonly NavItem[]): NavItem[] {
  return items.flatMap((item) => [item, ...flattenNav(item.children ?? [])]);
}

/**
 * The href of the link that is the current page: of all the links matching
 * the pathname, the one with the longest path. Null when none match.
 */
export function findActiveHref(items: readonly NavItem[], pathname: string | null): string | null {
  if (!pathname) return null;
  const current = pathOf(pathname);
  let best: string | null = null;
  let bestLength = -1;
  for (const item of flattenNav(items)) {
    if (!matches(item, current)) continue;
    const length = pathOf(item.href).length;
    if (length > bestLength) {
      best = item.href;
      bestLength = length;
    }
  }
  return best;
}

/** True when the item, or anything under it, is the current page. */
export function containsHref(item: NavItem, href: string | null): boolean {
  if (href === null) return false;
  return item.href === href || (item.children ?? []).some((child) => containsHref(child, href));
}

/** The items this person may see: those without a `perm`, and those whose `perm` they hold. */
export function visibleNav(
  items: readonly NavItem[],
  meta: HubAccessMetadata | null | undefined,
): NavItem[] {
  return items
    .filter((item) => !item.perm || hasPermission(meta, item.perm))
    .map((item) => (item.children ? { ...item, children: visibleNav(item.children, meta) } : item));
}

/** Adds the current query string to an in-app href that has none of its own. */
export function withSearch(href: string, search: string): string {
  if (!search || isExternalHref(href) || /[?#]/.test(href)) return href;
  return `${href}${search}`;
}
