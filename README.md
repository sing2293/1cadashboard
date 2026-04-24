# ServiceMonster Unified Dashboard

Internal analytics dashboard that unifies data from three ServiceMonster accounts (1CleanAir, Home Depot partnership, Enviro Duct Cleaning) into a single Postgres database and web UI.

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind v4
- Prisma 7 with `@prisma/adapter-pg`
- Postgres via [Neon](https://neon.tech)
- Sync runs as a Vercel Cron → API route (no BullMQ/Redis)
- ServiceMonster API tokens stored as Vercel env vars

## Local setup

```bash
pnpm install
cp .env.example .env
# Fill in DATABASE_URL (Neon pooled URL) and SM_TOKEN_* in .env
pnpm exec prisma migrate dev
pnpm dev
```

Open http://localhost:3000.

## Scripts

- `pnpm dev` — Next.js dev server
- `pnpm build` — generate Prisma client + production build
- `pnpm db:migrate` — run/apply migrations in dev
- `pnpm db:studio` — open Prisma Studio
- `pnpm db:generate` — regenerate Prisma client

## Project layout

```
prisma/
  schema.prisma          # data model — see SERVICEMONSTER_DASHBOARD_SPEC.md §4
  migrations/
src/
  app/                   # Next.js routes
  lib/
    db.ts                # PrismaClient singleton (uses adapter-pg)
prisma.config.ts         # Prisma 7 config (DATABASE_URL lives here)
```

## Status

Milestone 1 (scaffolding) complete. Subsequent milestones per `SERVICEMONSTER_DASHBOARD_SPEC.md`.
