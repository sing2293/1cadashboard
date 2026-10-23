"use client";

import { ArrowUpRight, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import {
  GlassPopover,
  GlassPopoverContent,
  GlassPopoverTrigger,
} from "../components/glassyui/glass-popover";
import {
  GlassTooltip,
  GlassTooltipContent,
  GlassTooltipTrigger,
} from "../components/glassyui/glass-tooltip";
import type { AppEntry } from "../config/apps";
import { cn } from "../lib/utils";
import { AppTile } from "./brand";
import { useShell } from "./context";
import { BORDER, FOCUS_RING, TEXT_MUTED, TRANSITION, WASH_ACTIVE, WASH_HOVER } from "./styles";

/**
 * The current app, and a grid of every app this person may open. Apps on the
 * shared login open in place; apps with their own login open in a new tab.
 */
export function AppSwitcher({
  rail = false,
  onNavigate,
}: {
  /** The icon rail: just the app's tile, with a tooltip. */
  rail?: boolean;
  /** Called when an app is chosen, e.g. to close the mobile sheet. */
  onNavigate?: () => void;
}) {
  const { app } = useShell();
  const [open, setOpen] = useState(false);

  const trigger = (
    <GlassPopoverTrigger asChild>
      <button
        type="button"
        aria-label={rail ? `${app.name}: switch app` : undefined}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left",
          rail && "justify-center",
          open ? WASH_ACTIVE : WASH_HOVER,
          FOCUS_RING,
          TRANSITION,
        )}
      >
        <AppTile app={app} size="md" />
        {rail ? null : (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold leading-5">{app.name}</span>
              <span className={cn("block text-xs leading-4", TEXT_MUTED)}>Switch app</span>
            </span>
            <ChevronsUpDown aria-hidden className={cn("size-4 shrink-0", TEXT_MUTED)} />
          </>
        )}
      </button>
    </GlassPopoverTrigger>
  );

  return (
    <GlassPopover open={open} onOpenChange={setOpen}>
      {rail ? (
        <GlassTooltip>
          <GlassTooltipTrigger asChild>{trigger}</GlassTooltipTrigger>
          <GlassTooltipContent side="right">Switch app</GlassTooltipContent>
        </GlassTooltip>
      ) : (
        trigger
      )}
      <GlassPopoverContent
        align="start"
        side={rail ? "right" : "bottom"}
        sideOffset={8}
        aria-label="Switch app"
        className="w-[min(20rem,calc(100vw-2rem))] p-2"
      >
        <AppGrid
          onNavigate={() => {
            setOpen(false);
            onNavigate?.();
          }}
        />
      </GlassPopoverContent>
    </GlassPopover>
  );
}

function AppGrid({ onNavigate }: { onNavigate: () => void }) {
  const { apps } = useShell();
  const onShared = apps.filter((entry) => entry.kind !== "external");
  const ownLogin = apps.filter((entry) => entry.kind === "external");

  return (
    <div className="flex flex-col gap-1">
      <AppSection title="1CleanAir apps" apps={onShared} onNavigate={onNavigate} />
      {ownLogin.length > 0 ? (
        <AppSection
          title="Own login"
          note="Opens in a new tab"
          apps={ownLogin}
          onNavigate={onNavigate}
          className={cn("mt-1 border-t pt-2", BORDER)}
        />
      ) : null}
    </div>
  );
}

function AppSection({
  title,
  note,
  apps,
  onNavigate,
  className,
}: {
  title: string;
  note?: string;
  apps: AppEntry[];
  onNavigate: () => void;
  className?: string;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className={className}>
      <h2
        id={headingId}
        className="flex items-baseline justify-between gap-2 px-2 pb-1 pt-1 text-xs font-semibold"
      >
        <span>{title}</span>
        {note ? <span className={cn("font-normal", TEXT_MUTED)}>{note}</span> : null}
      </h2>
      <ul role="list" className="grid grid-cols-3 gap-1">
        {apps.map((entry) => (
          <li key={entry.id}>
            <AppLink entry={entry} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function AppLink({ entry, onNavigate }: { entry: AppEntry; onNavigate: () => void }) {
  const { app, homeHref } = useShell();
  const current = entry.id === app.id;
  const external = entry.kind === "external";

  const label = [
    entry.shortName === entry.name ? entry.name : `${entry.shortName} (${entry.name})`,
    current ? "current app" : null,
    external ? "own login, opens in a new tab" : null,
    entry.underDev ? "in development" : null,
  ]
    .filter(Boolean)
    .join(", ");

  const className = cn(
    "relative flex h-full flex-col items-center gap-1.5 rounded-xl px-1 pb-2 pt-2.5 text-center",
    current ? WASH_ACTIVE : WASH_HOVER,
    FOCUS_RING,
    TRANSITION,
  );

  const body = (
    <>
      <span className="relative">
        <AppTile app={entry} size="md" />
        {external ? (
          <span
            aria-hidden
            className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-[color:var(--ca-surface-solid,var(--lg-opaque-surface))] shadow-sm"
          >
            <ArrowUpRight className="size-3" strokeWidth={2.4} />
          </span>
        ) : null}
      </span>
      <span aria-hidden className="w-full truncate text-xs font-medium leading-4">
        {entry.shortName}
      </span>
      {entry.underDev ? (
        <span aria-hidden className={cn("text-xs leading-4", TEXT_MUTED)}>
          In development
        </span>
      ) : null}
    </>
  );

  if (current) {
    return (
      <Link
        href={homeHref}
        aria-label={label}
        aria-current="page"
        title={entry.name}
        className={className}
        onClick={onNavigate}
      >
        {body}
      </Link>
    );
  }
  return (
    <a
      href={entry.url}
      aria-label={label}
      title={entry.name}
      className={className}
      onClick={onNavigate}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
    >
      {body}
    </a>
  );
}
