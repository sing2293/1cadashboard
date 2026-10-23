"use client";

import { Building2 } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  GlassSelect,
  GlassSelectContent,
  GlassSelectItem,
  GlassSelectSeparator,
  GlassSelectTrigger,
  GlassSelectValue,
} from "@1ca/ui/glassyui/glass-select";

type Option = { slug: string; name: string };

export function CompanySelect({ options }: { options: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const company = params.get("company") ?? "all";
  // A company the list doesn't hold shows the placeholder rather than a blank trigger.
  const current =
    company === "all" || options.some((o) => o.slug === company) ? company : "";

  return (
    <GlassSelect
      value={current}
      onValueChange={(value) => {
        const next = new URLSearchParams(params);
        if (value === "all") {
          next.delete("company");
        } else {
          next.set("company", value);
        }
        const qs = next.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      }}
    >
      <GlassSelectTrigger
        aria-label="Company"
        className="ca-control-sm w-full sm:w-[13.5rem]"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Building2
            aria-hidden
            className="hidden size-4 shrink-0 text-ca-muted sm:block"
          />
          <span className="truncate">
            <GlassSelectValue placeholder="Choose a company" />
          </span>
        </span>
      </GlassSelectTrigger>
      <GlassSelectContent>
        <GlassSelectItem value="all">All companies</GlassSelectItem>
        {options.length > 0 ? <GlassSelectSeparator /> : null}
        {options.map((o) => (
          <GlassSelectItem key={o.slug} value={o.slug}>
            {o.name}
          </GlassSelectItem>
        ))}
      </GlassSelectContent>
    </GlassSelect>
  );
}
