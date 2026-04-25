import { prisma } from "@/lib/db";

export type SyncStatusRow = {
  companyId: number;
  companySlug: string;
  companyName: string;
  resource: string;
  lastStatus: "success" | "running" | "error" | "never";
  lastFinishedAt: Date | null;
  lastUpserted: number;
  cursorAt: Date | null;
};

const RESOURCES = [
  "accounts",
  "employees",
  "leads",
  "orders",
  "appointments",
  "activities",
] as const;

export async function getSyncStatus(): Promise<SyncStatusRow[]> {
  const companies = await prisma.company.findMany({ orderBy: { id: "asc" } });

  const rows: SyncStatusRow[] = [];
  for (const c of companies) {
    for (const resource of RESOURCES) {
      const [latestRun, state] = await Promise.all([
        prisma.syncRun.findFirst({
          where: { companyId: c.id, resource },
          orderBy: { id: "desc" },
        }),
        prisma.syncState.findUnique({
          where: { companyId_resource: { companyId: c.id, resource } },
        }),
      ]);
      rows.push({
        companyId: c.id,
        companySlug: c.slug,
        companyName: c.name,
        resource,
        lastStatus: (latestRun?.status as SyncStatusRow["lastStatus"]) ?? "never",
        lastFinishedAt: latestRun?.finishedAt ?? null,
        lastUpserted: latestRun?.recordsUpserted ?? 0,
        cursorAt: state?.lastCursor ?? null,
      });
    }
  }
  return rows;
}

export type RecentRun = {
  id: number;
  companySlug: string;
  resource: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  recordsUpserted: number;
  errorMessage: string | null;
};

export async function getRecentRuns(limit = 25): Promise<RecentRun[]> {
  const runs = await prisma.syncRun.findMany({
    orderBy: { id: "desc" },
    take: limit,
    include: { company: true },
  });
  return runs.map((r) => ({
    id: r.id,
    companySlug: r.company.slug,
    resource: r.resource,
    status: r.status,
    startedAt: r.startedAt,
    finishedAt: r.finishedAt,
    recordsUpserted: r.recordsUpserted,
    errorMessage: r.errorMessage,
  }));
}
