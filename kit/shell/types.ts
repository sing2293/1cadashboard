import type { LucideIcon } from "lucide-react";
import type { ReactElement, ReactNode } from "react";

/** One link in an app's sidebar (and in its ⌘K palette). */
export interface NavItem {
  label: string;
  /** A path inside this app ("/sales"), or a full https:// URL, which opens in a new tab. */
  href: string;
  /**
   * A lucide-react icon, such as `ChartLine`. A server component cannot pass a
   * component to the (client) shell, so define the nav in a "use client"
   * wrapper (see index.ts), or pass an element instead (`icon: <ChartLine />`).
   */
  icon?: LucideIcon | ReactElement;
  /**
   * When the link is the current page. "exact": only on its own path.
   * "prefix": on its path and anything under it. Defaults to "exact" for "/"
   * and "prefix" for everything else. When several links match, the longest
   * path wins, so "/dashboard" and "/dashboard/posts" can both be "prefix".
   */
  match?: "exact" | "prefix";
  /** A count or short tag at the end of the row, such as 3 or "New". */
  badge?: ReactNode;
  /** Pages under this one, listed beneath it. */
  children?: NavItem[];
  /**
   * Only people holding this hub permission see the link (admins see all),
   * e.g. "sales:sync". Hiding a link is a courtesy: the page itself must
   * still check access on the server.
   */
  perm?: string;
}

export interface AppShellProps {
  /** This app's id in the registry: "hub", "sales", "pipedrive", "calls", "uploader" or "punches". */
  appId: string;
  /** The sidebar's links, top to bottom. */
  nav: NavItem[];
  /** Extra buttons for the top bar, placed before the theme toggle. Keep them compact. */
  actions?: ReactNode;
  /**
   * Wallboard pages: no sidebar and a slim (48px) top bar, so the content gets
   * the whole width. The nav stays one tap away in the menu sheet and in ⌘K.
   */
  fullBleed?: boolean;
  /** Pinned under the nav in the expanded sidebar and the mobile sheet (hidden on the icon rail). */
  sidebarFooter?: ReactNode;
  /** Where the app's name in the top bar leads. Defaults to the first nav link, or "/". */
  homeHref?: string;
  /**
   * Carry the current query string onto in-app nav links, so filters such as
   * a date range survive moving between pages.
   */
  preserveSearchParams?: boolean;
  /**
   * What the server already knows this person may open: the session token's
   * "metadata" claim, `(await auth()).sessionClaims?.metadata` in the group's
   * server layout, passed through the app's Shell wrapper. Until Clerk has
   * loaded in the browser the shell reads access from it, so links with a
   * `perm` and the other apps in the switcher are in the server HTML instead
   * of appearing after hydration. Optional; hiding only, the server still
   * checks access.
   */
  initialAccess?: unknown;
  children: ReactNode;
}
