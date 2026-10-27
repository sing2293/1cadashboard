# @1ca/ui: 1CA Glass

The shared UI kit for every 1CleanAir app: the 35 GlassyUI liquid-glass components, the 1CA brand
theme for light and dark, the app shell, the page primitives every page is built from, the page
states (404, error, loading), the chart set and palette, one way to format dates and numbers, and
the Clerk theme bridge. It ships TypeScript and CSS source; each app compiles it.

Every app repo carries its own copy of the kit in `kit/` (this folder) and imports it as
`@1ca/ui/...` through tsconfig `paths`. The hub repo's `kit/` is the master: change the kit there
only, then run `node scripts/sync-kit.mjs --apply` in the hub repo to copy it into the sales,
pipedrive, calls, uploader and punches repos, and commit it in each. `kit/VERSION` records the hub commit a
copy came from. Never edit `kit/` in the other repos: the next sync overwrites it.

| Import | What it gives you |
| --- | --- |
| `kit/styles/kit.css` (CSS: imported by its relative path) | GlassyUI's styles, the `--ca-*` brand tokens for both themes, Tailwind utilities for them, the `motion-ok:` variant, `.ca-code`, `.ca-link`, page basics |
| `@1ca/ui/theme` | `ThemeToggle`, `ThemeScript`, `useThemeChoice`, `setThemeChoice`, `htmlThemeProps`, theme types and constants |
| `@1ca/ui/theme/server` | `getThemeChoice()` (reads the cookie in a root layout), `htmlThemeProps` |
| `@1ca/ui/providers` | `KitProviders` (theme, glass preferences, tooltips, toasts), `useGlassEffects` |
| `@1ca/ui/clerk` | `ThemedClerkProvider`, `clerkAppearance(theme)`, `mergeClerkAppearance`, `signInAppearance`, `userButtonAppearance` |
| `@1ca/ui/shell` | `AppShell`, `NoAccess`, `AppTile`, `BrandMark`, `useHubViewer` |
| `@1ca/ui/components/<file>` | Page primitives: `page`, `page-header`, `section`, `card`, `stat-card`, `sparkline`, `data-table`, `empty-state`, `status-pill`, `toolbar`, `field`; `route-states` (`NotFoundView`, `ErrorView`, `PageSkeleton`); `notice-toast` (`useNoticeToast`); `charts`; and `kit-gallery` |
| `@1ca/ui/glassyui/<name>` | The GlassyUI components, e.g. `@1ca/ui/glassyui/glass-button` |
| `@1ca/ui/config/*` | The app list (`apps`, `app-ids`) and the access rules (`access`) |
| `@1ca/ui/lib/format` | `formatDateTime`, `formatDate`, `formatLongDate`, `formatWeekdayDate`, `formatMonth`, `formatTime`, `formatHour`, `formatRelative`, `formatInt`, `formatNumber`, `formatPercent`, `formatCurrency`, `TIME_ZONE_LABEL` |
| `@1ca/ui/lib/utils` | `cn()` (clsx + tailwind-merge) |
| `@1ca/ui/lib/chart` | `chartColors()`, `chartColor(slot)`, `CHART_TOKENS`, `readChartColors()` |

## How an app is put together

All six apps (hub, sales, pipedrive, calls, uploader, punches) run on the kit: one shell, one sign-in
place, one page anatomy, one set of controls and colours, in light and dark. A new app, or a new
page, follows the same recipe.

1. **The kit folder.** `kit/` at the repo root, copied from the hub (`scripts/sync-kit.mjs`).
   `tsconfig.json` maps every `@1ca/ui/...` import onto it with `compilerOptions.paths` (copy the
   `@1ca/ui/*` entries from any app). `package.json` lists the kit's runtime dependencies (the
   `@radix-ui/react-*` packages, `cmdk`, `clsx`, `tailwind-merge`, `lucide-react`) at the versions
   the other apps use, and `eslint.config.mjs` ignores `kit/**`. No `transpilePackages`: the kit
   is part of the app's own source.

2. **globals.css** (`src/app/globals.css`) is the kit and little else:

   ```css
   @import "tailwindcss";
   @import "../../kit/styles/kit.css";

   /* Optional: your next/font family (its variable class goes on <html>). */
   :root {
     --ca-font: var(--font-geist), system-ui, sans-serif;
   }
   ```

   CSS imports don't read tsconfig `paths`, so this one is relative. No `@source` line for the
   kit: kit.css registers its own folder (`@source ".."`, resolved from kit.css itself), so
   Tailwind finds the kit's classes.

   App-specific rules are the exception (a third-party widget such as Leaflet or FullCalendar
   restyled with `--ca-*`). See "What stays out of an app" below.

3. **Root layout** (`src/app/layout.tsx`). Clerk Core 3 renders its own scripts, so its provider
   lives inside `<body>`:

   ```tsx
   import type { Metadata } from 'next';
   import { Geist } from 'next/font/google';
   import { ThemedClerkProvider } from '@1ca/ui/clerk';
   import { KitProviders } from '@1ca/ui/providers';
   import { ThemeScript } from '@1ca/ui/theme';
   import { getThemeChoice, htmlThemeProps } from '@1ca/ui/theme/server';
   import './globals.css';

   const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

   export const metadata: Metadata = {
     title: { default: 'Sales Dashboard · 1CleanAir', template: '%s · Sales Dashboard · 1CleanAir' },
   };

   export default async function RootLayout({ children }: { children: React.ReactNode }) {
     const theme = await getThemeChoice();

     return (
       <html lang="en" {...htmlThemeProps(theme, { className: geist.variable })}>
         <head>
           <ThemeScript />
         </head>
         <body>
           <ThemedClerkProvider initialTheme={theme}>
             <KitProviders initialTheme={theme}>{children}</KitProviders>
           </ThemedClerkProvider>
         </body>
       </html>
     );
   }
   ```

   - **Titles.** The title template uses the app's registry name (`@1ca/ui/config/apps`):
     "Sales Dashboard", "Lead Attribution", "RingCentral Hub", "Content Uploader", "Mobile Punches". The hub is
     `{ default: '1CleanAir Hub', template: '%s · 1CleanAir Hub' }`. Every page exports its own
     `metadata.title`, the same words as its `PageHeader` title.
   - **Tab icon.** `src/app/icon.svg`: the app's registry accent gradient (`accent[0]` →
     `accent[1]`, top left to bottom right) behind its lucide glyph in white, the same mark as
     `AppTile`. No `favicon.ico` beside it.
   - Keep every ClerkProvider prop the app passes (`signInUrl`, `afterSignOutUrl`,
     `localization`, ...) on `ThemedClerkProvider`. It supplies the appearance itself.
   - Pass any other `<html>` classes through `htmlThemeProps(theme, { className })`. Do not put a
     separate `className` beside the spread, or one of them is lost. `htmlThemeProps` already sets
     `suppressHydrationWarning`. `<body>` stays bare.
   - If the app sends a Content-Security-Policy without `'unsafe-inline'`, pass the request nonce:
     `<ThemeScript nonce={nonce} />`.

4. **App shell.** Every signed-in page renders inside the app's AppShell wrapper: a client file
   `app/<group>/shell.tsx` exporting `Shell`, rendered by the group's server `layout.tsx` (see
   "App shell"). The shell owns the header, sidebar, nav, user menu and theme switch, so pages
   have none of their own.

5. **Page states.** Each app has `not-found.tsx` and `error.tsx` in its shell group, a root
   `src/app/not-found.tsx`, `src/app/error.tsx` and `src/app/global-error.tsx`, and a
   `loading.tsx` beside each server page that fetches data, except where the page must answer
   with a real 404 or redirect, or is a wallboard (see "Page states").

