"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { href: "/", label: "Executive" },
  { href: "/operations", label: "Operations" },
  { href: "/sales", label: "Sales" },
  { href: "/service-mix", label: "Service Mix" },
  { href: "/admin/sync", label: "Sync" },
];

export function NavTabs() {
  const pathname = usePathname();
  const params = useSearchParams();
  const qs = params.toString() ? `?${params.toString()}` : "";

  return (
    <nav className="flex items-center gap-0.5 text-sm">
      {TABS.map((t) => {
        const active =
          t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={`${t.href}${qs}`}
            aria-current={active ? "page" : undefined}
            className={`px-3 py-1.5 rounded-md transition relative ${
              active
                ? "text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
