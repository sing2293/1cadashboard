# ServiceMonster Unified Dashboard

Internal analytics dashboard that unifies data from three ServiceMonster accounts (1CleanAir, Home Depot partnership, Enviro Duct Cleaning) into a single Postgres database and web UI.

## Stack

- Next.js 16 (App Router, RSC) + React 19 + Tailwind v4
- Prisma 7 with `@prisma/adapter-pg`
- Postgres via [Neon](https://neon.tech)
- Sync runs as a Vercel Cron → API route (no BullMQ/Redis)
- ServiceMonster API credentials stored as Vercel env vars

## Local setup

```bash
pnpm install
cp .env.example .env
# Fill in DATABASE_URL (Neon pooled URL) and SM_USER_*/SM_PASS_* in .env
pnpm exec prisma migrate dev
pnpm db:seed              # seed the 3 companies metadata
pnpm db:seed-services     # seed the canonical service catalog
pnpm dev
```

Open http://localhost:3000.

## Initial backfill

After fresh setup, backfill 24 months of every resource for every company:

```bash
for slug in 1cleanair homedepot enviroduct; do
  for resource in employees leads accounts orders appointments activities; do
    pnpm sync --slug=$slug --resource=$resource --backfillMonths=24
  done
  pnpm sync:items --slug=$slug
done
pnpm normalize
```

Subsequent runs are incremental (cursor-tracked); the Vercel cron handles them.

## Scripts

- `pnpm dev` — Next.js dev server
- `pnpm build` — generate Prisma client + production build
- `pnpm sync --slug=<slug> --resource=<r>` — incremental sync
- `pnpm sync:items --slug=<slug>` — fetch line items for invoices that don't have them
- `pnpm normalize` — map raw line-item names to the service catalog
- `pnpm db:migrate` — run/apply migrations in dev
- `pnpm db:seed` / `pnpm db:seed-services` — seed companies / services
- `pnpm db:studio` — open Prisma Studio

## Project layout

```
prisma/
  schema.prisma             # data model
  seed.ts                   # company metadata seed
  seed-services.ts          # service catalog + aliases
  migrations/
src/
  app/
    (dash)/                 # dashboard route group with shared nav layout
      page.tsx              # /  → Executive
      operations/
      sales/
      service-mix/
      admin/sync/
    api/
      admin/sync            # POST trigger for one resource sync
      cron/sync-all         # GET — Vercel cron hits this every 15 min
  lib/
    db.ts                   # Prisma singleton
    sm/
      client.ts             # SM REST client (Basic auth, retry, paginate)
      time.ts               # tz-naive timestamp parse/format
    sync/
      runner.ts             # generic incremental sync driver
      order-items.ts        # invoice line-item backfill (N+1 fetch)
      normalize.ts          # raw name → ServiceCatalog resolver
      resources/            # per-resource syncers
    queries/                # one module per dashboard
scripts/
  run-sync.ts
  run-order-items.ts
  run-normalize.ts
```

## Deploy to Vercel

1. **Push the repo to GitHub** (or use `vercel deploy --prebuilt`).
2. **Connect the repo** at https://vercel.com/new.
3. **Set environment variables** in Project Settings → Environment Variables:
   - `DATABASE_URL` — same Neon pooled URL
   - `SM_USER_1CLEANAIR`, `SM_PASS_1CLEANAIR`
   - `SM_USER_HOMEDEPOT`, `SM_PASS_HOMEDEPOT`
   - `SM_USER_ENVIRODUCT`, `SM_PASS_ENVIRODUCT`
   - `CRON_SECRET` — random string; Vercel auto-attaches it as `Authorization: Bearer …` on cron requests.
4. **Deploy**. The first deploy will run `prisma generate && next build`.
5. **Verify the cron** in the Vercel dashboard → Settings → Cron Jobs. The schedule in `vercel.json` is `*/15 * * * *`. (Hobby tier is daily-only — upgrade to Pro for 15-min cadence, or change the schedule string.)
6. **Run the initial backfill once** by hitting `/api/admin/sync` for each company × resource (or run locally and let the cron pick up incrementals on prod).

### Locking down access

The app has no built-in auth. For internal use, enable **Vercel Deployment Protection**:

- Project Settings → Deployment Protection → choose **Vercel Authentication** (locks to your team) or **Password Protection** (one shared password).

This protects every route including the cron — Vercel automatically allows authenticated cron requests through.

## Notes & known limitations

- The SM API caps `limit` at 100 regardless of what we request.
- The SM API ignores `page` / `offset`; pagination is by ordered cursor (`orderBy=timeStamp&wOperator=gt`).
- `wOperator=gte` returns 0 rows even when matching data exists — use `gt`.
- SM timestamps are TZ-naive; `src/lib/sm/time.ts` handles parse/format symmetrically.
- `/notes` (activities) returns one row per `(activityID, orderID)` pair — we collapse to one row per activity ID, losing the multi-order linkage.
- Payments aren't a separate endpoint; we compute `amountPaid = grandTotal - balanceDue`.
- Order line items live at `/orders/{id}/lineItems` — N+1 fetch, only run for invoices, separate `pnpm sync:items` script.
