"use client";

import { createContext, useContext, type ReactNode } from "react";
import { FilterBar, ToolbarGroup, ToolbarSpacer } from "@1ca/ui/components/toolbar";
import { CompanySelect } from "./_company-select";
import { DateRangeSelect } from "./_date-range";

type CompanyOption = { slug: string; name: string };

const CompaniesContext = createContext<CompanyOption[]>([]);

/**
 * Hands the (dash) layout's company list (its one listCompanies() call per
 * request) to the report filters, which each report page renders in its
 * header (ReportHeader, _report-header.tsx).
 */
export function ReportFiltersProvider({
  companies,
  children,
}: {
  companies: CompanyOption[];
  children: ReactNode;
}) {
  return <CompaniesContext value={companies}>{children}</CompaniesContext>;
}

/**
 * The date-range and company filters for the report pages (/, /operations,
 * /sales, /service-mix). Both write the URL (?range=, ?company=), which the
 * server pages read; the shell carries the query string between pages.
 */
export function ReportFilters() {
  const companies = useContext(CompaniesContext);

  return (
    <FilterBar label="Report filters">
      <ToolbarGroup className="grid w-full grid-cols-2 sm:flex sm:w-auto">
        <DateRangeSelect defaultValue="30d" />
        <CompanySelect options={companies} />
      </ToolbarGroup>
      <ToolbarSpacer />
      <p className="hidden text-xs text-ca-muted lg:block">
        ServiceMonster data · amounts in CAD
      </p>
    </FilterBar>
  );
}
