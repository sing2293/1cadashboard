import { HandCoins, Link2Off, UserRoundX, Users } from "lucide-react";
import type { Metadata } from "next";
import { Page } from "@1ca/ui/components/page";
import { PageHeader } from "@1ca/ui/components/page-header";
import { Section } from "@1ca/ui/components/section";
import { StatCard } from "@1ca/ui/components/stat-card";
import { GlassAlert } from "@1ca/ui/glassyui/glass-alert";
import { formatRelative } from "@1ca/ui/lib/format";
import { prisma } from "@/lib/db";
import { addDays, dayToDate, torontoToday } from "@/lib/punches";
import { fmtInt } from "../_components";
import { RefreshButton, TechPayTable, type TechPayRow } from "./_table";

export const dynamic = "force-dynamic";
// The refresh action backfills up to 120 days of Mobile Punches shifts.
export const maxDuration = 120;

export const metadata: Metadata = { title: "Tech pay" };

export default async function TechPayPage() {
  const today = torontoToday();
  const weekStart = dayToDate(addDays(today, -6));

  const [techs, employees, weekHours, lastSync] = await Promise.all([
    // Techs on a ServiceMonster job or HVAC appointment in the last 120 days.
    prisma.tech.findMany({
      where: { lastSeenOn: { gte: dayToDate(addDays(today, -120)) } },
      include: { rates: { orderBy: { effectiveFrom: "desc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.punchEmployee.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, tech: { select: { id: true, name: true } } },
    }),
    prisma.punchShift.groupBy({
      by: ["punchesEmployeeId"],
      where: { date: { gte: weekStart } },
      _sum: { workedHours: true },
    }),
    prisma.punchShift.aggregate({ _max: { syncedAt: true } }),
  ]);

  const hoursBy = new Map(weekHours.map((h) => [h.punchesEmployeeId, Number(h._sum.workedHours ?? 0)]));
  const rows: TechPayRow[] = techs.map((t) => ({
    id: t.id,
    name: t.name,
    punchesEmployeeId: t.punchesEmployeeId,
    linkedBy: t.punchesLinkedBy,
    weekHours: t.punchesEmployeeId ? (hoursBy.get(t.punchesEmployeeId) ?? 0) : null,
    rates: t.rates.map((r) => ({ hourlyRate: Number(r.hourlyRate), effectiveFrom: r.effectiveFrom.toISOString().slice(0, 10) })),
  }));
  const options = employees.map((e) => ({ id: e.id, name: e.name, linkedTo: e.tech ? { id: e.tech.id, name: e.tech.name } : null }));

  const noRate = rows.filter((r) => r.rates.length === 0).length;
  const unlinked = rows.filter((r) => !r.punchesEmployeeId).length;
  const synced = lastSync._max.syncedAt;

  return (
    <Page>
      <PageHeader
        icon={HandCoins}
        title="Tech pay"
        description="Each tech’s hourly rate, and the Mobile Punches employee whose hours count as theirs. The Trucks page pays each tech their punched hours at the rate in force that day."
        actions={<RefreshButton />}
      />

      {!process.env.PUNCHES_KEY && (
        <GlassAlert tone="warning" title="Mobile Punches isn’t connected">
          Set <code className="ca-code">PUNCHES_KEY</code> to a key from Mobile Punches&rsquo; API keys page, so tech hours can
          come in.
        </GlassAlert>
      )}

      <Section
        title="Techs"
        description={
          synced
            ? `Everyone on a ServiceMonster job or HVAC appointment in the last 120 days. Hours last came in from Mobile Punches ${formatRelative(synced)}.`
            : "Everyone on a ServiceMonster job or HVAC appointment in the last 120 days. No hours have come in from Mobile Punches yet."
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Techs" value={fmtInt(rows.length)} icon={Users} />
          <StatCard
            label="Without a pay rate"
            value={fmtInt(noRate)}
            icon={UserRoundX}
            tone={noRate > 0 ? "warning" : "neutral"}
            hint={noRate > 0 ? "Their pay counts as $0" : "Every tech has a rate"}
          />
          <StatCard
            label="Not linked to Mobile Punches"
            value={fmtInt(unlinked)}
            icon={Link2Off}
            tone={unlinked > 0 ? "warning" : "neutral"}
            hint={unlinked > 0 ? "Their hours can’t be counted" : "Every tech is linked"}
          />
        </div>
      </Section>

      <TechPayTable rows={rows} employees={options} today={today} />
    </Page>
  );
}
