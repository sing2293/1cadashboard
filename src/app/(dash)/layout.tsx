import { listCompanies } from "@/lib/queries/company";
import { CompanySelect } from "./_company-select";
import { DateRangeSelect } from "./_date-range";
import { Sidebar } from "./_sidebar";

export default async function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const companies = await listCompanies();

  return (
    <div className="flex min-h-screen text-[var(--text)]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 backdrop-blur bg-[var(--bg)]/80 border-b border-[var(--border)]">
          <div className="px-4 md:px-6 py-3 pl-16 md:pl-6 flex items-center justify-end gap-2">
            <DateRangeSelect defaultValue="30d" />
            <CompanySelect options={companies} />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
