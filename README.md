# Sales Dashboard (ServiceMonster + ServiceTitan)

Internal analytics dashboard that unifies data from three ServiceMonster accounts (1CleanAir, Home Depot partnership, Enviro Duct Cleaning) and the HVAC division's ServiceTitan tenant into a single Postgres database and web UI. It lives at `sales.1cleanair.info` and is listed in the 1CleanAir Hub as "Sales Dashboard".

## Stack

- Next.js 16 (App Router, RSC) + React 19 + Tailwind v4
- UI: 1CA Glass, the shared 1CleanAir UI kit, vendored in [`kit/`](kit/README.md) and imported as `@1ca/ui/...`: the app shell, page primitives, charts and GlassyUI controls, in light and dark (see "The UI kit (`kit/`)")
- Sign-in: Clerk, through the 1CleanAir Hub (see "Sign-in and access")
- Prisma 7 with `@prisma/adapter-pg`
- Postgres via [Neon](https://neon.tech)
- Sync runs as a Vercel Cron → API route (no BullMQ/Redis)
- ServiceMonster and ServiceTitan API credentials stored as Vercel env vars

## Companies and data sources

Each row in `companies` has a `source`: `servicemonster` (1CleanAir, Home Depot, Enviro Duct; one SM login each) or `servicetitan` (HVAC, slug `hvac`; one tenant). Both fill the same tables, so every page and query works for every company; for HVAC the `sm*` columns hold ServiceTitan ids. `src/lib/sync/syncers.ts` lists the resources synced for each source:

| ServiceMonster | ServiceTitan | Table |
| --- | --- | --- |
| `accounts` | `customers` | `accounts` |
| `orders` | `invoices` (line items come inline) | `orders` + `order_items` |
| (in `orders`) | `estimates` | `orders` (`orderType` `Estimate`) |
| `appointments` | `appointments` | `appointments` |
| `leads` | `leads` | `leads` |
| `employees`, `activities` | (none) | |

Every ServiceTitan job has an invoice from the moment it's booked, so HVAC invoices are typed by what they are, and only `Invoice` counts as revenue, as on ServiceMonster:

- no invoice date yet (job not done): `Work Order`
- $0 (plan tune-ups, warranty and no-charge visits, about two thirds of them): `No Charge`
- deactivated: `Voided`
- anything else, credits included: `Invoice`, dated by its invoice date

What HVAC doesn't have yet:

- Tech utilization on `/operations`: actual on-site time is on ServiceTitan timesheets, not appointments.
- Lead sources: they are job campaigns in ServiceTitan.
- Service-mix categories: HVAC items aren't mapped to the service catalog, so they show under top items only.

## Pages

The dashboard pages (`src/app/(dash)/`) render inside the kit's `AppShell` (`src/app/(dash)/shell.tsx`): top bar, sidebar with the app switcher and the links below, theme switch and account menu.

| Route | Page |
| --- | --- |
| `/` | Executive overview: all companies (revenue split, monthly revenue, service categories, a card per company), or one company with `?company=<slug>` (KPIs against the previous period, revenue by month, top accounts) |
| `/operations` | Operations: appointments and tech utilization for one company |
| `/sales` | Sales: leads, prospects, estimates and new accounts by lead source |
| `/service-mix` | Service mix: line-item revenue by service category, top raw items, cross-company mix |
| `/admin/sync` | Sync status: the latest run and cursor per company and resource, recent runs. Only for hub admins and people with the `sales:sync` permission |
| `/no-access` | Shown to a signed-in person without the Sales grant |

The four report pages share one header (`ReportHeader`, `src/app/(dash)/_report-header.tsx`) with the date-range and company filters under the title. The filters write the URL: `?range=` (`7d`, `30d` (default), `90d`, `mtd`, `qtd`, `ytd`, `12m`) and `?company=` (a company slug; an unknown one falls back to 1CleanAir). Without `?company=`, or with `all`, `/` shows every company and the other pages show 1CleanAir. The shell carries the query string between pages. From 768px the header stays pinned under the top bar; on phones it scrolls away with the page.

Page states come from the kit (`@1ca/ui/components/route-states`), so they are themed and branded:

- `loading.tsx` beside each page that fetches data (the four reports and `/admin/sync`): a skeleton shaped like the page while its data streams in.
- `src/app/(dash)/not-found.tsx` and `src/app/not-found.tsx`: "Page not found", inside and outside the shell.
- `src/app/(dash)/error.tsx`: a page that failed to render, inside the shell.
- `src/app/error.tsx`: a failure the group's own boundary can't catch, such as the `(dash)` layout's company query when the database is down.
- `src/app/global-error.tsx`: the root layout itself failed.

## Sign-in and access

Sign-in belongs to the **1CleanAir Hub** (www.1cleanair.info). Sales uses the hub's Clerk application, so one login covers every `*.1cleanair.info` app. The app has no sign-in pages of its own.

- `src/proxy.ts` runs Clerk on every request. Signed-out visitors go to the hub's sign-in and come back afterwards.
- Access comes from the person's grants in Clerk `publicMetadata`, managed on the hub's `/admin` page (`src/lib/hub-access.ts`): hub admins and `apps: "*"` open every app, and `apps: ["sales", …]` opens Sales. Anyone else is shown `/no-access`.
- `/admin/sync` and `/api/admin/*` also need hub admin or the `sales:sync` permission. Pages redirect to `/`; API routes answer 403.
- `/api/cron/*` skips Clerk and checks `CRON_SECRET` itself.
- The hub's session token must carry `"metadata": "{{user.public_metadata}}"` (Clerk → Sessions → Customize session token). Without it the proxy reads the grants from the Clerk API on every request.

Production Clerk keys only work on `*.1cleanair.info`. Locally, use the hub app's development instance (`clerk env pull` writes its keys to `.env.local`) and leave the sign-in URLs unset to use Clerk's development Account Portal.

## The UI kit (`kit/`)

`kit/` is a vendored copy of 1CA Glass, the UI kit every 1CleanAir app shares: the GlassyUI components, the app shell, the theme, the page primitives and the charts. **Do not edit it here.** The master copy is `kit/` in the hub repo (`dashboard_1cleanair`): the kit is changed there only, and the hub's `scripts/sync-kit.mjs` copies it into this repo, overwriting this folder. The synced `kit/` is then committed here like any other change. `kit/VERSION` records the hub commit and content hash this copy came from.

- Code imports the kit as `@1ca/ui/...` (for example `@1ca/ui/shell`, `@1ca/ui/components/card`); the `paths` in `tsconfig.json` map those imports to `./kit/...`.
- `src/app/globals.css` imports `../../kit/styles/kit.css`, which also registers `kit/` as a Tailwind source.
- ESLint skips `kit/**`.
- The kit's runtime dependencies (the Radix UI packages, cmdk, clsx, lucide-react, tailwind-merge) are in this repo's `package.json`.

The kit's own guide, with every import and component, is [`kit/README.md`](kit/README.md).

## Local setup

This repo uses pnpm 10 (`packageManager` in `package.json`).

```bash
pnpm install              # also runs prisma generate (postinstall)
cp .env.example .env
# Fill in DATABASE_URL (Neon pooled URL) and SM_USER_*/SM_PASS_* in .env,
# the ST_* keys and the Clerk keys (see "Sign-in and access") in .env.local
pnpm exec prisma migrate dev
pnpm db:seed              # seed the 4 companies metadata
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

# HVAC (ServiceTitan). Customers go back further: a few invoices belong to
# customers nobody has edited in two years.
pnpm sync --slug=hvac --resource=customers --backfillMonths=120
for resource in invoices estimates appointments leads; do
  pnpm sync --slug=hvac --resource=$resource --backfillMonths=24
done
```

`pnpm sync` reads `.env.local` and then `.env`, like Next.js.

Subsequent runs are incremental (cursor-tracked); the Vercel cron handles them.

## Scripts

- `pnpm dev`: generate the Prisma client, then the Next.js dev server on port 3000
- `pnpm build`: generate the Prisma client, then a production build
- `pnpm lint`: ESLint
- `pnpm sync --slug=<slug> --resource=<r>`: incremental sync
- `pnpm sync:items --slug=<slug>`: fetch line items for invoices that don't have them
- `pnpm normalize`: map raw line-item names to the service catalog
- `pnpm db:migrate`: run/apply migrations in dev
- `pnpm db:seed` / `pnpm db:seed-services`: seed companies / services
- `pnpm db:studio`: open Prisma Studio

## Project layout

```
kit/                        # 1CA Glass UI kit: vendored copy, edited only in the hub repo (see kit/README.md)
prisma/
  schema.prisma             # data model
  seed.ts                   # company metadata seed
  seed-services.ts          # service catalog + aliases
  migrations/
src/
  proxy.ts                  # Clerk sign-in + hub access checks
  app/
    layout.tsx              # root layout: theme, Clerk and kit providers
    error.tsx, global-error.tsx, not-found.tsx
    no-access/              # signed in without the Sales grant
    (dash)/                 # every signed-in page, inside the shell
      layout.tsx            # AppShell + the company list for the filters
      shell.tsx             # nav links and sidebar footer
      _report-header.tsx    # report page header + no-company state
      _report-filters.tsx   # date-range and company filters
      page.tsx              # /  → Executive overview
      operations/
      sales/
      service-mix/
      admin/sync/
    api/
      admin/sync            # POST trigger for one resource sync
      admin/sm-smoke        # GET one ServiceMonster request, to check credentials
      cron/sync-all         # GET: Vercel cron, every 4 hours
  lib/
    db.ts                   # Prisma singleton
    hub-access.ts           # hub grants: who can open the app and run syncs
    sm/
      client.ts             # SM REST client (Basic auth, retry, paginate)
      time.ts               # tz-naive timestamp parse/format
    st/
      client.ts             # ServiceTitan REST client (OAuth2 + app key, retry, paginate)
    sync/
      runner.ts             # generic incremental sync driver
      syncers.ts            # which resources sync for a company, by its source
      order-items.ts        # invoice line-item backfill (N+1 fetch)
      normalize.ts          # raw name → ServiceCatalog resolver
      resources/            # per-resource syncers (ServiceMonster)
      servicetitan/         # per-resource syncers (ServiceTitan, HVAC)
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
   - `DATABASE_URL`: same Neon pooled URL
   - `SM_USER_1CLEANAIR`, `SM_PASS_1CLEANAIR`
   - `SM_USER_HOMEDEPOT`, `SM_PASS_HOMEDEPOT`
   - `SM_USER_ENVIRODUCT`, `SM_PASS_ENVIRODUCT`
   - `ST_ENV=production`, `ST_TENANT_ID`, `ST_CLIENT_ID`, `ST_CLIENT_SECRET`, `ST_APP_KEY`: the HVAC division's ServiceTitan app (the same one the internal booking tool uses)
   - `CRON_SECRET`: random string; Vercel auto-attaches it as `Authorization: Bearer …` on cron requests.
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`: the hub Clerk app's live keys.
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://www.1cleanair.info/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=https://www.1cleanair.info/sign-up`, `NEXT_PUBLIC_HUB_URL=https://www.1cleanair.info`
   - Optional: `NEXT_PUBLIC_SUPPORT_EMAIL`, which adds a "contact support" link to `/no-access`.
4. **Add the domain.** `sales.1cleanair.info` must be on the hub Clerk app's subdomain allowlist (while that list is on, every app's subdomain has to be on it).
5. **Deploy**. The first deploy will run `prisma generate && next build`.
6. **Verify the cron** in the Vercel dashboard → Settings → Cron Jobs. The schedule in `vercel.json` is `0 */4 * * *` (every 4 hours). Hobby plans only run crons once a day, so they need Pro or a daily schedule.
7. **Run the initial backfill once** by hitting `/api/admin/sync` for each company × resource (or run locally and let the cron pick up incrementals on prod).

## Notes & known limitations

- The SM API caps `limit` at 100 regardless of what we request.
- The SM API ignores `page` / `offset`; pagination is by ordered cursor (`orderBy=timeStamp&wOperator=gt`).
- `wOperator=gte` returns 0 rows even when matching data exists — use `gt`.
- SM timestamps are TZ-naive; `src/lib/sm/time.ts` handles parse/format symmetrically.
- `/notes` (activities) returns one row per `(activityID, orderID)` pair — we collapse to one row per activity ID, losing the multi-order linkage.
- Payments aren't a separate endpoint; we compute `amountPaid = grandTotal - balanceDue`.
- Order line items live at `/orders/{id}/lineItems` — N+1 fetch, only run for invoices, separate `pnpm sync:items` script.
