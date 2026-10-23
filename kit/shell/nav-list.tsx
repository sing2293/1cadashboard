"use client";

import { ArrowUpRight, ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  isValidElement,
  Suspense,
  useId,
  useState,
  type ComponentPropsWithRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  GlassTooltip,
  GlassTooltipContent,
  GlassTooltipTrigger,
} from "../components/glassyui/glass-tooltip";
import { accentGradient } from "../config/apps";
import { cn } from "../lib/utils";
import { useShell } from "./context";
import { containsHref, findActiveHref, isExternalHref, withSearch } from "./nav-model";
import {
  BORDER,
  FOCUS_RING,
  TEXT,
  TEXT_MUTED,
  TRANSITION,
  WASH,
  WASH_ACTIVE,
  WASH_HOVER,
} from "./styles";
import type { NavItem } from "./types";

interface ListOptions {
  /** The icon rail: icons only, labels in tooltips, sub-pages hidden. */
  rail: boolean;
  /** Called when a link is followed, e.g. to close the mobile sheet. */
  onNavigate?: () => void;
}

interface NavListProps extends ListOptions {
  items: NavItem[];
  activeHref: string | null;
  search: string;
}

/**
 * The app's links with the current page highlighted. Reading the URL can
 * suspend while a page prerenders, so the links first render without a
 * highlight and pick it up once the URL is known.
 */
export function RoutedNavList(props: ListOptions) {
  const { nav } = useShell();
  return (
    <Suspense fallback={<NavList {...props} items={nav} activeHref={null} search="" />}>
      <ActiveNavList {...props} />
    </Suspense>
  );
}

function ActiveNavList(props: ListOptions) {
  const { nav, preserveSearchParams } = useShell();
  const activeHref = findActiveHref(nav, usePathname());
  return preserveSearchParams ? (
    <SearchKeepingNavList {...props} items={nav} activeHref={activeHref} />
  ) : (
    <NavList {...props} items={nav} activeHref={activeHref} search="" />
  );
}

function SearchKeepingNavList(props: Omit<NavListProps, "search">) {
  const params = useSearchParams();
  const query = params.toString();
  return <NavList {...props} search={query ? `?${query}` : ""} />;
}

export function NavList({ items, ...rest }: NavListProps) {
  return (
    <ul role="list" className="flex flex-col gap-0.5">
      {items.map((item, index) => (
        <NavRow key={`${index}:${item.href}`} item={item} depth={0} {...rest} />
      ))}
    </ul>
  );
}

interface RowProps extends Omit<NavListProps, "items"> {
  item: NavItem;
  depth: number;
}

