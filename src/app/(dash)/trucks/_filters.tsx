"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterBar, ToolbarGroup } from "@1ca/ui/components/toolbar";
import { GlassButton } from "@1ca/ui/glassyui/glass-button";
import { GlassInput } from "@1ca/ui/glassyui/glass-input";
import { CompanySelect } from "../_company-select";
import { useReportCompanies } from "../_report-filters";

function shift(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The day (?day=) and company (?company=) the Trucks page shows. */
export function TruckFilters({ day, today }: { day: string; today: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const companies = useReportCompanies();

  const go = (next: string) => {
    const qs = new URLSearchParams(params);
    if (next === today) qs.delete("day");
    else qs.set("day", next);
    const s = qs.toString();
    router.replace(s ? `${pathname}?${s}` : pathname);
  };

  return (
    <FilterBar label="Truck filters">
      <ToolbarGroup>
        <GlassButton
          variant="ghost"
          size="sm"
          className="size-9 p-0"
          aria-label="Previous day"
          onClick={() => go(shift(day, -1))}
        >
          <ChevronLeft aria-hidden className="size-4" />
        </GlassButton>
        <GlassInput
          type="date"
          aria-label="Day"
          className="ca-control-sm w-[10rem]"
          value={day}
          onChange={(e) => e.target.value && go(e.target.value)}
        />
        <GlassButton
          variant="ghost"
          size="sm"
          className="size-9 p-0"
          aria-label="Next day"
          onClick={() => go(shift(day, 1))}
        >
          <ChevronRight aria-hidden className="size-4" />
        </GlassButton>
        {day !== today && (
          <GlassButton variant="soft" size="sm" className="ca-control-sm" onClick={() => go(today)}>
            Today
          </GlassButton>
        )}
      </ToolbarGroup>
      <CompanySelect options={companies} />
    </FilterBar>
  );
}
