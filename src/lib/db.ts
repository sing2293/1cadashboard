import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Lazy-init the client. Vercel's build step imports every route module to
// extract metadata; if `DATABASE_URL` isn't set yet at that point, we mustn't
// throw — defer the error until something actually queries.
const globalForPrisma = globalThis as unknown as {
  _prisma?: PrismaClient;
};

function build(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Configure it in Vercel project env vars.",
    );
  }
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const client = new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== "production") globalForPrisma._prisma = client;
  return client;
}

function get(): PrismaClient {
  return globalForPrisma._prisma ?? build();
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = get() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : Reflect.get(client, prop, receiver);
  },
});