function NavRow({ item, depth, activeHref, search, rail, onNavigate }: RowProps) {
  const childrenId = useId();
  const subItems = rail ? [] : (item.children ?? []);
  const current = item.href === activeHref;
  const inSection = !current && containsHref(item, activeHref);
  // Opens by itself around the current page; a click on the chevron decides from then on.
  const [chosen, setChosen] = useState<boolean | null>(null);
  const open = chosen ?? (current || inSection);

  const link = (
    <NavLink
      item={item}
      depth={depth}
      current={current}
      inSection={inSection}
      search={search}
      rail={rail}
      onNavigate={onNavigate}
    />
  );

  return (
    <li>
      {rail ? (
        <GlassTooltip>
          <GlassTooltipTrigger asChild>{link}</GlassTooltipTrigger>
          <GlassTooltipContent side="right">
            {item.label}
            {isCount(item.badge) ? (
              <span aria-hidden className={cn("ml-1.5", TEXT_MUTED)}>
                {item.badge}
              </span>
            ) : null}
          </GlassTooltipContent>
        </GlassTooltip>
      ) : subItems.length > 0 ? (
        <div className="flex items-center gap-0.5">
          {link}
          <button
            type="button"
            aria-expanded={open}
            aria-controls={childrenId}
            onClick={() => setChosen(!open)}
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-lg",
              TEXT_MUTED,
              WASH_HOVER,
              FOCUS_RING,
              TRANSITION,
            )}
          >
            <ChevronRight
              aria-hidden
              className={cn(
                "size-4 transition-transform duration-150 motion-reduce:transition-none",
                open && "rotate-90",
              )}
            />
            <span className="sr-only">
              {open ? "Hide" : "Show"} pages under {item.label}
            </span>
          </button>
        </div>
      ) : (
        link
      )}
      {subItems.length > 0 ? (
        <ul
          id={childrenId}
          role="list"
          hidden={!open}
          className={cn(
            "ml-[1.375rem] mt-0.5 flex-col gap-0.5 border-l pl-2",
            BORDER,
            open ? "flex" : "hidden",
          )}
        >
          {subItems.map((child, index) => (
            <NavRow
              key={`${index}:${child.href}`}
              item={child}
              depth={depth + 1}
              activeHref={activeHref}
              search={search}
              rail={rail}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

interface LinkProps extends ComponentPropsWithRef<"a"> {
  item: NavItem;
  depth: number;
  current: boolean;
  inSection: boolean;
  search: string;
  rail: boolean;
  onNavigate?: () => void;
}

/** One row. Spreads the rest of its props onto the anchor so it can be a tooltip trigger. */
function NavLink({
  item,
  depth,
  current,
  inSection,
  search,
  rail,
  onNavigate,
  className,
  onClick,
  ...anchorProps
}: LinkProps) {
  const { app } = useShell();
  const external = isExternalHref(item.href);
  const hasBadge = item.badge !== undefined && item.badge !== null && item.badge !== false;

  const body = (
    <>
      {current ? (
        <span
          aria-hidden
          className="absolute inset-y-2 left-0 w-[3px] rounded-full"
          style={{ backgroundImage: accentGradient(app, 180) }}
        />
      ) : null}
      {item.icon || depth === 0 || rail ? (
        <span className="relative grid size-5 shrink-0 place-items-center">
          <NavIcon icon={item.icon} label={item.label} rail={rail} />
          {rail && hasBadge ? (
            <span
              aria-hidden
              className="absolute -right-1 -top-0.5 size-2 rounded-full ring-2 ring-[color:var(--ca-surface-solid,var(--lg-opaque-surface))]"
              style={{ backgroundColor: app.accent[0] }}
            />
          ) : null}
        </span>
      ) : null}
      <span className={cn("min-w-0 flex-1 truncate", rail && "sr-only")}>{item.label}</span>
      {hasBadge && !rail ? <NavBadge badge={item.badge} /> : null}
      {rail && isCount(item.badge) ? <span className="sr-only"> ({item.badge})</span> : null}
      {external && !rail ? (
        <ArrowUpRight aria-hidden className={cn("size-3.5 shrink-0", TEXT_MUTED)} />
      ) : null}
      {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </>
  );

  const tone = current
    ? cn(TEXT, WASH_ACTIVE, "font-semibold")
    : inSection
      ? cn(TEXT, WASH_HOVER)
      : cn(TEXT_MUTED, WASH_HOVER, "hover:text-[color:var(--ca-text,var(--lg-foreground))]");

  const classes = cn(
    "relative flex min-w-0 items-center gap-3 rounded-[10px] font-medium",
    depth === 0 ? "h-9 text-sm" : "h-8 text-[13px]",
    rail ? "mx-auto w-10 justify-center px-0" : "flex-1 px-2.5",
    tone,
    FOCUS_RING,
    TRANSITION,
    className,
  );

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) onNavigate?.();
  };

  if (external) {
    return (
      <a
        {...anchorProps}
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        onClick={handleClick}
      >
        {body}
      </a>
    );
  }

  return (
    <Link
      {...anchorProps}
      href={withSearch(item.href, search)}
      aria-current={current ? "page" : undefined}
      className={classes}
      onClick={handleClick}
    >
      {body}
    </Link>
  );
}

function NavIcon({
  icon,
  label,
  rail,
}: {
  icon: NavItem["icon"];
  label: string;
  rail: boolean;
}) {
  if (isValidElement(icon)) {
    return (
      <span aria-hidden className="grid size-[18px] place-items-center [&>svg]:size-[18px]">
        {icon}
      </span>
    );
  }
  if (icon) {
    const Icon = icon as LucideIcon;
    return <Icon aria-hidden className="size-[18px]" strokeWidth={1.9} />;
  }
  // No icon: initials on the rail, a quiet dot in the list.
  return rail ? (
    <span aria-hidden className="text-xs font-semibold uppercase tracking-wide">
      {initialsOf(label)}
    </span>
  ) : (
    <span aria-hidden className="size-1.5 rounded-full bg-current opacity-50" />
  );
}

function NavBadge({ badge }: { badge: ReactNode }) {
  if (!isCount(badge)) return <span className="shrink-0">{badge}</span>;
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-1.5 py-px text-xs font-semibold leading-4 tabular-nums",
        WASH,
      )}
    >
      {badge}
    </span>
  );
}

function isCount(value: ReactNode): value is string | number {
  return typeof value === "string" || typeof value === "number";
}

function initialsOf(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? "")
    .join("");
}
