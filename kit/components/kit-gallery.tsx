'use client';

import {
  Bell,
  CalendarDays,
  CloudAlert,
  DollarSign,
  Download,
  Ellipsis,
  Filter,
  Flag,
  Inbox,
  LayoutGrid,
  MapPinOff,
  PhoneMissed,
  Plus,
  RefreshCw,
  SearchX,
  Sparkles,
  Trash2,
  Users,
  Wrench,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { chartColor, chartColors } from '../lib/chart';
import { formatCurrency, formatInt, formatPercent } from '../lib/format';
import { cn } from '../lib/utils';
import { ThemeToggle } from '../theme';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import {
  AreaChart,
  BarChart,
  BarList,
  ChartLegend,
  DonutChart,
  MiniBar,
  RingGauge,
  type ChartSeriesStyle,
} from './charts';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  type SortDirection,
  type TableDensity,
} from './data-table';
import { EmptyState } from './empty-state';
import { Field } from './field';
import { GlassAlert } from './glassyui/glass-alert';
import { GlassAvatar, GlassAvatarGroup } from './glassyui/glass-avatar';
import { GlassButton } from './glassyui/glass-button';
import { GlassCheckbox } from './glassyui/glass-checkbox';
import {
  GlassDialog,
  GlassDialogContent,
  GlassDialogDescription,
  GlassDialogTitle,
  GlassDialogTrigger,
} from './glassyui/glass-dialog';
import { GlassInput } from './glassyui/glass-input';
import { GlassKbd, GlassKbdGroup } from './glassyui/glass-kbd';
import {
  GlassMenu,
  GlassMenuContent,
  GlassMenuItem,
  GlassMenuLabel,
  GlassMenuSeparator,
  GlassMenuTrigger,
} from './glassyui/glass-menu';
import { GlassPagination } from './glassyui/glass-pagination';
import { GlassPopover, GlassPopoverContent, GlassPopoverTrigger } from './glassyui/glass-popover';
import { GlassProgress } from './glassyui/glass-progress';
import { GlassRadioGroup, GlassRadioGroupItem } from './glassyui/glass-radio-group';
import { GlassSegmentedControl, GlassSegmentedControlItem } from './glassyui/glass-segmented-control';
import {
  GlassSelect,
  GlassSelectContent,
  GlassSelectItem,
  GlassSelectTrigger,
  GlassSelectValue,
} from './glassyui/glass-select';
import {
  GlassSheet,
  GlassSheetClose,
  GlassSheetContent,
  GlassSheetDescription,
  GlassSheetTitle,
  GlassSheetTrigger,
} from './glassyui/glass-sheet';
import { GlassSkeleton } from './glassyui/glass-skeleton';
import { GlassSpinner } from './glassyui/glass-spinner';
import { GlassSwitch } from './glassyui/glass-switch';
import { GlassTabs, GlassTabsContent, GlassTabsList, GlassTabsTrigger } from './glassyui/glass-tabs';
import { GlassTextarea } from './glassyui/glass-textarea';
import {
  GlassToast,
  GlassToastAction,
  GlassToastClose,
  GlassToastDescription,
  GlassToastTitle,
} from './glassyui/glass-toast';
import { GlassTooltip, GlassTooltipContent, GlassTooltipTrigger } from './glassyui/glass-tooltip';
import { useNoticeToast } from './notice-toast';
import { Page } from './page';
import { PageHeader } from './page-header';
import { ErrorView, NotFoundView, PageSkeleton } from './route-states';
import { Section } from './section';
import { Sparkline } from './sparkline';
import { StatCard } from './stat-card';
import { StatusPill, type StatusTone } from './status-pill';
import { FilterBar, ToolbarGroup, ToolbarSearch, ToolbarSpacer } from './toolbar';

/*
 * The kit gallery: every page primitive and the main GlassyUI controls in realistic
 * combinations, for visual review in both themes. The hub mounts it at /kit inside its
 * AppShell. All data here is made up.
 */

// ---------------------------------------------------------------------------
// Fake data

type JobStatus = 'completed' | 'scheduled' | 'overdue' | 'cancelled';

interface Job {
  id: string;
  branch: string;
  tech: string;
  service: string;
  jobs: number;
  revenue: number;
  status: JobStatus;
  updated: string;
}

const JOBS: Job[] = [
  { id: 'j1', branch: 'Toronto West', tech: 'Priya Natarajan', service: 'Duct cleaning', jobs: 42, revenue: 18420, status: 'completed', updated: '2 min ago' },
  { id: 'j2', branch: 'Ottawa', tech: 'Marc Tremblay', service: 'Furnace tune-up', jobs: 31, revenue: 12960, status: 'scheduled', updated: '8 min ago' },
  { id: 'j3', branch: 'Hamilton', tech: 'Aisha Mohamed', service: 'Dryer vent', jobs: 18, revenue: 5340, status: 'overdue', updated: '21 min ago' },
  { id: 'j4', branch: 'Mississauga', tech: 'Daniel Okafor', service: 'Duct cleaning', jobs: 37, revenue: 16110, status: 'completed', updated: '34 min ago' },
  { id: 'j5', branch: 'Barrie', tech: 'Sofia Rossi', service: 'Air purifier install', jobs: 9, revenue: 7420, status: 'scheduled', updated: '1 h ago' },
  { id: 'j6', branch: 'Kitchener', tech: 'Liam Chen', service: 'Furnace tune-up', jobs: 24, revenue: 9050, status: 'cancelled', updated: '1 h ago' },
  { id: 'j7', branch: 'London', tech: 'Emma Wilson', service: 'Duct cleaning', jobs: 28, revenue: 11870, status: 'completed', updated: '2 h ago' },
  { id: 'j8', branch: 'Oshawa', tech: 'Noah Singh', service: 'Dryer vent', jobs: 15, revenue: 4380, status: 'overdue', updated: '3 h ago' },
  { id: 'j9', branch: 'Toronto East', tech: 'Chloe Martin', service: 'UV light install', jobs: 12, revenue: 8640, status: 'scheduled', updated: '4 h ago' },
  { id: 'j10', branch: 'Burlington', tech: 'Arjun Mehta', service: 'Duct cleaning', jobs: 33, revenue: 14250, status: 'completed', updated: 'Yesterday' },
];

