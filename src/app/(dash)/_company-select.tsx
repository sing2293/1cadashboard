"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Option = { slug: string; name: string };

export function CompanySelect({
  options,
  defaultSlug,
}: {
  options: Option[];
  defaultSlug: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("company") ?? defaultSlug;

  return (
    <select
      value={current}
      onChange={(e) => {
        const next = new URLSearchParams(params);
        next.set("company", e.target.value);
        router.replace(`${pathname}?${next.toString()}`);
      }}
      className="rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm px-2 py-1 text-zinc-900 dark:text-zinc-50"
    >
      {options.map((o) => (
        <option key={o.slug} value={o.slug}>
          {o.name}
        </option>
      ))}
    </select>
  );
}