6. **No access.** `app/no-access/page.tsx` renders
   `<NoAccess appId="…" supportEmail={process.env.NEXT_PUBLIC_SUPPORT_EMAIL} />` and nothing else,
   outside the shell. List `NEXT_PUBLIC_SUPPORT_EMAIL` in the app's `.env.example` and set it in
   every environment: without it every "contact support" line (NoAccess, admin-only screens,
   the hub's home and sign-in) disappears without a word.

7. **Pages.** Each page is `Page` → `PageHeader` → `Section`s of `StatCard`s, `Card`s and
   `Table`s, with GlassyUI controls for every button, input, select, tab, menu, dialog and toast
   (see "Page anatomy"). Dense data goes on solid surfaces.

8. **Leaflet and other z-indexed widgets.** Leaflet's panes use z-index 400-1000, which would
   cover the shell's top bar (z-40), sheets and dialogs. Wrap every map in an element that starts
   its own stacking context, and put it on a solid card:

   ```tsx
   <Card variant="solid" className="py-0 overflow-hidden">
     <div className="isolate h-[28rem]"><LiveMap … /></div>
   </Card>
   ```

   Give `.leaflet-container` a token background (`background: var(--ca-surface-sunken)`) and
   restyle its controls, popups and attribution with `--ca-*` so they read in both themes.

9. **Check both themes** with the toggle in the top bar, at 360px wide and on desktop. The hub's
   `/kit` page (the kit gallery) shows every primitive for comparison.

Type checking works without extra setup: `@1ca/ui/theme` and `@1ca/ui/providers` reference
`kit/types/view-timeline.d.ts`, the one DOM declaration the vendored GlassyUI code needs that
TypeScript 5.9 lacks.

### What stays out of an app

The kit's page rules sit in `@layer base`, so an app's own unlayered rules would win over them.
An app therefore never has:

- `html { color-scheme }`, or a background or colour on `<html>`/`<body>` (they hide the kit
  backdrop and ignore the theme);
- its own `dark:` variant (`@custom-variant dark`; the kit defines `dark:` on the `.dark` class)
  or a palette of its own (`--background`, `--muted`, shadcn tokens and their utilities);
- hex, `rgb()` or Tailwind palette colours (`zinc-*`, `sky-*`, `#151b30`) in components, or
  styles for one theme only. Use `--ca-*` and the kit utilities (see "Tokens"); if a colour is
  missing, ask for a token. The one exception is a third-party logo's own colours (see "Tokens");
- hand-copied icon sets: import lucide-react directly (`icon={Wrench}`);
- a header, sidebar, user button or theme switch of its own, or a `<main>` (the shell has them).

### Static layouts

`getThemeChoice()` reads cookies, so every route under the root layout renders per request:
in the build output every route is `ƒ` (dynamic), including pages with no data of their own
such as `/sign-in`, `/no-access` and the 404s. The content is the same; only caching differs.
Our signed-in pages are dynamic anyway, and the server-rendered theme is what lets the page and
the toggle paint right the first time, so the apps accept this. For a layout that should stay
static:

- Skip `getThemeChoice()` and call `htmlThemeProps()` with no choice.
- Render `<KitProviders>` and `<ThemedClerkProvider>` without `initialTheme`.

`ThemeScript` still reads the cookie in the browser and applies it before first paint. Only the
toggle shows the default until hydration finishes.

## App shell

`AppShell` is the frame every app shares: a glass top bar (1CleanAir and the app's name, ⌘K
search, the app's actions, theme and account), a collapsible sidebar with the app switcher and the
app's links (a sheet below 768px), and the page. It needs `ThemedClerkProvider` and
`KitProviders` above it.

The account menu (the avatar) and the ⌘K "Account" group offer **Manage account** (Clerk's own
profile screen, in a modal: password, email, two-step verification, signed-in devices, photo),
Roles & access for those who manage it, Back to hub, and Sign out. Sign out ends the shared
login in every app and lands on the app's own home, whose proxy sends the visitor to the hub's
sign-in with a link back, so signing in again returns them to the app they left (on the hub it
lands on the hub's sign-in).

Icons are components, which a server layout cannot hand to a client component, so each app keeps
its nav in a tiny client wrapper:

```tsx
// app/(dash)/shell.tsx
'use client';
import { ChartLine, LayoutDashboard, RefreshCw } from 'lucide-react';
import { AppShell, type NavItem } from '@1ca/ui/shell';

const NAV: NavItem[] = [
  { label: 'Executive overview', href: '/', icon: LayoutDashboard },
  { label: 'Sales', href: '/sales', icon: ChartLine },
  { label: 'Sync status', href: '/admin/sync', icon: RefreshCw, perm: 'sales:sync' },
];

export function Shell({ access, children }: { access?: unknown; children: React.ReactNode }) {
  return (
    <AppShell appId="sales" nav={NAV} preserveSearchParams initialAccess={access}>
      {children}
    </AppShell>
  );
}

// app/(dash)/layout.tsx: a server component; children stay server-rendered
import { auth } from '@clerk/nextjs/server';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { sessionClaims } = await auth();
  return <Shell access={sessionClaims?.metadata}>{children}</Shell>;
}
```

| Prop | Use |
| --- | --- |
| `appId` | `"hub"`, `"sales"`, `"pipedrive"`, `"calls"`, `"uploader"` or `"punches"`: names the app and picks its tile |
| `nav: NavItem[]` | `{ label, href, icon?, match?, badge?, children?, perm? }`. `href` is an in-app path, or an `https://` URL that opens in a new tab. `match`: `"exact"` (default for `/`) or `"prefix"` (default otherwise; the longest match wins). `badge`: a count or tag. `children`: sub-pages. `perm`: shown only to people with that hub permission (still check on the server). |
| `actions` | Compact buttons in the top bar, before the theme toggle (`<GlassButton size="sm" variant="ghost" className="size-9 p-0" aria-label="Refresh">`). |
| `fullBleed` | Wallboards: no sidebar, a 48px top bar; the nav stays in the menu sheet and ⌘K. |
| `sidebarFooter` | Pinned under the nav in the expanded sidebar and the mobile sheet: a last-sync time, a company switcher. |
| `homeHref` | Where the app's name leads; defaults to the first nav link. |
| `preserveSearchParams` | Carries the current query string onto nav links and ⌘K jumps, so filters such as a date range survive moving between pages (sales). |
| `initialAccess` | The session token's `metadata` claim, read in the group's server layout (`(await auth()).sessionClaims?.metadata`). Optional. Without it, Clerk only knows the person once it loads in the browser, so links with a `perm` and the other apps in the switcher appear after hydration; with it they are in the server HTML. Hiding only. |

- **Nav labels** are sentence case and the same words as the `PageHeader` title they lead to
  ("Service mix" → "Service mix"). The top bar already names the app. The one exception is a
  home page whose heading greets the person: the hub's "Home" leads to a "Good morning, …"
  heading, and the tab title still says "Home".
- **Sidebar width.** The full 248px sidebar from 1024px; between 768 and 1023px the 72px icon
  rail, so a tablet keeps its width for the page. The toggle at the foot of the sidebar is the
  person's choice, remembered per app and kept at every width. The server can know neither the
  screen nor the choice, so it renders the full sidebar and the rail settles in on hydration (no
  animation): a one-time shift on a full page load for tablet visitors and for anyone who
  collapsed it.
- **Sticky offsets.** The top bar is 56px (48px with `fullBleed`) and sits at z-40. The shell
  exposes its height as `--ca-shell-top`; a page's own sticky element uses
  `sticky top-[var(--ca-shell-top)] z-30` (or lower). `PageHeader sticky` and `Toolbar sticky` do
  this for you.
- **Main landmark.** The shell renders `<main id="main-content">` and a skip link. Pages must not
  render another `<main>`.
- **No access.** `app/no-access/page.tsx` renders
  `<NoAccess appId="sales" supportEmail={process.env.NEXT_PUBLIC_SUPPORT_EMAIL} />` outside the
  shell (`as="div"` if you render it inside one). It offers "Back to the hub" and "Sign out", and a
  "contact support" link when `supportEmail` is set. An admin-only screen inside an app reuses it
  with its own words: `title="Admins only"`, `description={…}` (replaces the default sentence; the
  support line follows it) and `showSignOut={false}`. Inside a shell, its buttons leave from the
  shell's app: on the hub's `/apps/[id]` screen, "Back to the hub" is the hub's own `/`.
- `useHubViewer(initialAccess?)` gives `{ isLoaded, isSignedIn, name, email, imageUrl, access,
  accessKnown }` for hiding UI; the server still decides access.
- **⌘K / Ctrl+K** opens the palette from anywhere on the page except a field someone is typing
  in (a text input, textarea or rich-text editor), where the browser's or the editor's own
  shortcut stays. In the palette's search field it closes the palette again.

## Page anatomy

```tsx
import { Page } from '@1ca/ui/components/page';
import { PageHeader } from '@1ca/ui/components/page-header';
import { Section } from '@1ca/ui/components/section';
import { StatCard } from '@1ca/ui/components/stat-card';

export const metadata = { title: 'Sales' };

export default async function SalesPage() {
  return (
    <Page>
      <PageHeader icon={ChartLine} title="Sales" description="…" actions={<DateRange />} />
      <Section title="Overview">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Revenue" value={formatCurrency(total)} delta={{ value: '+12.4%', trend: 'up' }} />
          …
        </div>
      </Section>
      <Section title="By branch"><Table …/></Section>
    </Page>
  );
}
```

All primitives are server-safe (no `"use client"`), so server pages render them directly and pass
lucide icons as components (`icon={ChartLine}`). From a client component, either form works.
They style themselves only with `--ca-*` tokens, so they are right in light and dark.

**Type scale:** page title `text-2xl font-semibold tracking-tight` (PageHeader); section and card
titles `text-sm font-semibold`; overlay titles `text-lg font-semibold tracking-tight`; body
`text-sm`; secondary text `text-ca-muted`; figures `tabular-nums`. Nothing meaningful is smaller
than 12px (`text-xs`). **Spacing:** `Page` gives the 16/24/32px gutters, 24px top and bottom and
24px between blocks; use `gap-4` inside grids. Cards are `rounded-2xl`, tables `rounded-xl`.

**KPI rows** sit in `<Section title="Overview">` (or the page's natural title) around
`<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">` (`xl:grid-cols-5`, or
`lg:grid-cols-3 2xl:grid-cols-6`, for five or six cards). One column at 360px.

### Page (`@1ca/ui/components/page`)

`<Page width?="wide" | "default" | "narrow" | "full">` is the content column inside AppShell:
`max-w` 1600 / 1280 / 768px / none, centred. It sets `--ca-page-gutter` and `--ca-page-top`,
which sticky headers use to bleed to its edges.

### PageHeader (`@1ca/ui/components/page-header`)

`title` (the page's `<h1>`), `description?`, `actions?` (right side; they drop under the title
once it would get less than 20rem, so always on phones), `icon?` (lucide component or element,
in an accent tile), `eyebrow?` (a small line above the title, such as a back link), `sticky?`
(pins under the top bar on a frosted band from 768px wide and 500px tall up; on phones and
landscape phones it scrolls away, so it never covers a third of the screen; designed as the
first child of `Page`), `children?` (a row under the title: `GlassTabs`, a `FilterBar`).
Filters go here, under the title, never above it.

### Section (`@1ca/ui/components/section`)

`title?`, `description?`, `actions?`, `icon?`, `level?: 2 | 3`. A titled group with no surface of
its own; it names the region with `aria-labelledby`.

### Card (`@1ca/ui/components/card`)

`Card` with `variant?: "glass" (default) | "solid" | "sunken"`, `interactive?` (hover lift + accent
rim), `href?` / `target?` (the whole card becomes one next/link and lifts; keep other buttons out of
a linked card). Compose with `CardHeader` (`actions?`, which drop under the title once it would
get less than 9rem, as a ChartLegend does on a phone; `divided?`), `CardTitle` (`as?`
h2/h3/h4/p, default h3), `CardDescription`, `CardContent` (`flush?` drops the side padding for
edge-to-edge tables and charts), `CardFooter` (`divided?`). The parts carry the 20px side
padding; the card spaces them 16px apart.

- Glass: summaries, KPIs, settings, short lists. Solid: tables, charts, maps, long lists.
  Sunken: a well inside another surface.
- A table inside a card:
  `<Card variant="solid" className="overflow-hidden pb-0"><CardHeader…/><CardContent flush><Table surface="none" …/></CardContent></Card>`.
  `overflow-hidden` clips the last row's hover and selection to the card's corners; `surface="none"`
  pads the first and last columns 20px so they line up with the header (no per-app overrides).

### StatCard and Sparkline (`stat-card`, `sparkline`)

`StatCard`: `label`, `value` (formatted), `delta?: { value, trend: 'up' | 'down' | 'flat',
good?: 'up' | 'down' | 'none', label? }`, `hint?`, `icon?`, `sparkline?`, `loading?` (skeletons,
`aria-busy`), `tone?`, plus every `Card` prop (`variant`, `href`, `interactive`). The delta is
green when it moves the good way (`good: 'down'` for missed calls), red otherwise, muted when flat.
The figure stays on one line and is never broken mid-number ("$655,81" over "0" would read as
$655.81): in a narrow card it steps down a size, a sparkline that no longer fits beside it wraps
under it, and in the narrowest cards (under 13rem) the sparkline hides.

`tone?: 'neutral' | 'success' | 'warning' | 'danger'` colours the figure. Use it only for a figure
that signals a problem: Missed > 0, Out of zone > 0, Failed > 0, Flagged > 0
(`tone={missed > 0 ? 'danger' : 'neutral'}`). Never colour a plain count, and state any threshold in
words in `hint` ("over the 30% target"), since colour alone carries no meaning.

`Sparkline`: `data: number[]`, `area?` (default on), `dot?` (default on), `color?` (a CSS colour
such as `chartColor(2)`; leave it out and `className="text-ca-chart-1"` colours it, or it takes
the surrounding text colour), `label?` (otherwise decorative).
Size it with classes: `className="h-full"` inside StatCard's slot. Colour follows the entity: a
company's sparkline takes the company's chart slot.

### Table (`@1ca/ui/components/data-table`)

`Table` (`density?: 'comfortable' | 'compact'`, `stickyHeader?` + `maxHeight?`, `surface?: 'solid'
| 'none'`, `label?` makes the scroll frame a focusable named region, `containerClassName?`),
`TableHeader`, `TableBody`, `TableFooter`, `TableRow` (`selected?`, `interactive?`), `TableHead`
(`numeric?`, `align?`, `sort?: 'asc' | 'desc' | 'none'` with `onSort?` (button) or `sortHref?`
(link); sets `aria-sort`), `TableCell` (`numeric?` right-aligned tabular, `align?`, `muted?`),
`TableCaption`, `TableEmpty` (`colSpan` + EmptyState props).

The frame is a solid `rounded-xl` panel that scrolls sideways with edge shadows; with
`surface="none"` the frame has no panel of its own but keeps the edge shadows, so columns cut
off at a card's edge still say "scroll for more". A sortable header's label never truncates: it
sets the column's minimum width, and the table scrolls instead. Row hover and selection use
`bg-ca-row-hover` / `bg-ca-row-selected`; `selected` means a row the person picked, never a
highlight for its own sake. Hide low-priority columns on phones with `hidden md:table-cell` on
both the head and the cells.

**Row actions:** text buttons are `<GlassButton size="sm" variant="ghost" className="ca-control-sm">`
(36px); icon-only ones are `<GlassButton variant="ghost" size="sm" className="size-8 p-0" aria-label="…">`.
A destructive one (Delete, Revoke, Remove) is the same ghost button in red at rest, not only on
hover: `className="ca-control-sm text-ca-danger"` (icon-only: `"size-8 p-0 text-ca-danger"`); in
a row menu, `<GlassMenuItem tone="destructive">`. It then asks in a dialog (see "Confirming a
destructive action").

### EmptyState, StatusPill (`empty-state`, `status-pill`)

`EmptyState`: `icon?`, `title`, `description?`, `action?`, `size?: 'md' | 'sm'`,
`titleAs?: 'p' | 'h1' | 'h2' | 'h3' | 'h4'` (default `p`; `h1` when the empty state is the whole
page), `tone?: 'accent' | 'neutral' | 'success' | 'warning' | 'danger'` (the icon tile's colour).

`StatusPill`: `tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'`, `dot?` (default on),
`pulse?` (see below; stops under reduced motion), `size?: 'sm' | 'md'`. **Every status in the
product is a StatusPill**, so the same state reads the same everywhere:

- **Pulse means something is happening right now**: live ("Live", "On shift", "Online") or in
  progress ("Syncing", "Running", "Publishing"). Waiting and settled states ("Queued",
  "Scheduled", "Succeeded") and settings ("Auto refresh · 5s") never pulse, so a pulse always
  reads as now. The tone follows the state, not the pulse: success for live, info for work in
  progress, neutral for a setting.
- Live states are `<StatusPill tone="success" pulse>Live</StatusPill>`, in sentence case ("Live",
  "On shift", "Online"), never an uppercase hand-made dot.
- Counts and role chips drop the dot: `<StatusPill dot={false}>12 people</StatusPill>`.
- The words are a human label ("Succeeded", "Never run"), never a raw enum value ("success",
  "never"). The text always carries the meaning; the tone only supports it.
- Do not use GlassyUI's `GlassBadge` for status: its tones (blue, green, orange, red, purple) are
  GlassyUI's own fixed palette, outside the `--ca-*` tokens and the light/dark tuning.

### Toolbar and FilterBar (`@1ca/ui/components/toolbar`)

`Toolbar` (`variant?: 'plain' | 'glass'`, `label?` for a named group, `sticky?`), `FilterBar` (a
glass Toolbar labelled "Filters"), `ToolbarGroup` (keeps controls together when the row wraps),
`ToolbarSpacer` (pushes the rest right), `ToolbarSearch` (a compact GlassInput with a search icon;
every input prop passes through). Rows wrap on narrow screens.

Give every control in a toolbar `className="ca-control-sm"`: GlassInput, GlassSelectTrigger,
GlassButton (with `size="sm"`) and GlassSegmentedControl all become 36px tall (inputs stay 16px
text on touch screens so phones don't zoom). A short set of presets (7d / 14d / 31d, Today /
Yesterday) is a GlassSegmentedControl.

### Field (`@1ca/ui/components/field`)

`label`, `hint?`, `error?`, `required?` (asterisk + `aria-required`; it does not add native
`required`), `optional?`, `id?`, `layout?: 'stacked' | 'inline'` (inline: label left, control
right, for switches). Its child gets `id`, `aria-labelledby`, `aria-describedby` and
`aria-invalid`. For a control nested deeper, pass a function:

```tsx
<Field label="Branch">
  {(control) => (
    <GlassSelect value={branch} onValueChange={setBranch}>
      <GlassSelectTrigger {...control} className="ca-control-sm"><GlassSelectValue /></GlassSelectTrigger>
      <GlassSelectContent>…</GlassSelectContent>
    </GlassSelect>
  )}
</Field>
```

Use Field instead of GlassInput's own `label`/`hint` props, so every form looks the same.

### Small things that keep the apps alike

- **Busy states:** `<GlassSpinner size="sm" label="Saving" />` (it announces its label); never a
  raw `Loader2` with `animate-spin`.
- **Inline code** (ids, keys, env names, commands): `<code className="ca-code">…</code>`, a mono
  chip on a sunken fill, never under 12px.
- **Inline links** in running text (contact support, view a record, open the map):
  `<a className="ca-link" href="…">contact support</a>`: the accent colour, always underlined, the
  underline firming up on hover, the kit's focus ring. Never a hand-made mix of colour and
  underline. Buttons, nav, cards and table-row links keep their own styles.
- **Timestamps and figures** go through `@1ca/ui/lib/format` (see "Formatting"); wall clocks are
  12-hour and labelled "Toronto time".
- **Icons** come straight from lucide-react, passed as components (`icon={Wrench}`).
- **Display labels come with the data**, in sentence case with acronyms intact ("UV lights",
  "Dryer vent"). Map raw keys to names where the data is read; never dress a raw key up with
  CSS `capitalize`, which title-cases every word and mangles acronyms ("Uv Lights").

### Copy

- **Failures** start "Couldn’t …" ("Couldn’t save the report"), never "Could not" or "Failed
  to".
- **State titles** (EmptyState, GlassAlert, dialog and toast titles, NotFoundView) have no full
  stop: "No calls today", "Couldn’t load posts", "Role saved". Descriptions under them are
  sentences and end with one.
- **Punctuation** is typographic: curly apostrophes and quotes (’ “ ”), an ellipsis character
  (…), en dashes for ranges. In JSX text write `&rsquo;` or the character itself, never a
  straight `'`.
- Sentence case everywhere: page and section titles, buttons, nav, pills.

### Kit gallery (`@1ca/ui/components/kit-gallery`)

`<KitGallery />` renders every primitive and the main GlassyUI controls with made-up data: KPI
rows with figure tones, a filter bar and sortable selectable table, a table inside a card, cards,
forms, dialogs (including a destructive confirmation), a sheet, menu, popover, tooltip, tabs,
toasts, alerts, status pills, the three page states, every chart and the tokens with `.ca-code`.
The hub mounts it at `/kit` (inside its AppShell) for reviewing both themes.

### Motion, tastefully

- `ca-lift` (what `interactive` cards use): a 2px rise and an accent rim on hover.
- `ca-enter`: a 320ms rise on first paint; stagger with `[--ca-enter-delay:60ms]`.
- `ca-frost`: the frosted band behind sticky headers and toolbars.
- The charts grow, wipe and draw in within 400ms, with staggers capped at 240ms.
- Entrances and draw-ins stay within 320-400ms; transitions within 150-250ms, with
  `motion-reduce:transition-none`.
- **Two switches stop motion:** the system's `prefers-reduced-motion` and GlassyUI's own
  reduce-motion preference (`data-lg-reduce-motion="1"` on `<html>`). Everything above honours
  both, in two ways:
  - Transitions: `motion-reduce:transition-none` reads the system setting; GlassyUI's
    preference already zeroes every transition and animation on the page
    (`[data-lg-reduce-motion='1'] * { transition-duration: 0ms !important }` in liquid.css), so
    a short fade needs nothing more.
  - Motion that runs by itself (entrances, draw-ins, pulses, loops) must check both up front:
    use the kit's `motion-ok:` variant instead of `motion-safe:` (`motion-ok:animate-ping`,
    `motion-ok:group-hover:-translate-y-0.5`).

## Page states

What a person sees when a page is missing, broken or still loading is part of the product, not
Next's plain fallback (which paints black on white, follows only the OS theme and drops the shell
and branding). Every app uses `@1ca/ui/components/route-states`.

| File | Renders | Where |
| --- | --- | --- |
| `app/<group>/not-found.tsx` | `<NotFoundView appId="sales" />` | Inside the shell group, for `notFound()` |
| `app/not-found.tsx` | `<NotFoundView appId="sales" />` | Root, for URLs outside every group |
| `app/<group>/error.tsx` | `<ErrorView error={error} reset={reset} retry={retry} appId="sales" />` | Inside the shell group (`'use client'`) |
| `app/error.tsx` | The same `ErrorView` | Root, for a page outside every group (`/no-access`, sign-in): it centres itself like the root 404 |
| `app/global-error.tsx` | `ErrorView` in its own `<html>` and `<body>` | When the root layout itself fails; Next renders it instead of the root layout |
| `…/loading.tsx` | `<PageSkeleton label="…" … />` shaped like its page | Beside each server page that fetches data, with the exceptions below |

```tsx
// app/(dash)/not-found.tsx, and the same in app/not-found.tsx
import type { Metadata } from 'next';
import { NotFoundView } from '@1ca/ui/components/route-states';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return <NotFoundView appId="sales" />;
}

// app/(dash)/error.tsx, and the same in app/error.tsx
'use client';
import { ErrorView } from '@1ca/ui/components/route-states';

export default function Error({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  retry?: () => void;
}) {
  return <ErrorView error={error} reset={reset} retry={retry} appId="sales" />;
}

// app/global-error.tsx: replaces the root layout, so it brings the document, the styles, the
// theme and the kit's providers itself (no Clerk: the shell is not there). React's <title>
// stands in for metadata, which a client file cannot export.
'use client';
import { ErrorView } from '@1ca/ui/components/route-states';
import { KitProviders } from '@1ca/ui/providers';
import { htmlThemeProps, ThemeScript } from '@1ca/ui/theme';
import './globals.css';

export default function GlobalError({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  retry?: () => void;
}) {
  return (
    <html lang="en" {...htmlThemeProps()}>
      <head>
        <ThemeScript />
        <title>Something went wrong · Sales Dashboard · 1CleanAir</title>
      </head>
      <body>
        <KitProviders>
          <ErrorView error={error} reset={reset} retry={retry} appId="sales" />
        </KitProviders>
      </body>
    </html>
  );
}

// app/(dash)/operations/loading.tsx
import { PageSkeleton } from '@1ca/ui/components/route-states';

export default function Loading() {
  return <PageSkeleton stats={5} rows={8} label="Loading the operations report" />;
}
```

- **`NotFoundView`** (`appId?`, `homeHref?`, `title?` (default "Page not found"),
  `description?`) is a whole page body. Inside AppShell it is a narrow page under the top bar, and
  without `appId`/`homeHref` it takes the shell's app and home. Rendered by the root
  `app/not-found.tsx` (outside every group, so outside the shell) it centres itself like
  NoAccess, owns the `<main>` landmark, and signs itself with the app's tile and a link to the
  hub. Pass `homeHref` when the app's home is not `/` (the uploader's is `/dashboard`).
  Server-safe.
- **`ErrorView`** (`error`, `reset`, `retry?`, `appId?`, `homeHref?`, `title?`, `description?`)
  shows "Something went wrong", "Try again" and "Back to …", with the error's digest as a
  reference to quote. It never shows the error's message, which can hold server details. "Try
  again" calls Next's `retry()` when you pass it, otherwise it refreshes the route's server data
  and then calls `reset()`. A client component, as `error.tsx` files must be.
- **`PageSkeleton`** (`label` (what screen readers hear; always name the screen, "Loading the
  operations report", since the bare fallback "Loading" says nothing), `title?` (default on),
  `filters?`, `stats?` (KPI cards), `rows?` (default 6; 0 leaves out the table card), `width?`)
  draws the page's frame in placeholders, so it settles in place when the data streams in.
  Match the real page: the same `width`, a `filters` row if it has one, its KPI count and roughly
  its row count. Server-safe.
- A `loading.tsx` makes its route stream: the response starts (HTTP 200) before the page has
  rendered, so a render error shows the error page with a 200 rather than a 500, and a
  `notFound()` or `redirect()` arrives after the 200 has gone out. Add one only where the page
  fetches data, and **skip it** where:
  - the page must answer with a real 404 or redirect (the hub's `/apps/[id]` redirects or 404s;
    Punches' `/employees/[id]` 404s on an unknown id);
  - the page is a wallboard or refreshes itself in place (Punches' live board, where a skeleton
    would flash over the board on every refresh);
  - the page renders no fetched data (the hub's `/kit`).

### Feedback

- **Success that needs no action** is a toast that passes, from `useNoticeToast()`
  (`@1ca/ui/components/notice-toast`): a GlassToast with a tick (KitProviders already mounts the
  viewport) that clears itself after four seconds and keeps its text while it slides away. Each
  notice is a new toast, so a second one within four seconds gets its own four seconds. No
  timers of your own:

  ```tsx
  'use client';
  import { useNoticeToast } from '@1ca/ui/components/notice-toast';

  const { notify, toast } = useNoticeToast();
  // after the save succeeds:
  notify('Role saved');
  // once, anywhere in the component's output:
  {toast}
  ```

- **A failure** is an inline `<GlassAlert tone="danger" title="Couldn’t save">…</GlassAlert>` next
  to what failed (it is announced as an alert), until it is dismissed or the action works. Never
  an info alert, never swallowed. The kit draws every alert tone in the brand's status colours,
  so a danger alert is the same red as a danger pill or field error.
- **Persistent states** (a page-level warning such as "Not configured yet") are an inline
  GlassAlert in the page.

### Confirming a destructive action

A destructive action asks in a `GlassDialog`, never `window.confirm()`. The dialog opens exactly
where the confirm did, and the action runs only on its confirm button, so the gate is identical.

```tsx
<GlassDialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
  <GlassDialogContent className="w-[min(28rem,calc(100vw-2rem))]">
    <GlassDialogTitle className="text-lg font-semibold tracking-tight">Delete “{name}”?</GlassDialogTitle>
    <GlassDialogDescription className="mt-1 text-sm text-ca-muted">
      4 people lose the access this role gives them. This can&rsquo;t be undone.
    </GlassDialogDescription>
    <div className="mt-6 flex flex-wrap justify-end gap-2">
      <GlassButton size="sm" variant="ghost" className="ca-control-sm" onClick={() => setConfirming(null)}>
        Keep it
      </GlassButton>
      <GlassButton size="sm" variant="soft" className="ca-control-sm text-ca-danger" onClick={remove}>
        Delete role
      </GlassButton>
    </div>
  </GlassDialogContent>
</GlassDialog>
```

The same rule holds for every dialog and sheet: the title is `text-lg font-semibold
tracking-tight` with a description under it, and the action row is
`flex flex-wrap justify-end gap-2` with Cancel (`variant="ghost"`) first and the main or
destructive action last. A note that belongs with the actions sits on the left with `me-auto`.
Page states and NoAccess, which centre their buttons, put the main action first.

## Formatting (`@1ca/ui/lib/format`)

One way to write dates, times and numbers: Canadian English on Toronto time. The server and the
browser print the same text whatever their own zone or locale, so timestamps hydrate cleanly.

```ts
import { formatDateTime, formatDate, formatLongDate, formatWeekdayDate, formatMonth, formatTime, formatHour, formatRelative, formatInt, formatNumber, formatPercent, formatCurrency, TIME_ZONE_LABEL } from '@1ca/ui/lib/format';

formatDateTime(run.finishedAt);          // "Oct 23, 2026, 3:04 p.m."
formatDate('2026-10-23');                // "Oct 23, 2026" (a date-only string keeps its day)
formatLongDate('2026-10-23');            // "Friday, October 23, 2026"; { year: false } gives "Friday, October 23"
formatWeekdayDate('2026-10-23');         // "Fri, Oct 23"; { year: true } adds ", 2026"
formatMonth('2026-10');                  // "October 2026" (a month string keeps its month); { short: true } gives "Oct 2026"
formatTime(punch.at);                    // "3:04 p.m."
formatTime(now, { seconds: true });      // "3:04:05 p.m.", for a live wall clock
formatHour(9);                           // "9 a.m." (an hour of the day, 0-23, for chart axes and hour columns)
formatRelative(run.finishedAt, now);     // "just now", "5 min ago", "3 h ago", "yesterday", "4 days ago", then the date
formatInt(1234567);                      // "1,234,567"
formatNumber(7.25, 1);                   // "7.3" (exactly that many decimals, in place of toFixed)
formatPercent(0.1234);                   // "12.3%" (a ratio; formatPercent(0.5, 0) is "50%")
formatCurrency(184230);                  // "$184,230"; { compact: true } gives "$184.2K", "$25K"
TIME_ZONE_LABEL;                         // "Toronto time", for clocks and timestamp columns
```

Values are `Date | string | number`; `null`, `undefined` and unreadable dates print "—".
`formatRelative` depends on the moment it runs, so in server-rendered UI pass the same `now` the
client will use, or render it in a client component that ticks. A UTC value that matters (a sync
log) can stay in a `title` tooltip beside the formatted one.

- **Clocks are 12-hour**, like every time in the product, with "a.m." and "p.m."; a live wall
  clock adds seconds with `{ seconds: true }` and is labelled `TIME_ZONE_LABEL`.
- **Axis labels** are formatted values too: an hour axis uses `formatHour`, a day axis
  `formatWeekdayDate`, a month axis `formatMonth(…, { short: true })`, never a raw key such as
  "10-23" or "9a". The table view shows the same labels.
- No `toFixed()` in UI text: `formatNumber(hours, 1)`, `formatPercent(share, 0)`.

## Charts

### Components (`@1ca/ui/components/charts`)

Server-safe charts with no client JavaScript: marks are HTML and SVG in `--ca-chart-*` colours,
axis text is HTML in text tokens (12px at any width), and each one goes on a solid card. Native
`title` tooltips show exact values on hover; `tableLabel` adds a "Show data as a table"
disclosure, which is also how screen readers and keyboards reach the numbers.

| Component | Props |
| --- | --- |
| `BarChart` | `data: { label, value?, values?, tooltip? }[]`, `ariaLabel`, `format?` (ticks; default `String`), `valueFormat?` (printed values, tooltips, table), `slot?` (one series; default 1), `series?: { label, slot?, tone? }[]` (two or more, back to front; each datum then has `values` in this order), `variant?: 'grouped' \| 'stacked' \| 'overlay'` (default grouped), `height?` (px; default 224, 256 from 640px), `tableLabel?`, `xLabel?` (table header; default "Period"), `emptyTitle?`, `emptyDescription?` |
| `BarList` | `data: { label, value, slot?, tone?, tooltip? }[]`, `ariaLabel`, `format?`, `labelClassName?`. Horizontal bars with every label and value printed. Pass display labels ("UV lights"), not raw keys with `capitalize`. |
| `AreaChart` | `series: { label, slot?, tone?, points: { x, y }[] }[]`, `ariaLabel`, `format?`, `valueFormat?`, `height?` (default 280), `tableLabel?`, `xLabel?` (default "Month") |
| `DonutChart` | `slices: { label, value, slot, href? }[]`, `centerLabel`, `centerValue`, `ariaLabel`, `format?` (legend values; default whole Canadian dollars). Slices are plain shapes; a slice's `href` makes its legend row the link. |
| `RingGauge` | `value`, `total`, `label` (shown as written; an all-lowercase key gets a capital first letter, nothing more), `centerLabel`, `slot?`, `size?` (px, default 104), `delay?` (ms, capped at 240) |
| `ChartLegend` | `items: { label, slot?, tone? }[]` (a BarChart's `series` works as is), `className?` |
| `MiniBar` | `value` (0-1), `slot?` (accent when left out), `tone?`, `className?`. A share bar for table cells; print the figure beside it. |
| `YGrid` | `max`, `format`, `ticks?`: gridlines with values in the left gutter, for a chart of your own |

Also exported: `niceScale(max, integer?)` (a round top and 3-5 ticks), `seriesColor(series, index)`,
`slotColor(slot)`, and the types `Slot`, `ChartTone`, `ChartSeriesStyle`, `BarChartVariant`.

```tsx
const SERIES = [
  { label: 'Calls', slot: 1 },
  { label: 'Missed', tone: 'danger' },
] satisfies ChartSeriesStyle[];

<Card variant="solid">
  <CardHeader actions={<ChartLegend items={SERIES} />}>
    <CardTitle as="h2">Call volume</CardTitle>
  </CardHeader>
  <CardContent>
    <BarChart
      ariaLabel="Calls by hour: 412 calls, 37 missed"
      variant="overlay"
      series={SERIES}
      format={formatInt}
      data={hours.map((h) => ({ label: h.label, values: [h.total, h.missed] }))}
      tableLabel="Calls by hour"
      xLabel="Hour"
    />
  </CardContent>
</Card>
```

- The y axis gets a round top and three to five ticks (counts stay whole), with gridlines in
  `--ca-chart-grid`, the baseline in `--ca-chart-axis` and tick values at 12px in the gutter.
- The x axis prints about twelve labels on wide screens and five on phones, always the last
  one; a label too close to the last is dropped, so the end never runs together. Pass labels
  already formatted (`formatHour`, `formatWeekdayDate`, `formatMonth`), not raw keys.
- With 12 bars or fewer, each bar's value is printed on top (a stack's total; for overlay, the
  tallest); grouped bars rely on tooltips and the table view.
- `overlay` draws each series from the baseline over the one before: a part of a whole, such as
  missed calls within all calls. `stacked` adds a Total column to the table view.
- Series colours are drawn at full strength; a hovered column lights up behind its bars instead
  of fading them.

### Palette (`@1ca/ui/lib/chart`)

`kit.css` defines eight categorical series colours per theme, `--ca-chart-1` … `--ca-chart-8`,
plus `--ca-chart-other`, `--ca-chart-grid` and `--ca-chart-axis`. They are the dataviz reference
palette, validated against `--ca-surface-solid` in each theme for lightness, chroma, colour-blind
separation of neighbouring series and contrast. Utilities: `bg-ca-chart-1`, `fill-ca-chart-2`,
`stroke-ca-chart-3`, `text-ca-chart-4`, `stroke-ca-chart-grid`, `bg-ca-chart-other`, …

```ts
import { chartColor, chartColors, CHART_TOKENS, readChartColors } from '@1ca/ui/lib/chart';

chartColors();      // ['var(--ca-chart-1)', …, 'var(--ca-chart-8)']
chartColors(3);     // the first three
chartColor(2);      // 'var(--ca-chart-2)'; past 8 (or 'other') → 'var(--ca-chart-other)'
CHART_TOKENS.grid;  // 'var(--ca-chart-grid)'; also axis, label, text, other, surface
readChartColors();  // resolved hex values for canvas libraries; re-read after a theme change
```

- Assign slots 1, 2, 3 … in order and never cycle; fold a ninth series into "Other". A series
  keeps its slot when filters hide others (colour follows the entity, in every chart, legend,
  sparkline and table dot).
- Scatter plots and maps (any two colours can touch) use three series at most.
- Axis labels, values and legends use text tokens (`fill-ca-muted`, `text-ca-text`), never a
  series colour. Gridlines `--ca-chart-grid`, baseline `--ca-chart-axis`.
- Good/bad meaning (missed, failed) uses `--ca-success` / `--ca-warning` / `--ca-danger` (a
  series `tone`), not a series colour.
- Never draw a series at reduced opacity: the palette is tuned for 3:1 at full strength. In light
  mode slots 3-5 are under 3:1 on white, so a chart that uses them prints its values or offers
  the table view.
- Put charts on solid cards. In SVG, set colours through `style={{ fill: chartColor(1) }}` or a
  class; `var()` inside an SVG presentation attribute is not reliable everywhere.
- For one-hue magnitude (heatmaps), use one slot with opacity steps: `bg-ca-chart-1/20` …
  `bg-ca-chart-1`.

## Clerk

`@1ca/ui/clerk` puts Clerk's sign-in, user button and profile in the 1CA look and switches them
with the theme.

- `ThemedClerkProvider`: the client `ClerkProvider` with every prop passed through, plus
  `initialTheme?` and `forcedTheme?` (pass the same values as `KitProviders`). It layers any
  `appearance` you pass over the kit's. The server-only `dynamic` prop is not available; no app
  uses it.
- `clerkAppearance(theme: 'light' | 'dark')`: a Clerk Core 3 appearance object. `variables` hold
  the `--ca-*` palette values for that theme (`colorPrimary`, `colorPrimaryForeground`,
  `colorBackground`, `colorForeground`, `colorMutedForeground`, `colorMuted`, `colorInput`,
  `colorInputForeground`, `colorBorder`, `colorNeutral`, `colorRing`, `colorDanger`,
  `colorSuccess`, `colorWarning`, `borderRadius`, `fontFamily`); `elements` make the card and
  the user-button popover translucent glass (`--ca-glass-bg` + `--ca-glass-filter`, solid under
  reduced transparency) with the kit focus ring; `captcha.theme` follows the theme.
  - The primary button ("Continue") is the kit's prominent button: the deep sky fill with white
    text and a lit top edge. `colorPrimary` stays the accent, so Clerk's links keep their
    contrast.
  - `colorBorder` is opaque (the base colour of `--ca-border`): Clerk draws borders as a small
    share of it (11% at rest, 28% on hover), which multiplies a translucent colour's own alpha
    in current browsers. Text fields then get `--ca-border-strong` at rest (3:1, like the kit's
    inputs), with hover and focus restated; a field showing an error keeps Clerk's red edge.
- `mergeClerkAppearance(...layers)`: deep-merges appearance objects, later ones winning.
- `signInAppearance` for a full-page `<SignIn />` / `<SignUp />` (fills a phone, stops at 26rem);
  `userButtonAppearance` for a `<UserButton />` outside the shell (32px avatar). Pass them on the
  component: `<SignIn appearance={signInAppearance} />`. Component appearance layers over the
  provider's.
- Element overrides of your own: prefer style objects (`{ cardBox: { maxWidth: '30rem' } }`).
  A Tailwind class string loses to Clerk's own unlayered styles unless marked important (`!`).

## Theme

- **Choices.** `light`, `dark` or `system`. `system` follows the operating system live, including a switch while the page is open.
- **Shared cookie.** The choice is stored in the `ca-theme` cookie:
  - `Domain=.1cleanair.info` on every 1cleanair.info host, so one choice carries across hub, sales, pipedrive, calls, uploader and punches.
  - Host-only on localhost and preview URLs.
  - `Path=/`, one year `Max-Age`, `SameSite=Lax`, and `Secure` on https.
- **Picking up changes made elsewhere.** An open tab picks up a choice made in another app when the visitor returns to it (focus or visibility). Where the Cookie Store API exists (Chromium), it updates immediately.
- **Default.** A visitor with no cookie gets `system`: their operating system's light or dark. Every app styles itself from `--ca-*` and has its own themed 404 and error pages, so both themes hold on every screen. `DEFAULT_THEME_CHOICE` in `kit/theme/theme.ts` is the one constant the head script, server helper and providers read.
- **What lands on `<html>`.**
  - Class `dark` or `light`, which Tailwind's `dark:` / `light:` variants read.
  - `data-lg-theme`, which GlassyUI reads.
  - `data-ca-theme`: the choice, including `system`.
  - `style="color-scheme: ..."` for native controls and scrollbars.
  - For `system`, the server cannot know the answer, so it renders `color-scheme: light dark` and the head script sets the rest before first paint.

### Components and hooks

- `<ThemeToggle />`: three icon segments (Light, Dark, System), about 108×34px, built on `GlassSegmentedControl`.
  - `variant="menu"`: a single icon button that opens a `GlassMenu`, for tight headers.
  - `showLabels`: shows the words beside the icons.
  - `label`: the accessible name; default `"Theme"`.
  - `className`: extra classes.
  - It renders nothing in an app with a forced theme.
- `useThemeChoice()` returns:
  - `choice`
  - `resolvedTheme`: undefined only while a `system` page is server rendered or hydrating.
  - `systemTheme`
  - `forcedTheme`
  - `setChoice(choice)`: writes the cookie, updates `<html>` in the same frame with transitions paused (so every surface flips together), and re-renders every subscriber. `setThemeChoice(choice)` does the same outside React.
- `KitProviders` runs GlassyUI's `GlassProvider` from the shared cookie rather than per-subdomain localStorage:
  - `ThemeScript` drops any theme GlassyUI saved for this origin.
  - A guard puts GlassyUI's theme back if anything sets another one.
  - Change themes with `setChoice`, never GlassyUI's `setPreferences({ theme })`.

### Forced theme (wallboards)

An app that must not follow the visitor, such as a board read in a lit office, pins one theme.
Pass the same value in every place:

```tsx
<html lang="en" {...htmlThemeProps('light', { forcedTheme: 'light' })}>
  <head><ThemeScript forcedTheme="light" /></head>
  <body>
    <ThemedClerkProvider forcedTheme="light">
      <KitProviders forcedTheme="light">{children}</KitProviders>
    </ThemedClerkProvider>
  </body>
</html>
```

Visitors' choices are still saved for the other apps. `ThemeToggle` hides itself.

## Tokens

Every name carries `ca`, so nothing collides with the apps' own names. Values are tuned for WCAG AA:
- Text holds 4.5:1 on `bg`, `surface-solid` and `surface-sunken`, and each status colour holds it on its own `-soft` tint.
- `ring` and `border-strong` hold 3:1 against the surfaces they edge.

| Token | Utility | Dark | Light | Use |
| --- | --- | --- | --- | --- |
| `--ca-bg` | `bg-ca-bg` | `#060b17` | `#f3f7fc` | Page |
| `--ca-surface` | `bg-ca-surface` | sky-white 6% | white 62% | Translucent cards on the backdrop |
| `--ca-surface-hover` | `bg-ca-surface-hover` | sky-white 10% | white 86% | That card, hovered |
| `--ca-surface-solid` | `bg-ca-surface-solid` | `#0e1729` | `#ffffff` | Opaque panels, `.ca-solid` |
| `--ca-surface-sunken` | `bg-ca-surface-sunken` | `#091120` | `#eaf0f7` | Table headers, wells, inputs on solid panels, `.ca-code` |
| `--ca-border` | `border-ca`, `divide-ca`, `border-ca-border` | sky 14% | navy 12% | Hairlines |
| `--ca-border-strong` | `border-ca-border-strong` | sky 55% | navy 50% | Control edges (3:1): every GlassInput, GlassSelectTrigger and GlassTextarea, Clerk's text fields, the light theme's empty switch track |
| `--ca-text` | `text-ca-text` | `#f2f6fc` | `#0b1526` | Body text |
| `--ca-text-muted` | `text-ca-muted` | `#9babc2` | `#43506a` | Secondary text |
| `--ca-accent` | `text-ca-accent`, `bg-ca-accent` | `#38bdf8` | `#0369a1` | Links, active states, brand fills |
| `--ca-accent-hover` | `bg-ca-accent-hover` | `#7dd3fc` | `#075985` | Accent, hovered |
| `--ca-accent-fg` | `text-ca-accent-fg` | `#03131f` | `#ffffff` | Text on an accent fill |
| `--ca-accent-soft` | `bg-ca-accent-soft` | sky 14% | sky 10% | Selected rows, info chips |
| `--ca-ring` | `ring-ca`, `outline-ca` | `#38bdf8` | `#0284c7` | Focus |
| `--ca-danger` / `-soft` | `text-ca-danger`, `bg-ca-danger-soft` | `#f87171` | `#c81e1e` | Errors |
| `--ca-success` / `-soft` | `text-ca-success`, `bg-ca-success-soft` | `#34d399` | `#047857` | OK |
| `--ca-warning` / `-soft` | `text-ca-warning`, `bg-ca-warning-soft` | `#fbbf24` | `#a64b07` | Warnings |
| `--ca-row-hover` / `--ca-row-selected` | `bg-ca-row-hover`, `bg-ca-row-selected` | | | Table rows on solid panels |
| `--ca-chart-1` … `-8`, `-other`, `-grid`, `-axis` | `bg-ca-chart-1`, `fill-…`, `stroke-…` | | | Charts (see "Charts") |
| `--ca-shadow` | `shadow-ca` | | | Panel shadow |
| `--ca-shadow-lift`, `--ca-glow` | `shadow-ca-lift` | | | A hovered interactive card |
| `--ca-glass-bg`, `--ca-glass-filter` | | | | Plain-CSS glass (Clerk); solid under reduced transparency |
| `--ca-font`, `--ca-font-mono` | `font-ca`, `font-ca-mono` | | | Inter-like system stack; override `--ca-font` for next/font |
| `--ca-backdrop` | | | | The page's colour fields, reusable on other elements |

Opacity modifiers work (`bg-ca-accent/20`, `bg-ca-muted/12`). The kit also maps the brand onto
GlassyUI's own `--lg-*` tokens, so glass, buttons, switches, menus and focus rings pick it up in
each theme, and restyles a few GlassyUI parts outright (kit.css, "GlassyUI controls in the
brand"): text fields take `--ca-border-strong`; alerts take the status colours (a tint of the
tone over `--ca-surface-solid`, the tone on the rim and icon), so a danger alert is the same red
as a danger pill; skeletons are a tint of the text colour, visible on white. Never hard-code
hex/rgb colours or Tailwind palette colours in an app, and never style for one theme only; if a
colour is missing, ask for a token.

**The one exception: third-party logos.** A platform's logo mark keeps its owner's brand colour,
because recoloured it stops being recognisable: the uploader's platform icons (Instagram, YouTube,
LinkedIn, Facebook in `platform-icon.tsx`) carry their official hex values and white glyphs. That
file is the only place such colours live. Everything around a logo (its chip, label and states)
still uses `--ca-*`, and the marks read on both themes.

To theme one region differently from the page, give it both markers: `class="light" data-lg-theme="light"`. That covers the kit tokens and the GlassyUI material.

## Glass and performance

- **Glass for chrome; `.ca-solid` for data.** Use glass for headers, navigation, menus, dialogs, toasts, toolbars, KPI and summary cards. Use solid surfaces (`Card variant="solid"`, `Table`, `.ca-solid`) for tables, maps, charts and long lists: an opaque `--ca-surface-solid` panel with no backdrop-filter, so nothing behind it is re-blurred on every scroll or update.
- **Turning a GlassPanel solid.** `<GlassPanel className="ca-solid" refraction="none" lens={false}>` drops the frost, lens and grain the way GlassyUI's reduced-transparency mode does, and builds no displacement maps.
- **Repeated items.** Never put glass on every row of a long list or table. Each glass control with a lens builds a displacement map (in Chromium).
- **Wallboards and always-on screens.**
  - `htmlThemeProps(theme, { glass: 'lite' })` renders `<html data-ca-glass="lite">`: no edge lens or refraction and a 6px frost, the savings of GlassyUI's low quality.
  - Setting `data-lg-quality="low"` on `<html>` yourself does not stick, because GlassProvider recomputes it per device after hydration. `data-ca-glass` is never touched.
  - Combine it with `forcedTheme` for a board, and with `AppShell fullBleed`.
- **Backdrop.** One fixed layer behind the page, painted once, never animated. It is hidden for reduced transparency, increased contrast, forced colours and print. Switch it off with `data-ca-backdrop="none"` on `<html>` or `<body>`.
- **Reduce glass effects.** `useGlassEffects()` gives `{ reduced, quality, setReduced }`, a passthrough to GlassyUI's reduce-transparency preference, for a settings menu. GlassyUI remembers it per app; the theme is the only preference shared across apps.

## Accessibility

- Focus: one 2px `--ca-ring` outline on every focusable element. It uses `:where`, so components restyle it freely, and the outline survives forced-colours mode. Never replace it with `outline-none` plus a thinner ring.
- Landmarks: the shell owns `<main>`, the banner and the nav; pages use `PageHeader` (one `h1`) and `Section` (named regions, `h2`). A page that is only a state (404, error, no access) still has one `h1`.
- Current page: the shell marks nav links with `aria-current="page"`; do the same on any in-page link list.
- Controls: every input has a label (`Field`, or `aria-label` on icon buttons and toolbar selects); sortable headers set `aria-sort`; scrollable tables get a `label`.
- Charts: a role="img" name that states the headline, values as text or a table view, and no focusable shapes inside an SVG.
- Text: nothing meaningful under 12px.
- Reduced transparency (system setting or `setReduced`): glass turns into opaque brand-coloured surfaces.
- Reduced motion (the system setting or GlassyUI's preference): GlassyUI stops its motion; `ca-lift`, `ca-enter`, chart draw-ins, pills' pulse and anything on the `motion-ok:` variant stop. Theme switches never animate.
- Control edges hold 3:1: text fields, select triggers, textareas and Clerk's fields use `--ca-border-strong`, and the light theme's empty switch track does too.
- Links in text are underlined (`.ca-link`), never colour alone.
- Status is never colour alone: pills and deltas carry words and arrows, figure tones sit beside their label, and thresholds are stated in words.
- Failures are announced: a danger `GlassAlert` is a `role="alert"`; success toasts are polite.

## Licence

The GlassyUI components in `kit/components/glassyui/` are vendored under the MIT licence; see `kit/components/glassyui/LICENSE` (Copyright (c) 2026 Glassy UI contributors). Keep that file, and its notice, with the vendored code wherever it is copied. Change vendored files only when necessary, and record any change below. Everything else in the kit is private 1CleanAir code.

### Vendoring GlassyUI

The components were vendored with the shadcn CLI 4.16.2 from GlassyUI's registry
(`https://glassyui.com/r/<name>.json`). Each registry item names its own target files, which
live in `kit/components/glassyui/` (with its `lib/` and `styles/` folders) and keep their
relative imports. To add or refresh one, in the hub repo only: open the item's JSON, write each
file's `content` to the same place under `kit/components/glassyui/`, add any npm `dependencies`
it lists to every app's `package.json`, then sync the kit.

- The kit uses no plain shadcn components: don't add any.
- Adding a component again overwrites the vendored copy. Diff it against git first, then put
  back the changes recorded below.
- Prefer restyling from `kit.css` (doubled selectors in `@layer components`, as the rules for
  inputs, alerts and skeletons do) over editing a vendored file.

**Changes to vendored files:** none so far.
