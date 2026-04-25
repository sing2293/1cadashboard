import Link from "next/link";
import { listCompanies } from "@/lib/queries/company";
import { CompanySelect } from "./_company-select";

const TABS = [
  { href: "/", label: "Executive" },
  { href: "/operations", label: "Operations" },
  { href: "/sales", label: "Sales" },
  { href: "/service-mix", label: "Service Mix" },
  { href: "/admin/sync", label: "Sync status" },
];

export default async function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const companies = await listCompanies();
  const fallback = companies[0]?.slug ?? "1cleanair";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 whitespace-nowrap"
          >
            ServiceMonster Dashboard
          </Link>
          <nav className="flex items-center gap-1 text-sm flex-1 ml-6">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="px-3 py-1.5 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50"
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <CompanySelect options={companies} defaultSlug={fallback} />
        </div>
      </header>
      {children}
    </div>
  );
}
