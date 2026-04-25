"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PRESETS } from "@/lib/queries/range";

export function DateRangeSelect({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("range") ?? defaultValue;

  return (
    <select
      value={current}
      onChange={(e) => {
        const next = new URLSearchParams(params);
        next.set("range", e.target.value);
        router.replace(`${pathname}?${next.toString()}`);
      }}
      className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm pl-3 pr-8 py-1.5 text-zinc-900 dark:text-zinc-50 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1rem_1rem] bg-[image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')]"
    >
      {PRESETS.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
    </select>
  );
}
