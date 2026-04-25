import Link from "next/link";
import { listCompanies } from "@/lib/queries/company";
import { CompanySelect } from "./_company-select";
import { DateRangeSelect } from "./_date-range";
import { NavTabs } from "./_nav-tabs";

export default async function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const companies = await listCompanies();

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/75 dark:supports-[backdrop-filter]:bg-zinc-900/75 border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50 whitespace-nowrap"
          >
            <span className="inline-flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold shadow-sm">
              SM
            </span>
            <span className="hidden sm:inline">ServiceMonster Dashboard</span>
          </Link>
          <NavTabs />
          <div className="flex items-center gap-2">
            <DateRangeSelect defaultValue="30d" />
            <CompanySelect options={companies} />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
