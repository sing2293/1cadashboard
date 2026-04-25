import type { Prisma } from "@prisma/client";
import type { ResourceSyncer } from "../runner";
import { parseSmTimestamp } from "@/lib/sm/time";

type RawAccount = {
  accountID: string;
  accountName?: string;
  accountType?: string;
  email?: string;
  phone1?: string;
  leadSourceID?: string;
  balance?: number | string;
  dateCreated?: string;
  timeStamp?: string;
  [k: string]: unknown;
};

export const accountsSyncer: ResourceSyncer<RawAccount> = {
  resource: "accounts",
  endpoint: "accounts",
  cursorField: "timeStamp",

  extractCursor: (raw) => parseSmTimestamp(raw.timeStamp),

  extractId: (raw) => raw.accountID,

  persist: async (rows, companyId, prisma) => {
    const CONCURRENCY = 20;
    let count = 0;

    for (let i = 0; i < rows.length; i += CONCURRENCY) {
      const chunk = rows.slice(i, i + CONCURRENCY);
      await Promise.all(
        chunk.map((raw) => {
          const data: Prisma.AccountUncheckedCreateInput = {
            companyId,
            smId: raw.accountID,
            accountName: raw.accountName ?? null,
            accountType: raw.accountType ?? null,
            email: raw.email ?? null,
            phone: raw.phone1 ?? null,
            leadSource: raw.leadSourceID ?? null,
            balance:
              typeof raw.balance === "number"
                ? raw.balance
                : raw.balance
                  ? Number(raw.balance)
                  : null,
            smCreatedAt: parseSmTimestamp(raw.dateCreated),
            smModifiedAt: parseSmTimestamp(raw.timeStamp),
            smPayload: raw as unknown as Prisma.InputJsonValue,
            syncedAt: new Date(),
          };
          return prisma.account.upsert({
            where: { companyId_smId: { companyId, smId: raw.accountID } },
            create: data,
            update: {
              accountName: data.accountName,
              accountType: data.accountType,
              email: data.email,
              phone: data.phone,
              leadSource: data.leadSource,
              balance: data.balance,
              smCreatedAt: data.smCreatedAt,
              smModifiedAt: data.smModifiedAt,
              smPayload: data.smPayload,
              syncedAt: data.syncedAt,
            },
          });
        }),
      );
      count += chunk.length;
    }
    return count;
  },
};

export type { RawAccount };
