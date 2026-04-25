import "dotenv/config";
import { defineConfig } from "prisma/config";

// Don't use prisma's `env()` helper here — it throws if the var is missing,
// which breaks `prisma generate` during Vercel postinstall before the build
// has a chance to read project env vars. `prisma generate` doesn't actually
// need a real URL; only `migrate` / `studio` do, and those run from a shell
// where DATABASE_URL is already set.
const PLACEHOLDER = "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? PLACEHOLDER,
  },
});
