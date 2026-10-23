"use client";

import { CalendarRange } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  GlassSelect,
  GlassSelectContent,
  GlassSelectItem,
  GlassSelectTrigger,
  GlassSelectValue,
} from "@1ca/ui/glassyui/glass-select";
import { PRESETS } from "@/lib/queries/range";

export function DateRangeSelect({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const range = params.get("range");
  // An unknown ?range= shows the default the server falls back to, not a blank trigger.
  const current =
    range !== null && PRESETS.some((p) => p.value === range) ? range : defaultValue;

  return (
    <GlassSelect
      value={current}
      onValueChange={(value) => {
        const next = new URLSearchParams(params);
        next.set("range", value);
        router.replace(`${pathname}?${next.toString()}`);
      }}
    >
      <GlassSelectTrigger
        aria-label="Date range"
        className="ca-control-sm w-full sm:w-[12.5rem]"
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarRange
            aria-hidden
            className="hidden size-4 shrink-0 text-ca-muted sm:block"
          />
          <span className="truncate">
            <GlassSelectValue />
          </span>
        </span>
      </GlassSelectTrigger>
      <GlassSelectContent>
        {PRESETS.map((p) => (
          <GlassSelectItem key={p.value} value={p.value}>
            {p.label}
          </GlassSelectItem>
        ))}
      </GlassSelectContent>
    </GlassSelect>
  );
}
