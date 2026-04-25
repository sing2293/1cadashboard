import type { PrismaClient } from "@prisma/client";
import { SmClient } from "@/lib/sm/client";

export type SyncRunResult = {
  syncRunId: number;
  recordsSeen: number;
  recordsUpserted: number;
  newCursor: Date;
  durationMs: number;
};

export interface ResourceSyncer<TRaw> {
  resource: string;
  /** Iterate pages of raw rows. Owns its own pagination strategy. */
  fetchPages: (sm: SmClient, fromCursor: Date) => AsyncGenerator<TRaw[], void, void>;
  /** Extract a Date for SyncState cursor advancement; null if this resource has no time field. */
  extractCursor: (raw: TRaw) => Date | null;
  /** Stable per-row identifier (the SM record ID), used for cross-page de-dup. */
  extractId: (raw: TRaw) => string;
  /** Persist a page of raw rows. Returns number of rows upserted. */
  persist: (rows: TRaw[], companyId: number, prisma: PrismaClient) => Promise<number>;
  /**
   * If true, every run ignores the stored SyncState cursor and pulls everything
   * from `initialCursorIfEmpty`. Use for tiny resources that lack a modified
   * timestamp (e.g. employees).
   */
  fullSync?: boolean;
}

export type SyncOptions = {
  /** Cursor to use when SyncState has no row yet (first run for this resource+company). */
  initialCursorIfEmpty: Date;
};

/**
 * Incremental sync driver. Advances SyncState.lastCursor only on full success;
 * on error, records the run but leaves the cursor so the next run retries.
 */
export async function runIncrementalSync<TRaw>(
  prisma: PrismaClient,
  company: { id: number; slug: string },
  syncer: ResourceSyncer<TRaw>,
  options: SyncOptions,
): Promise<SyncRunResult> {
  const startedAt = Date.now();

  const state = await prisma.syncState.findUnique({
    where: { companyId_resource: { companyId: company.id, resource: syncer.resource } },
  });
  const cursor = syncer.fullSync
    ? options.initialCursorIfEmpty
    : (state?.lastCursor ?? options.initialCursorIfEmpty);

  const run = await prisma.syncRun.create({
    data: {
      companyId: company.id,
      resource: syncer.resource,
      status: "running",
    },
  });

  let recordsSeen = 0;
  let recordsUpserted = 0;
  let newCursor = cursor;

  try {
    const sm = SmClient.fromEnv(company.slug);
    const iterator = syncer.fetchPages(sm, cursor);

    const seen = new Set<string>();
    let pageNum = 0;
    for await (const page of iterator) {
      pageNum += 1;
      const pageStart = Date.now();
      recordsSeen += page.length;

      const fresh = page.filter((row) => {
        const id = syncer.extractId(row);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      if (fresh.length > 0) {
        recordsUpserted += await syncer.persist(fresh, company.id, prisma);
      }
      for (const row of page) {
        const ts = syncer.extractCursor(row);
        if (ts && ts > newCursor) newCursor = ts;
      }
      console.log(
        `[sync ${syncer.resource}/${company.slug}] page ${pageNum}: ${fresh.length}/${page.length} new rows in ${Date.now() - pageStart}ms (total seen: ${recordsSeen}, persisted: ${recordsUpserted})`,
      );
    }

    await prisma.$transaction([
      prisma.syncState.upsert({
        where: {
          companyId_resource: { companyId: company.id, resource: syncer.resource },
        },
        create: {
          companyId: company.id,
          resource: syncer.resource,
          lastCursor: newCursor,
        },
        update: { lastCursor: newCursor },
      }),
      prisma.syncRun.update({
        where: { id: run.id },
        data: {
          status: "success",
          finishedAt: new Date(),
          recordsSeen,
          recordsUpserted,
        },
      }),
    ]);

    return {
      syncRunId: run.id,
      recordsSeen,
      recordsUpserted,
      newCursor,
      durationMs: Date.now() - startedAt,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: "error",
        finishedAt: new Date(),
        recordsSeen,
        recordsUpserted,
        errorMessage: message.slice(0, 2000),
      },
    });
    throw err;
  }
}
