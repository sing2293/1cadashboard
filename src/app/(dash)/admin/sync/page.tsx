import {
  Activity,
  Building2,
  CircleCheck,
  Database,
  History,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import type { Metadata } from "next";
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
import { PageHeader } from "@1ca/ui/components/page-header";
import { Section } from "@1ca/ui/components/section";
import { StatCard } from "@1ca/ui/components/stat-card";
import { StatusPill, type StatusTone } from "@1ca/ui/components/status-pill";
import { formatDateTime, TIME_ZONE_LABEL } from "@1ca/ui/lib/format";
import { getRecentRuns, getSyncStatus } from "@/lib/queries/admin";
import { enterDelay, fmtInt } from "../../_components";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sync status" };

// A run's status as people say it, with a matching tone. A running sync pulses.
const STATUS: Record<string, { label: string; tone: StatusTone }> = {
  success: { label: "Succeeded", tone: "success" },
  running: { label: "Running", tone: "info" },
  error: { label: "Failed", tone: "danger" },
  never: { label: "Never run", tone: "neutral" },
};

function SyncStatus({ status }: { status: string }) {
  const known = STATUS[status];
  return (
    <StatusPill tone={known?.tone ?? "neutral"} pulse={status === "running"}>
      {known?.label ?? status.charAt(0).toUpperCase() + status.slice(1)}
    </StatusPill>
  );
}

/** Toronto time on the page; the exact UTC instant in the tooltip. */
function Timestamp({ value }: { value: Date | null }) {
  if (!value) return <>—</>;
  const utc = `${value.toISOString().replace("T", " ").slice(0, 19)} UTC`;
  return (
    <time dateTime={value.toISOString()} title={utc}>
      {formatDateTime(value)}
    </time>
  );
}

const TIME_CELL = "whitespace-nowrap tabular-nums";

export default async function SyncStatusPage() {
  const [status, runs] = await Promise.all([getSyncStatus(), getRecentRuns(50)]);

  const grouped = new Map<string, typeof status>();
  for (const r of status) {
    const key = r.companySlug;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  // At-a-glance counts of each resource's latest run.
  const count = (s: (typeof status)[number]["lastStatus"]) =>
    status.filter((r) => r.lastStatus === s).length;
  const failed = count("error");

  return (
    <Page>
      <PageHeader
        icon={RefreshCw}
        eyebrow="Admin"
        title="Sync status"
        description={`Latest run + cursor per company × resource · ${TIME_ZONE_LABEL}`}
      />

      <Section title="Overview" description="Each resource's latest run">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            className="ca-enter"
            style={enterDelay(0)}
            label="Resources tracked"
            value={fmtInt(status.length)}
            hint={`${fmtInt(grouped.size)} ${grouped.size === 1 ? "company" : "companies"}`}
            icon={Database}
          />
          <StatCard
            className="ca-enter"
            style={enterDelay(1)}
            label="Last run succeeded"
            value={fmtInt(count("success"))}
            icon={CircleCheck}
          />
          <StatCard
            className="ca-enter"
            style={enterDelay(2)}
            label="Running now"
            value={fmtInt(count("running"))}
            icon={Activity}
          />
          <StatCard
            className="ca-enter"
            style={enterDelay(3)}
            label="Last run failed"
            value={fmtInt(failed)}
            tone={failed > 0 ? "danger" : undefined}
            hint={
              count("never") > 0 ? `${fmtInt(count("never"))} never synced` : undefined
            }
            icon={TriangleAlert}
          />
        </div>
      </Section>

      {Array.from(grouped.entries()).map(([slug, rows]) => (
        <Section
          key={slug}
          icon={Building2}
          title={`${rows[0].companyName} (${slug})`}
        >
          <Table label={`Sync status, ${rows[0].companyName}`} className="min-w-[40rem]">
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last finished</TableHead>
                <TableHead numeric>Records</TableHead>
                <TableHead>Cursor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={`${r.companyId}-${r.resource}`}>
                  <TableCell className="font-medium">{r.resource}</TableCell>
                  <TableCell>
                    <SyncStatus status={r.lastStatus} />
                  </TableCell>
                  <TableCell muted className={TIME_CELL}>
                    <Timestamp value={r.lastFinishedAt} />
                  </TableCell>
                  <TableCell numeric>{fmtInt(r.lastUpserted)}</TableCell>
                  <TableCell muted className={TIME_CELL}>
                    <Timestamp value={r.cursorAt} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      ))}

      <Section icon={History} title="Recent runs" description="Last 50">
        <Table
          density="compact"
          stickyHeader
          maxHeight="36rem"
          label="Recent runs"
          className="min-w-[48rem]"
        >
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Finished</TableHead>
              <TableHead numeric>Records</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.length === 0 ? (
              <TableEmpty colSpan={7} icon={History} title="No runs yet." />
            ) : null}
            {runs.map((r) => (
              <TableRow key={r.id}>
                <TableCell muted className={TIME_CELL}>
                  {r.id}
                </TableCell>
                <TableCell>{r.companySlug}</TableCell>
                <TableCell>{r.resource}</TableCell>
                <TableCell>
                  <SyncStatus status={r.status} />
                </TableCell>
                <TableCell muted className={TIME_CELL}>
                  <Timestamp value={r.startedAt} />
                </TableCell>
                <TableCell muted className={TIME_CELL}>
                  <Timestamp value={r.finishedAt} />
                </TableCell>
                <TableCell numeric>{fmtInt(r.recordsUpserted)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>
    </Page>
  );
}
