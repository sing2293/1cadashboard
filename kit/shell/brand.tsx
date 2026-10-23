import { Wind } from "lucide-react";
import { accentGradient, HUB_APP, type AppEntry } from "../config/apps";
import { cn } from "../lib/utils";

export type AppTileSize = "xs" | "sm" | "md" | "lg";

const TILE: Record<AppTileSize, string> = {
  xs: "size-5 rounded-[6px]",
  sm: "size-7 rounded-[9px]",
  md: "size-9 rounded-[11px]",
  lg: "size-14 rounded-[17px]",
};

const GLYPH: Record<AppTileSize, string> = {
  xs: "size-3",
  sm: "size-4",
  md: "size-[18px]",
  lg: "size-7",
};

// A lit top edge and a hairline rim, like the glass controls around it.
const TILE_FINISH =
  "shadow-[inset_0_1px_0_rgb(255_255_255/0.35),inset_0_0_0_1px_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.2)]";

/** An app's icon on its accent gradient. Decorative: put the app's name next to it. */
export function AppTile({
  app,
  size = "sm",
  className,
}: {
  app: Pick<AppEntry, "icon" | "accent">;
  size?: AppTileSize;
  className?: string;
}) {
  const Icon = app.icon;
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid shrink-0 place-items-center text-white",
        TILE_FINISH,
        TILE[size],
        className,
      )}
      style={{ backgroundImage: accentGradient(app) }}
    >
      <Icon className={GLYPH[size]} strokeWidth={2.1} />
    </span>
  );
}

/** The 1CleanAir mark: a breath of air on the hub's sky-to-mint gradient. Decorative. */
export function BrandMark({ size = "sm", className }: { size?: AppTileSize; className?: string }) {
  return <AppTile app={{ icon: Wind, accent: HUB_APP.accent }} size={size} className={className} />;
}
