import {
  Briefcase,
  ChartLine,
  FileText,
  Tag,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@1ca/ui/components/card";
import { MiniBar } from "@1ca/ui/components/charts";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@1ca/ui/components/data-table";
import { Page } from "@1ca/ui/components/page";
import { Section } from "@1ca/ui/components/section";
import { StatCard } from "@1ca/ui/components/stat-card";
import { resolveCompany } from "@/lib/queries/company";
import { parseRange } from "@/lib/queries/range";
import { getLeadSources, getSalesKpis } from "@/lib/queries/sales";
import { enterDelay, fmtInt, fmtMoney } from "../_components";
import { NoCompanyPage, ReportHeader } from "../_report-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sales" };

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; range?: string }>;
}) {
  const sp = await searchParams;
  const company = await resolveCompany(sp.company);
  if (!company) return <NoCompanyPage icon={ChartLine} title="Sales" />;

  const range = parseRange(sp.range);
  const [kpis, sources] = await Promise.all([
    getSalesKpis(company.id, range),
    getLeadSources(company.id, range.days),
  ]);

  const topCount = Math.max(1, ...sources.map((row) => row.count));

  return (
    <Page>
      <ReportHeader
        icon={ChartLine}
        eyebrow={company.name}
        title="Sales"
        description={`Pipeline + new accounts · ${range.label.toLowerCase()}`}
      />

      <Section title="Overview">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            className="ca-enter"
            style={enterDelay(0)}
            label="New leads"
            value={fmtInt(kpis.newLeads)}
            icon={Users}
          />
          <StatCard
            className="ca-enter"
            style={enterDelay(1)}
            label="New prospects"
            value={fmtInt(kpis.newProspects)}
            icon={Target}
          />
          <StatCard
            className="ca-enter"
            style={enterDelay(2)}
            label="New customers"
            value={fmtInt(kpis.newCustomers)}
            icon={UserPlus}
          />
          <StatCard
            className="ca-enter"
            style={enterDelay(3)}
            label="Estimates issued"
            value={fmtInt(kpis.estimateCount)}
            icon={FileText}
          />
          <StatCard
            className="ca-enter"
            style={enterDelay(4)}
            label="Pipeline value"
            value={fmtMoney(kpis.estimateValueOutstanding)}
            hint="Outstanding estimates"
            icon={Briefcase}
          />
        </div>
      </Section>

      <Card variant="solid" className="overflow-hidden pb-0">
        <CardHeader>
          <CardTitle as="h2">New accounts by lead source</CardTitle>
          <CardDescription>{range.label}</CardDescription>
        </CardHeader>
        <CardContent flush>
          <Table
            surface="none"
            label="New accounts by lead source"
            className="min-w-[30rem]"
          >
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead numeric>New accounts</TableHead>
                <TableHead numeric>Lifetime invoice revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.length === 0 ? (
                <TableEmpty
                  colSpan={3}
                  icon={Tag}
                  title="No new accounts in this range."
                />
              ) : (
                sources.map((row) => (
                  <TableRow key={row.source}>
                    <TableCell className="font-medium">{row.source}</TableCell>
                    <TableCell numeric>
                      <span className="inline-flex items-center gap-3">
                        <MiniBar
                          value={row.count / topCount}
                          className="hidden sm:inline-block"
                        />
                        <span className="min-w-8">{fmtInt(row.count)}</span>
                      </span>
                    </TableCell>
                    <TableCell numeric className="font-medium">
                      {fmtMoney(row.revenue)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Page>
  );
}