const STATUS: Record<JobStatus, { label: string; tone: StatusTone }> = {
  completed: { label: 'Completed', tone: 'success' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  overdue: { label: 'Overdue', tone: 'warning' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

const MONTHS = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

// Colour follows the entity: each branch keeps its slot in every chart.
const BRANCH_SERIES = [
  { name: 'Toronto', slot: 1, values: [52, 61, 58, 67, 72, 81] },
  { name: 'Ottawa', slot: 2, values: [38, 41, 47, 44, 52, 55] },
  { name: 'Hamilton', slot: 3, values: [21, 26, 24, 31, 29, 36] },
] as const;

const BRANCH_KEYS: ChartSeriesStyle[] = BRANCH_SERIES.map((series) => ({
  label: series.name,
  slot: series.slot,
}));

// Good/bad meaning takes a status tone, not a slot.
const CALL_KEYS: ChartSeriesStyle[] = [
  { label: 'Calls', slot: 1 },
  { label: 'Missed', tone: 'danger' },
];

const CALL_HOURS = [
  ['8am', 14, 1],
  ['9am', 31, 4],
  ['10am', 38, 3],
  ['11am', 34, 2],
  ['12pm', 22, 5],
  ['1pm', 27, 1],
  ['2pm', 36, 3],
  ['3pm', 29, 2],
  ['4pm', 24, 1],
  ['5pm', 11, 1],
] as const;

const JOB_KEYS: ChartSeriesStyle[] = [
  { label: 'Duct cleaning', slot: 1 },
  { label: 'Furnace tune-up', slot: 2 },
  { label: 'Dryer vent', slot: 3 },
];

const WEEKS = [
  { label: 'Sep 14', values: [28, 12, 6] },
  { label: 'Sep 21', values: [31, 10, 8] },
  { label: 'Sep 28', values: [26, 15, 7] },
  { label: 'Oct 5', values: [34, 18, 5] },
  { label: 'Oct 12', values: [38, 21, 9] },
  { label: 'Oct 19', values: [35, 24, 8] },
];

// Display names come with the data, in sentence case with acronyms intact; never raw keys
// dressed up with CSS `capitalize` ("Uv Lights").
const SERVICES = [
  { label: 'Duct cleaning', value: 61210, slot: 1 },
  { label: 'Furnace', value: 22010, slot: 2 },
  { label: 'Dryer vent', value: 9720, slot: 3 },
  { label: 'UV lights', value: 8640, slot: 4 },
  { label: 'Air purifiers', value: 7420, slot: 5 },
] as const;

const SERVICE_TOTAL = SERVICES.reduce((sum, service) => sum + service.value, 0);

const money = { format: (value: number) => formatCurrency(value) };
const integer = { format: (value: number) => formatInt(value) };
const thousands = (value: number) => (value === 0 ? '0' : `$${value}k`);
const compactMoney = (value: number) => formatCurrency(value, { compact: true });

// The error preview's stand-in for what Next hands error.tsx.
const PREVIEW_ERROR = Object.assign(new Error('Preview only'), { digest: '2417730921' });

// ---------------------------------------------------------------------------

const SECTIONS = [
  ['kpis', 'KPIs'],
  ['table', 'Table'],
  ['cards', 'Cards'],
  ['forms', 'Forms'],
  ['overlays', 'Overlays'],
  ['feedback', 'Feedback'],
  ['states', 'Page states'],
  ['charts', 'Charts'],
  ['tokens', 'Tokens'],
] as const;

export function KitGallery() {
  return (
    <Page>
      <PageHeader
        sticky
        icon={Sparkles}
        eyebrow="1CA Glass"
        title="Kit gallery"
        description="Every page primitive and the main GlassyUI controls with made-up data. Flip the theme to review light and dark."
        actions={<ThemeToggle showLabels />}
      >
        <nav aria-label="Gallery sections" className="-mb-1 flex gap-1.5 overflow-x-auto pb-1">
          {SECTIONS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="shrink-0 rounded-full border border-ca bg-ca-surface px-3 py-1 text-xs font-medium text-ca-muted transition-colors hover:bg-ca-surface-hover hover:text-ca-text motion-reduce:transition-none"
            >
              {label}
            </a>
          ))}
        </nav>
      </PageHeader>

      <KpiSection />
      <TableSection />
      <CardsSection />
      <FormsSection />
      <OverlaysSection />
      <FeedbackSection />
      <PageStatesSection />
      <ChartsSection />
      <TokensSection />
    </Page>
  );
}

// ---------------------------------------------------------------------------

function KpiSection() {
  const [loading, setLoading] = useState(false);

  return (
    <Section
      id="kpis"
      className="scroll-mt-20 md:scroll-mt-60"
      title="Overview"
      description="StatCard with deltas, hints, icons and sparklines. Missed calls going down is good news, so the delta is green; tone colours a figure only when it flags a problem (Missed > 0, Out of zone > 0), never a plain count."
      actions={
        <label className="flex items-center gap-2 text-sm text-ca-muted">
          <GlassSwitch size="sm" checked={loading} onCheckedChange={setLoading} />
          Loading
        </label>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          className="ca-enter"
          label="Revenue"
          value={money.format(184230)}
          delta={{ value: '+12.4%', trend: 'up', label: 'Up 12.4% on last month' }}
          hint="vs September"
          icon={DollarSign}
          loading={loading}
          sparkline={<Sparkline data={[42, 48, 45, 53, 51, 60, 58, 66]} className="h-full text-ca-chart-1" />}
        />
        <StatCard
          className="ca-enter [--ca-enter-delay:60ms]"
          label="Jobs completed"
          value={integer.format(1284)}
          delta={{ value: '+3.1%', trend: 'up' }}
          hint="vs September"
          icon={Wrench}
          loading={loading}
          sparkline={<Sparkline data={[30, 31, 29, 33, 34, 33, 36, 37]} className="h-full text-ca-chart-3" />}
        />
        <StatCard
          className="ca-enter [--ca-enter-delay:120ms]"
          label="Missed calls"
          value="37"
          tone="danger"
          delta={{ value: '−8.2%', trend: 'down', good: 'down', label: 'Down 8.2% on last month' }}
          hint="of 2,318 calls"
          icon={PhoneMissed}
          loading={loading}
          sparkline={<Sparkline data={[9, 7, 8, 6, 7, 5, 6, 4]} className="h-full text-ca-success" />}
        />
        <StatCard
          className="ca-enter [--ca-enter-delay:180ms]"
          variant="solid"
          label="Average ticket"
          value={money.format(412)}
          delta={{ value: '0.0%', trend: 'flat' }}
          hint="solid variant"
          icon={Users}
          loading={loading}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Out of zone"
          value="2"
          tone="warning"
          hint="of 48 punches today"
          icon={MapPinOff}
          loading={loading}
        />
        <StatCard
          label="Failed uploads"
          value="3"
          tone="danger"
          hint="in the last 24 hours"
          icon={CloudAlert}
          loading={loading}
        />
        <StatCard
          label="Flagged shifts"
          value="0"
          hint="Zero needs no colour"
          icon={Flag}
          loading={loading}
        />
        <StatCard
          label="On shift"
          value={formatInt(14)}
          hint="A plain count stays neutral"
          icon={Users}
          loading={loading}
        />
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------

type SortKey = 'branch' | 'jobs' | 'revenue';
const PAGE_SIZE = 6;

function TableSection() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | JobStatus>('all');
  const [density, setDensity] = useState<TableDensity>('comfortable');
  const [sort, setSort] = useState<{ key: SortKey; dir: Exclude<SortDirection, 'none'> }>({
    key: 'revenue',
    dir: 'desc',
  });
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(['j2']));
  const [page, setPage] = useState(1);
  const [toastOpen, setToastOpen] = useState(false);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = JOBS.filter(
      (job) =>
        (status === 'all' || job.status === status) &&
        (!needle || `${job.branch} ${job.tech} ${job.service}`.toLowerCase().includes(needle)),
    );
    const sign = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) =>
      sort.key === 'branch' ? a.branch.localeCompare(b.branch) * sign : (a[sort.key] - b[sort.key]) * sign,
    );
  }, [query, sort, status]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const allSelected = visible.length > 0 && visible.every((row) => selected.has(row.id));
  const someSelected = visible.some((row) => selected.has(row.id));

  const sortFor = (key: SortKey): SortDirection => (sort.key === key ? sort.dir : 'none');
  const sortBy = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'branch' ? 'asc' : 'desc' },
    );

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const totals = visible.reduce(
    (sum, row) => ({ jobs: sum.jobs + row.jobs, revenue: sum.revenue + row.revenue }),
    { jobs: 0, revenue: 0 },
  );

  return (
    <Section
      id="table"
      className="scroll-mt-20 md:scroll-mt-60"
      title="Jobs by branch"
      description="FilterBar over a Table: search, select, density, sortable headers, selection, sticky header, empty state and pagination."
    >
      <FilterBar>
        <ToolbarSearch
          placeholder="Search branch, tech or service"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
        <ToolbarGroup>
          <GlassSelect
            value={status}
            onValueChange={(value) => {
              setStatus(value as 'all' | JobStatus);
              setPage(1);
            }}
          >
            <GlassSelectTrigger aria-label="Status" className="ca-control-sm w-40">
              <GlassSelectValue />
            </GlassSelectTrigger>
            <GlassSelectContent>
              <GlassSelectItem value="all">All statuses</GlassSelectItem>
              {(Object.keys(STATUS) as JobStatus[]).map((key) => (
                <GlassSelectItem key={key} value={key}>
                  {STATUS[key].label}
                </GlassSelectItem>
              ))}
            </GlassSelectContent>
          </GlassSelect>
          <GlassSegmentedControl
            aria-label="Row density"
            className="ca-control-sm"
            value={density}
            onValueChange={(value) => setDensity(value as TableDensity)}
          >
            <GlassSegmentedControlItem value="comfortable">Comfortable</GlassSegmentedControlItem>
            <GlassSegmentedControlItem value="compact">Compact</GlassSegmentedControlItem>
          </GlassSegmentedControl>
        </ToolbarGroup>
        <ToolbarSpacer />
        <ToolbarGroup>
          <GlassButton
            variant="soft"
            size="sm"
            className="ca-control-sm"
            onClick={() => setToastOpen(true)}
          >
            <Download aria-hidden className="size-4" />
            Export
          </GlassButton>
          <GlassButton variant="prominent" size="sm" className="ca-control-sm">
            <Plus aria-hidden className="size-4" />
            New job
          </GlassButton>
        </ToolbarGroup>
      </FilterBar>

      <Table density={density} stickyHeader maxHeight="26rem" label="Jobs by branch">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 pr-0">
              <GlassCheckbox
                size="sm"
                aria-label="Select all rows on this page"
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={(on) => visible.forEach((row) => toggle(row.id, on === true))}
              />
            </TableHead>
            <TableHead sort={sortFor('branch')} onSort={() => sortBy('branch')}>
              Branch
            </TableHead>
            <TableHead className="hidden md:table-cell">Technician</TableHead>
            <TableHead>Status</TableHead>
            <TableHead numeric sort={sortFor('jobs')} onSort={() => sortBy('jobs')}>
              Jobs
            </TableHead>
            <TableHead numeric sort={sortFor('revenue')} onSort={() => sortBy('revenue')}>
              Revenue
            </TableHead>
            <TableHead className="hidden lg:table-cell">Updated</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 ? (
            <TableEmpty
              colSpan={8}
              icon={SearchX}
              title="No jobs match"
              description="Try another search or status."
              action={
                <GlassButton
                  size="sm"
                  variant="soft"
                  className="ca-control-sm"
                  onClick={() => {
                    setQuery('');
                    setStatus('all');
                  }}
                >
                  Clear filters
                </GlassButton>
              }
            />
          ) : (
            visible.map((job) => (
              <TableRow key={job.id} selected={selected.has(job.id)}>
                <TableCell className="w-10 pr-0">
                  <GlassCheckbox
                    size="sm"
                    aria-label={`Select ${job.branch}`}
                    checked={selected.has(job.id)}
                    onCheckedChange={(on) => toggle(job.id, on === true)}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{job.branch}</div>
                  <div className="text-xs text-ca-muted">{job.service}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="flex items-center gap-2">
                    <GlassAvatar name={job.tech} size="xs" />
                    {job.tech}
                  </span>
                </TableCell>
                <TableCell>
                  {/* Waiting and settled states never pulse; only something happening right now does. */}
                  <StatusPill tone={STATUS[job.status].tone}>{STATUS[job.status].label}</StatusPill>
                </TableCell>
                <TableCell numeric>{integer.format(job.jobs)}</TableCell>
                <TableCell numeric className="font-medium">
                  {money.format(job.revenue)}
                </TableCell>
                <TableCell muted className="hidden whitespace-nowrap lg:table-cell">
                  {job.updated}
                </TableCell>
                <TableCell align="right">
                  <RowMenu name={job.branch} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {visible.length > 0 ? (
          <TableFooter>
            <TableRow>
              <TableCell />
              <TableCell>Page total</TableCell>
              <TableCell className="hidden md:table-cell" />
              <TableCell />
              <TableCell numeric>{integer.format(totals.jobs)}</TableCell>
              <TableCell numeric>{money.format(totals.revenue)}</TableCell>
              <TableCell className="hidden lg:table-cell" />
              <TableCell />
            </TableRow>
          </TableFooter>
        ) : null}
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-ca-muted">
        <span className="tabular-nums">
          {selected.size} selected · {rows.length} {rows.length === 1 ? 'job' : 'jobs'}
        </span>
        <GlassPagination page={current} pageCount={pageCount} onPageChange={setPage} />
      </div>

      <GlassToast open={toastOpen} onOpenChange={setToastOpen} duration={5000}>
        <GlassToastTitle>Export started</GlassToastTitle>
        <GlassToastDescription>
          {rows.length} jobs will download as a CSV in a moment.
        </GlassToastDescription>
        <GlassToastAction altText="Cancel the export from the Downloads menu">Cancel</GlassToastAction>
        <GlassToastClose />
      </GlassToast>
    </Section>
  );
}

function RowMenu({ name }: { name: string }) {
  return (
    <GlassMenu>
      <GlassMenuTrigger asChild>
        <GlassButton variant="ghost" size="sm" className="size-8 p-0" aria-label={`Actions for ${name}`}>
          <Ellipsis aria-hidden className="size-4" />
        </GlassButton>
      </GlassMenuTrigger>
      <GlassMenuContent align="end">
        <GlassMenuLabel>{name}</GlassMenuLabel>
        <GlassMenuItem>Open job</GlassMenuItem>
        <GlassMenuItem>Reassign technician</GlassMenuItem>
        <GlassMenuSeparator />
        <GlassMenuItem tone="destructive">Cancel job</GlassMenuItem>
      </GlassMenuContent>
    </GlassMenu>
  );
}

// ---------------------------------------------------------------------------

function CardsSection() {
  return (
    <Section
      id="cards"
      className="scroll-mt-20 md:scroll-mt-60"
      title="Cards"
      description="Glass for summaries, solid for data, sunken for wells. A card with href is one big link and lifts on hover."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader actions={<StatusPill tone="success">Live</StatusPill>}>
            <CardTitle>Glass card</CardTitle>
            <CardDescription>The default: frosted, for short content.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            Calls are flowing from 14 branches. The last webhook arrived 12 seconds ago.
          </CardContent>
          <CardFooter divided>
            <RefreshCw aria-hidden className="size-3.5" /> Updated just now
          </CardFooter>
        </Card>

        <Card variant="solid">
          <CardHeader divided>
            <CardTitle>Solid card</CardTitle>
            <CardDescription>Opaque, for dense data.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-ca text-sm">
              {JOBS.slice(0, 4).map((job) => (
                <li key={job.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="truncate">{job.branch}</span>
                  <span className="tabular-nums text-ca-muted">{money.format(job.revenue)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card variant="sunken">
          <CardHeader>
            <CardTitle>Sunken card</CardTitle>
            <CardDescription>A recessed well inside another surface.</CardDescription>
          </CardHeader>
          <CardContent>
            <GlassProgress label="Monthly target" value={72} showValue size="sm" />
          </CardContent>
        </Card>

        <Card href="#cards" className="h-full">
          <CardHeader>
            <span className="mb-1 grid size-10 place-items-center rounded-xl bg-ca-accent-soft text-ca-accent">
              <LayoutGrid aria-hidden className="size-5" />
            </span>
            <CardTitle>Linked card</CardTitle>
            <CardDescription>Hover or tab to it: it lifts and picks up an accent rim.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card variant="solid" className="overflow-hidden pb-0">
        <CardHeader>
          <CardTitle>Table in a card</CardTitle>
          <CardDescription>
            Card variant=&quot;solid&quot; with overflow-hidden pb-0, CardContent flush and Table
            surface=&quot;none&quot;: the outer columns line up with this header.
          </CardDescription>
        </CardHeader>
        <CardContent flush>
          <Table surface="none" label="Busiest branches">
            <TableHeader>
              <TableRow>
                <TableHead>Branch</TableHead>
                <TableHead numeric>Jobs</TableHead>
                <TableHead numeric className="hidden sm:table-cell">
                  Share
                </TableHead>
                <TableHead align="right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {JOBS.slice(0, 4).map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.branch}</TableCell>
                  <TableCell numeric>{integer.format(job.jobs)}</TableCell>
                  <TableCell numeric className="hidden sm:table-cell">
                    <span className="inline-flex items-center justify-end gap-2">
                      <MiniBar value={job.jobs / 42} slot={1} />
                      <span className="w-10 text-xs text-ca-muted">{formatPercent(job.jobs / 158, 0)}</span>
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    <GlassButton size="sm" variant="ghost" className="ca-control-sm">
                      Open
                    </GlassButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Section>
  );
}

// ---------------------------------------------------------------------------

function FormsSection() {
  const [email, setEmail] = useState('ops@1cleanair');
  const emailError = email.includes('.') ? undefined : 'Enter a full address, like name@1cleanair.ca.';

  return (
    <Section
      id="forms"
      className="scroll-mt-20 md:scroll-mt-60"
      title="Forms"
      description="Field wires the label, hint, error and required marker to any control."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Report settings</CardTitle>
            <CardDescription>Stacked fields on glass.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field label="Report name" required hint="Shown at the top of the email.">
              <GlassInput className="ca-control-sm" defaultValue="Weekly branch summary" />
            </Field>
            <Field label="Send to" required error={emailError}>
              <GlassInput
                type="email"
                className="ca-control-sm"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label="Branch">
              {(control) => (
                <GlassSelect defaultValue="all">
                  <GlassSelectTrigger {...control} className="ca-control-sm">
                    <GlassSelectValue />
                  </GlassSelectTrigger>
                  <GlassSelectContent>
                    <GlassSelectItem value="all">All branches</GlassSelectItem>
                    <GlassSelectItem value="toronto">Toronto</GlassSelectItem>
                    <GlassSelectItem value="ottawa">Ottawa</GlassSelectItem>
                    <GlassSelectItem value="hamilton">Hamilton</GlassSelectItem>
                  </GlassSelectContent>
                </GlassSelect>
              )}
            </Field>
            <Field label="Notes" optional>
              <GlassTextarea autoResize rows={2} className="ca-control-sm" placeholder="Anything the team should know" />
            </Field>
          </CardContent>
          <CardFooter divided className="justify-end">
            <GlassButton variant="ghost" size="sm" className="ca-control-sm">
              Cancel
            </GlassButton>
            <GlassButton variant="prominent" size="sm" className="ca-control-sm">
              Save
            </GlassButton>
          </CardFooter>
        </Card>

        <Card variant="solid">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Inline fields, checkboxes and radios on a solid card.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Field layout="inline" label="Missed-call alerts" hint="Post to the branch's Slack channel.">
              <GlassSwitch defaultChecked />
            </Field>
            <Field layout="inline" label="Daily digest" hint="A summary at 7:00 every morning.">
              <GlassSwitch />
            </Field>
            <GlassCheckbox
              defaultChecked
              label="Include cancelled jobs"
              description="Counted separately from completed work."
            />
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">Week starts on</legend>
              <GlassRadioGroup defaultValue="monday" className="flex flex-col gap-2">
                <GlassRadioGroupItem value="sunday" label="Sunday" />
                <GlassRadioGroupItem value="monday" label="Monday" />
              </GlassRadioGroup>
            </fieldset>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------

function OverlaysSection() {
  return (
    <Section
      id="overlays"
      className="scroll-mt-20 md:scroll-mt-60"
      title="Overlays"
      description="Dialog, destructive confirmation, sheet, menu, popover, tooltip and tabs. Overlay titles are text-lg; action rows sit right, Cancel (ghost) first and the main action last."
    >
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3">
          <InviteDialog />
          <ConfirmDeleteDialog />

          <GlassSheet>
            <GlassSheetTrigger asChild>
              <GlassButton size="sm" variant="soft" className="ca-control-sm">
                <Filter aria-hidden className="size-4" />
                Open sheet
              </GlassButton>
            </GlassSheetTrigger>
            <GlassSheetContent side="right" className="flex flex-col gap-4">
              <GlassSheetTitle className="text-lg font-semibold tracking-tight">Filters</GlassSheetTitle>
              <GlassSheetDescription className="text-sm text-ca-muted">
                Sheets slide in from any edge; phones get the bottom one.
              </GlassSheetDescription>
              <Field label="Date range">
                {(control) => (
                  <GlassSelect defaultValue="30">
                    <GlassSelectTrigger {...control} className="ca-control-sm">
                      <GlassSelectValue />
                    </GlassSelectTrigger>
                    <GlassSelectContent>
                      <GlassSelectItem value="7">Last 7 days</GlassSelectItem>
                      <GlassSelectItem value="30">Last 30 days</GlassSelectItem>
                      <GlassSelectItem value="90">Last 90 days</GlassSelectItem>
                    </GlassSelectContent>
                  </GlassSelect>
                )}
              </Field>
              <div className="mt-auto flex flex-wrap justify-end gap-2 pt-2">
                <GlassSheetClose asChild>
                  <GlassButton size="sm" variant="ghost" className="ca-control-sm">
                    Cancel
                  </GlassButton>
                </GlassSheetClose>
                <GlassSheetClose asChild>
                  <GlassButton size="sm" variant="prominent" className="ca-control-sm">
                    Apply
                  </GlassButton>
                </GlassSheetClose>
              </div>
            </GlassSheetContent>
          </GlassSheet>

          <RowMenu name="Toronto West" />

          <GlassPopover>
            <GlassPopoverTrigger asChild>
              <GlassButton size="sm" variant="soft" className="ca-control-sm">
                <CalendarDays aria-hidden className="size-4" />
                Popover
              </GlassButton>
            </GlassPopoverTrigger>
            <GlassPopoverContent className="w-64 text-sm">
              <p className="font-medium">October 2026</p>
              <p className="mt-1 text-ca-muted">Popovers hold small forms and pickers.</p>
            </GlassPopoverContent>
          </GlassPopover>

          <GlassTooltip>
            <GlassTooltipTrigger asChild>
              <GlassButton size="sm" variant="ghost" className="ca-control-sm" aria-label="Notifications">
                <Bell aria-hidden className="size-4" />
              </GlassButton>
            </GlassTooltipTrigger>
            <GlassTooltipContent>3 new alerts</GlassTooltipContent>
          </GlassTooltip>

          <GlassKbdGroup className="ms-auto text-ca-muted">
            <GlassKbd>Ctrl</GlassKbd>
            <GlassKbd>K</GlassKbd>
          </GlassKbdGroup>
        </CardContent>
      </Card>

      <GlassTabs defaultValue="summary">
        <GlassTabsList aria-label="Report views" className="max-w-md">
          <GlassTabsTrigger value="summary">Summary</GlassTabsTrigger>
          <GlassTabsTrigger value="branches">Branches</GlassTabsTrigger>
          <GlassTabsTrigger value="technicians">Technicians</GlassTabsTrigger>
        </GlassTabsList>
        <GlassTabsContent value="summary" className="mt-3 text-sm">
          Tabs switch views in place. For pages, use the AppShell sidebar instead.
        </GlassTabsContent>
        <GlassTabsContent value="branches" className="mt-3 text-sm">
          14 branches reported today.
        </GlassTabsContent>
        <GlassTabsContent value="technicians" className="mt-3 text-sm">
          <GlassAvatarGroup max={4} size="sm">
            {JOBS.slice(0, 7).map((job) => (
              <GlassAvatar key={job.id} name={job.tech} />
            ))}
          </GlassAvatarGroup>
        </GlassTabsContent>
      </GlassTabs>
    </Section>
  );
}

function InviteDialog() {
  const [open, setOpen] = useState(false);

  return (
    <GlassDialog open={open} onOpenChange={setOpen}>
      <GlassDialogTrigger asChild>
        <GlassButton size="sm" variant="prominent" className="ca-control-sm">
          Open dialog
        </GlassButton>
      </GlassDialogTrigger>
      <GlassDialogContent className="w-[min(28rem,calc(100vw-2rem))]">
        <GlassDialogTitle className="text-lg font-semibold tracking-tight">Invite a teammate</GlassDialogTitle>
        <GlassDialogDescription className="mt-1 text-sm text-ca-muted">
          They sign in with the shared 1CleanAir login.
        </GlassDialogDescription>
        <div className="mt-5 flex flex-col gap-4">
          <Field label="Email" required>
            <GlassInput type="email" className="ca-control-sm" placeholder="name@1cleanair.ca" />
          </Field>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <GlassButton size="sm" variant="ghost" className="ca-control-sm" onClick={() => setOpen(false)}>
            Cancel
          </GlassButton>
          <GlassButton size="sm" variant="prominent" className="ca-control-sm" onClick={() => setOpen(false)}>
            Send invite
          </GlassButton>
        </div>
      </GlassDialogContent>
    </GlassDialog>
  );
}

/** A destructive confirmation: what replaces window.confirm(), behind the same gate. */
function ConfirmDeleteDialog() {
  const [open, setOpen] = useState(false);

  return (
    <GlassDialog open={open} onOpenChange={setOpen}>
      <GlassDialogTrigger asChild>
        <GlassButton size="sm" variant="soft" className="ca-control-sm text-ca-danger">
          <Trash2 aria-hidden className="size-4" />
          Delete role
        </GlassButton>
      </GlassDialogTrigger>
      <GlassDialogContent className="w-[min(28rem,calc(100vw-2rem))]">
        <GlassDialogTitle className="text-lg font-semibold tracking-tight">
          Delete “Dispatch”?
        </GlassDialogTitle>
        <GlassDialogDescription className="mt-1 text-sm text-ca-muted">
          4 people lose the access this role gives them. This can&rsquo;t be undone.
        </GlassDialogDescription>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <GlassButton size="sm" variant="ghost" className="ca-control-sm" onClick={() => setOpen(false)}>
            Keep it
          </GlassButton>
          <GlassButton
            size="sm"
            variant="soft"
            className="ca-control-sm text-ca-danger"
            onClick={() => setOpen(false)}
          >
            Delete role
          </GlassButton>
        </div>
      </GlassDialogContent>
    </GlassDialog>
  );
}

// ---------------------------------------------------------------------------

function FeedbackSection() {
  const [showAlert, setShowAlert] = useState(true);
  const [failed, setFailed] = useState(false);
  // The kit's success toast: a tick, four seconds, its text kept while it slides away.
  const { notify, toast } = useNoticeToast();

  const say = (message: string) => {
    setFailed(false);
    notify(message);
  };

  return (
    <Section
      id="feedback"
      className="scroll-mt-20 md:scroll-mt-60"
      title="Feedback"
      description="Status pills, alerts, progress, loading and empty states. A success is a passing toast, a failure an inline danger alert, and a destructive action asks in a dialog (see Overlays)."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>
              Every status is a StatusPill with a human label. Live states are success with a pulse;
              counts and role chips drop the dot.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <StatusPill tone="success" pulse>
                Live
              </StatusPill>
              <StatusPill tone="neutral">Draft</StatusPill>
              <StatusPill tone="info">Scheduled</StatusPill>
              <StatusPill tone="success">Completed</StatusPill>
              <StatusPill tone="warning">Overdue</StatusPill>
              <StatusPill tone="danger">Failed</StatusPill>
              <StatusPill tone="success" size="md" pulse>
                On shift
              </StatusPill>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill dot={false}>12 people</StatusPill>
              <StatusPill dot={false} tone="info">
                Admin
              </StatusPill>
              <StatusPill dot={false} tone="danger">
                3 missed
              </StatusPill>
            </div>
            <GlassProgress label="Uploading 3 of 5 videos" value={60} showValue />
            <GlassProgress label="Syncing ServiceMonster" />
            <div className="flex items-center gap-3 text-sm text-ca-muted">
              <GlassSpinner size="sm" label="Refreshing" /> Refreshing…
            </div>
            <div aria-busy className="flex items-center gap-3">
              <GlassSkeleton variant="circle" className="size-10" />
              <div className="flex-1">
                <GlassSkeleton variant="text" lines={2} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Saving</CardTitle>
              <CardDescription>
                Success floats in as a toast for four seconds; a failure stays as a danger alert
                until it is dismissed or the save works.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {failed ? (
                <GlassAlert tone="danger" title="Couldn&rsquo;t save the report" onDismiss={() => setFailed(false)}>
                  The server didn&rsquo;t answer. Your changes are still here, so try again.
                </GlassAlert>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <GlassButton
                  size="sm"
                  variant="prominent"
                  className="ca-control-sm"
                  onClick={() => say('Report settings saved')}
                >
                  Save
                </GlassButton>
                <GlassButton
                  size="sm"
                  variant="soft"
                  className="ca-control-sm"
                  onClick={() => setFailed(true)}
                >
                  Try a failing save
                </GlassButton>
              </div>
            </CardContent>
          </Card>
          {showAlert ? (
            <GlassAlert key="info" tone="info" title="New this week" onDismiss={() => setShowAlert(false)}>
              Every app now shares one theme. Dismiss me.
            </GlassAlert>
          ) : null}
          <GlassAlert tone="success" title="Sync finished">
            2,318 calls imported in 14 seconds.
          </GlassAlert>
          <GlassAlert tone="warning" title="Webhook slow">
            RingCentral took 9 seconds to answer.
          </GlassAlert>
          <GlassAlert tone="danger" title="Upload failed">
            The video is over the 2 GB limit.
          </GlassAlert>
          <Card variant="solid" className="py-0">
            <EmptyState
              icon={Inbox}
              title="No posts scheduled"
              description="Upload a video and pick a time; it shows up here."
              action={
                <GlassButton size="sm" variant="prominent" className="ca-control-sm">
                  <Plus aria-hidden className="size-4" />
                  Schedule a post
                </GlassButton>
              }
            />
          </Card>
        </div>
      </div>

      {/* Confirmations float in and clear after four seconds. */}
      {toast}
    </Section>
  );
}

// ---------------------------------------------------------------------------

function PageStatesSection() {
  const [retried, setRetried] = useState(false);

  return (
    <Section
      id="states"
      className="scroll-mt-20 md:scroll-mt-60"
      title="Page states"
      description="What every app's not-found.tsx, error.tsx and loading.tsx render, from @1ca/ui/components/route-states. Inside the shell they take the shell's app and home; a root not-found.tsx centres itself and adds the app's tile."
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <StatePreview label="not-found.tsx · NotFoundView">
          <NotFoundView />
        </StatePreview>
        <StatePreview label="error.tsx · ErrorView">
          <ErrorView error={PREVIEW_ERROR} reset={() => setRetried(true)} retry={() => setRetried(true)} />
        </StatePreview>
        <StatePreview label="loading.tsx · PageSkeleton">
          <PageSkeleton filters stats={2} rows={3} label="Loading the preview" />
        </StatePreview>
      </div>
      <GlassToast open={retried} onOpenChange={setRetried} duration={4000}>
        <GlassToastTitle>Try again ran</GlassToastTitle>
        <GlassToastDescription>In an app it re-fetches the page that failed.</GlassToastDescription>
        <GlassToastClose />
      </GlassToast>
    </Section>
  );
}

function StatePreview({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="m-0 flex min-w-0 flex-col gap-2">
      <figcaption className="font-ca-mono text-xs text-ca-muted">{label}</figcaption>
      <div className="max-h-[36rem] overflow-hidden rounded-2xl border border-dashed border-ca-border-strong bg-ca-bg">
        {children}
      </div>
    </figure>
  );
}

// ---------------------------------------------------------------------------

function ChartsSection() {
  return (
    <Section
      id="charts"
      className="scroll-mt-20 md:scroll-mt-60"
      title="Charts"
      description="@1ca/ui/components/charts on solid cards: --ca-chart-1…8 in a fixed order per entity, a y grid with tick labels, 12px text in text tokens, a status tone for good/bad, and a table view."
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <Card variant="solid" className="xl:col-span-2">
          <CardHeader actions={<ChartLegend items={BRANCH_KEYS} />}>
            <CardTitle>Revenue by branch</CardTitle>
            <CardDescription>Grouped BarChart · thousands of dollars, last six months</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              ariaLabel="Monthly revenue for Toronto, Ottawa and Hamilton, May to October. Toronto leads every month."
              series={BRANCH_KEYS}
              format={thousands}
              xLabel="Month"
              tableLabel="Revenue by branch, thousands"
              data={MONTHS.map((month, index) => ({
                label: month,
                values: BRANCH_SERIES.map((series) => series.values[index]),
              }))}
            />
          </CardContent>
        </Card>

        <Card variant="solid">
          <CardHeader>
            <CardTitle>Revenue split</CardTitle>
            <CardDescription>DonutChart · October; legend rows carry the links</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              ariaLabel="October revenue by branch"
              centerLabel="Total"
              centerValue={compactMoney(172000)}
              slices={BRANCH_SERIES.map((series) => ({
                label: series.name,
                value: series.values[5] * 1000,
                slot: series.slot,
                href: '#charts',
              }))}
            />
          </CardContent>
        </Card>

        <Card variant="solid" className="xl:col-span-2">
          <CardHeader actions={<ChartLegend items={CALL_KEYS} />}>
            <CardTitle>Calls by hour</CardTitle>
            <CardDescription>Overlay BarChart · missed calls in the danger tone over all calls</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              ariaLabel="Calls by hour today: 266 calls, 23 missed."
              variant="overlay"
              series={CALL_KEYS}
              format={formatInt}
              height={200}
              xLabel="Hour"
              tableLabel="Calls by hour"
              data={CALL_HOURS.map(([label, total, missed]) => ({ label, values: [total, missed] }))}
            />
          </CardContent>
        </Card>

        <Card variant="solid">
          <CardHeader>
            <CardTitle>Revenue by service</CardTitle>
            <CardDescription>BarList · every value printed</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              ariaLabel="Revenue by service this month"
              format={compactMoney}
              data={SERVICES.map((service) => ({ ...service }))}
            />
          </CardContent>
        </Card>

        <Card variant="solid" className="xl:col-span-2">
          <CardHeader actions={<ChartLegend items={BRANCH_KEYS} />}>
            <CardTitle>Monthly revenue</CardTitle>
            <CardDescription>AreaChart · hover a month, or open the table</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaChart
              ariaLabel="Monthly revenue by branch, May to October, rising in every branch."
              height={240}
              format={compactMoney}
              valueFormat={money.format}
              tableLabel="Monthly revenue by branch"
              series={BRANCH_SERIES.map((series) => ({
                label: series.name,
                slot: series.slot,
                points: MONTHS.map((month, index) => ({ x: month, y: series.values[index] * 1000 })),
              }))}
            />
          </CardContent>
        </Card>

        <Card variant="solid">
          <CardHeader>
            <CardTitle>Jobs by week</CardTitle>
            <CardDescription>Stacked BarChart · totals printed on top</CardDescription>
            <ChartLegend items={JOB_KEYS} className="pt-1" />
          </CardHeader>
          <CardContent>
            <BarChart
              ariaLabel="Jobs by week and service, last six weeks, rising."
              variant="stacked"
              series={JOB_KEYS}
              format={formatInt}
              height={200}
              xLabel="Week"
              tableLabel="Jobs by week"
              data={WEEKS}
            />
          </CardContent>
        </Card>

        <Card variant="solid" className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Share of revenue</CardTitle>
            <CardDescription>RingGauge per service, and MiniBar for table cells</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-5">
              {SERVICES.map((service, index) => (
                <li key={service.label}>
                  <RingGauge
                    value={service.value}
                    total={SERVICE_TOTAL}
                    label={service.label}
                    centerLabel={formatPercent(service.value / SERVICE_TOTAL, 0)}
                    slot={service.slot}
                    delay={index * 60}
                  />
                </li>
              ))}
            </ul>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span>Toronto West utilization</span>
                <span className="inline-flex items-center gap-3 tabular-nums">
                  <MiniBar value={0.82} />
                  {formatPercent(0.82, 0)}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Hamilton miss rate, over the 30% target</span>
                <span className="inline-flex items-center gap-3 tabular-nums">
                  <MiniBar value={0.34} tone="danger" />
                  {formatPercent(0.34, 0)}
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card variant="solid">
          <CardHeader>
            <CardTitle>Series palette</CardTitle>
            <CardDescription>Assign in order; never cycle. A ninth series is “Other”.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-2 text-xs">
              {chartColors().map((color, index) => (
                <li key={color} className="flex items-center gap-2">
                  <span aria-hidden className="h-4 w-6 rounded-[4px]" style={{ backgroundColor: color }} />
                  <span className="font-ca-mono text-ca-muted">--ca-chart-{index + 1}</span>
                </li>
              ))}
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-4 w-6 rounded-[4px] bg-ca-chart-other" />
                <span className="font-ca-mono text-ca-muted">other</span>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-4 w-6 rounded-[4px] border-t-2 border-ca-chart-axis bg-ca-chart-grid" />
                <span className="font-ca-mono text-ca-muted">grid / axis</span>
              </li>
            </ul>
            <div className="mt-4 flex flex-col gap-3">
              {BRANCH_SERIES.map((series) => (
                <div key={series.name} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-sm">{series.name}</span>
                  <Sparkline
                    data={series.values}
                    className="h-8 flex-1"
                    color={chartColor(series.slot)}
                    label={`${series.name} revenue trend, rising`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------

const SURFACES: Array<[string, string]> = [
  ['--ca-bg', 'bg-ca-bg'],
  ['--ca-surface', 'bg-ca-surface'],
  ['--ca-surface-solid', 'bg-ca-surface-solid'],
  ['--ca-surface-sunken', 'bg-ca-surface-sunken'],
  ['--ca-accent', 'bg-ca-accent'],
  ['--ca-accent-soft', 'bg-ca-accent-soft'],
  ['--ca-success', 'bg-ca-success'],
  ['--ca-warning', 'bg-ca-warning'],
  ['--ca-danger', 'bg-ca-danger'],
  ['--ca-row-selected', 'bg-ca-row-selected'],
];

function TokensSection() {
  return (
    <Section
      id="tokens"
      className="scroll-mt-20 md:scroll-mt-60"
      title="Tokens and type"
      description="The --ca-* palette for the current theme, and the type scale."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SURFACES.map(([token, className]) => (
                <li key={token} className="flex flex-col gap-1.5">
                  <span aria-hidden className={cn('h-10 rounded-lg border border-ca', className)} />
                  <span className="font-ca-mono text-xs text-ca-muted">{token}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-3">
            <TypeSample label="Page title · text-2xl semibold">
              <span className="text-2xl font-semibold tracking-tight">Sales overview</span>
            </TypeSample>
            <TypeSample label="Section title · text-sm semibold">
              <span className="text-sm font-semibold">This month</span>
            </TypeSample>
            <TypeSample label="Body · text-sm">
              <span className="text-sm">Calls are flowing from every branch.</span>
            </TypeSample>
            <TypeSample label="Muted · text-ca-muted">
              <span className="text-sm text-ca-muted">Updated 2 minutes ago</span>
            </TypeSample>
            <TypeSample label="Numbers · tabular-nums">
              <span className="text-sm tabular-nums">$184,230 · 1,284 · 37</span>
            </TypeSample>
            <TypeSample label="Inline code · .ca-code">
              <span className="text-sm">
                Set <code className="ca-code">NEXT_PUBLIC_SUPPORT_EMAIL</code> in each app.
              </span>
            </TypeSample>
            <TypeSample label="Inline link · .ca-link">
              <span className="text-sm">
                Questions about a figure?{' '}
                <a href="#tokens" className="ca-link">
                  Contact support
                </a>
                .
              </span>
            </TypeSample>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}

function TypeSample({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-ca pb-3 last:border-b-0 last:pb-0">
      <span className="font-ca-mono text-xs text-ca-muted">{label}</span>
      {children}
    </div>
  );
}
