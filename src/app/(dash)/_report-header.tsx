import { Building2 } from "lucide-react";
import { Card } from "@1ca/ui/components/card";
import { EmptyState } from "@1ca/ui/components/empty-state";
import { Page } from "@1ca/ui/components/page";
import { PageHeader, type PageHeaderProps } from "@1ca/ui/components/page-header";
import { cn } from "@1ca/ui/lib/utils";
import { ReportFilters } from "./_report-filters";

export type ReportHeaderProps = Omit<PageHeaderProps, "sticky" | "children">;

/**
 * The top of every report page (/, /operations, /sales, /service-mix) and of
 * their no-company states: the PageHeader with the date-range and company
 * filters under the title.
 *
 * From 768px (md) it stays pinned under the top bar on its frosted band. On
 * phones it scrolls away with the page, like the filter rows in the other
 * apps: title, description and filters together are about 200px, a third of
 * a 360px screen. The filters and their query params are the same either way.
 */
export function ReportHeader({ className, ...props }: ReportHeaderProps) {
  return (
    <PageHeader {...props} sticky className={cn("max-md:static", className)}>
      <ReportFilters />
    </PageHeader>
  );
}

/**
 * A report page when no company resolves (none seeded yet). The header and
 * its filters stay, so another company can still be picked.
 */
export function NoCompanyPage({
  icon,
  title,
}: Pick<ReportHeaderProps, "icon" | "title">) {
  return (
    <Page>
      <ReportHeader icon={icon} title={title} />
      <Card>
        <EmptyState
          titleAs="h2"
          icon={Building2}
          title="No company seeded."
          description="Once a company is set up and synced, its numbers appear here."
        />
      </Card>
    </Page>
  );
}
