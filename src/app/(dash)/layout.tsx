import { listCompanies } from "@/lib/queries/company";
import { ReportFiltersProvider } from "./_report-filters";
import { Shell } from "./shell";

export default async function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const companies = await listCompanies();

  return (
    <Shell>
      {/* The report pages show the date-range and company filters in their header (ReportHeader). */}
      <ReportFiltersProvider companies={companies}>{children}</ReportFiltersProvider>
    </Shell>
  );
}
