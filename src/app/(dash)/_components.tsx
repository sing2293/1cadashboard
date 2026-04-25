export const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtMoneyCompact = (n: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);

export const fmtInt = (n: number) => new Intl.NumberFormat("en-CA").format(n);

export const fmtPct = (n: number, decimals = 1) =>
  `${(n * 100).toFixed(decimals)}%`;

export type Tone =
  | "emerald"
  | "indigo"
  | "sky"
  | "violet"
  | "rose"
  | "amber"
  | "teal"
  | "fuchsia"
  | "zinc";

const TONE: Record<
  Tone,
  { stripe: string; text: string; bg: string; bar: string; barTo: string }
> = {
  emerald: {
    stripe: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "from-emerald-50/60 dark:from-emerald-500/10",
    bar: "#10b981",
    barTo: "#34d399",
  },
  indigo: {
    stripe: "bg-indigo-500",
    text: "text-indigo-600 dark:text-indigo-400",
    bg: "from-indigo-50/60 dark:from-indigo-500/10",
    bar: "#6366f1",
    barTo: "#818cf8",
  },
  sky: {
    stripe: "bg-sky-500",
    text: "text-sky-600 dark:text-sky-400",
    bg: "from-sky-50/60 dark:from-sky-500/10",
    bar: "#0ea5e9",
    barTo: "#38bdf8",
  },
  violet: {
    stripe: "bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
    bg: "from-violet-50/60 dark:from-violet-500/10",
    bar: "#8b5cf6",
    barTo: "#a78bfa",
  },
  rose: {
    stripe: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    bg: "from-rose-50/60 dark:from-rose-500/10",
    bar: "#f43f5e",
    barTo: "#fb7185",
  },
  amber: {
    stripe: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    bg: "from-amber-50/60 dark:from-amber-500/10",
    bar: "#f59e0b",
    barTo: "#fbbf24",
  },
  teal: {
    stripe: "bg-teal-500",
    text: "text-teal-600 dark:text-teal-400",
    bg: "from-teal-50/60 dark:from-teal-500/10",
    bar: "#14b8a6",
    barTo: "#2dd4bf",
  },
  fuchsia: {
    stripe: "bg-fuchsia-500",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    bg: "from-fuchsia-50/60 dark:from-fuchsia-500/10",
    bar: "#d946ef",
    barTo: "#e879f9",
  },
  zinc: {
    stripe: "bg-zinc-400 dark:bg-zinc-500",
    text: "text-zinc-700 dark:text-zinc-300",
    bg: "from-zinc-50/60 dark:from-zinc-500/10",
    bar: "#71717a",
    barTo: "#a1a1aa",
  },
};

export function pctDelta(current: number, prev: number): {
  text: string;
  positive: boolean;
} | null {
  if (prev === 0) return null;
  const pct = ((current - prev) / prev) * 100;
  return { text: `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(1)}%`, positive: pct >= 0 };
}

export function KpiCard({
  label,
  value,
  hint,
  tone = "indigo",
  delay = 0,
}: {
  label: string;
  value: string;
  hint?: { text: string; positive: boolean } | string | null;
  tone?: Tone;
  delay?: number;
}) {
  const t = TONE[tone];
  const valueLength = value.length;
  // Avoid overflow on long values like "$1,234,567"
  const valueClass =
    valueLength > 11
      ? "text-xl"
      : valueLength > 8
        ? "text-2xl"
        : "text-3xl";

  const hintNode =
    typeof hint === "string"
      ? <span className="text-zinc-500 dark:text-zinc-400">{hint}</span>
      : hint
        ? <span className={hint.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{hint.text}</span>
        : null;

  return (
    <div
      className={`fade-up relative overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-gradient-to-br ${t.bg} to-transparent p-5 shadow-sm`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r ${t.stripe}`} />
      <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div
        className={`mt-2 font-semibold tabular-nums ${valueClass} ${t.text}`}
      >
        {value}
      </div>
      {hintNode && (
        <div className="mt-1.5 text-xs font-medium tabular-nums">{hintNode}</div>
      )}
    </div>
  );
}

export function Section({
  title,
  subtitle,
  children,
  padded = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <section className="fade-up mt-8 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <div className="px-6 pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className={padded ? "px-6 py-5" : ""}>{children}</div>
    </section>
  );
}

export function BarChart({
  data,
  format = (n) => String(n),
  ariaLabel,
  tone = "indigo",
}: {
  data: { label: string; value: number; tooltip?: string }[];
  format?: (n: number) => string;
  ariaLabel: string;
  tone?: Tone;
}) {
  if (data.length === 0) {
    return (
      <div className="text-sm text-zinc-500 py-12 text-center">No data.</div>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 760;
  const H = 240;
  const PAD_X = 48;
  const PAD_Y_TOP = 16;
  const PAD_Y_BOT = 32;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y_TOP - PAD_Y_BOT;
  const step = innerW / data.length;
  const barWidth = Math.max(2, step * 0.66);
  const t = TONE[tone];
  const gid = `bar-grad-${tone}`;
  // Show at most ~12 labels regardless of bar count, picking evenly spaced
  // indices and always including the last bar so the right edge has context.
  const labelEvery = Math.max(1, Math.ceil(data.length / 12));
  const showLabel = (i: number) =>
    i === data.length - 1 || i % labelEvery === 0;

  // Y-axis ticks (3 lines for visual reference)
  const ticks = [0.25, 0.5, 0.75, 1].map((f) => ({
    y: PAD_Y_TOP + innerH * (1 - f),
    label: format(max * f),
  }));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.barTo} />
          <stop offset="100%" stopColor={t.bar} />
        </linearGradient>
      </defs>

      {ticks.map((tk, i) => (
        <g key={i}>
          <line
            x1={PAD_X}
            y1={tk.y}
            x2={W - PAD_X}
            y2={tk.y}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeDasharray="3 3"
          />
          <text
            x={PAD_X - 6}
            y={tk.y + 3}
            textAnchor="end"
            className="fill-current text-[10px] opacity-50 tabular-nums"
          >
            {tk.label}
          </text>
        </g>
      ))}

      {data.map((d, i) => {
        const h = (d.value / max) * innerH;
        const x = PAD_X + i * step + (step - barWidth) / 2;
        const y = PAD_Y_TOP + innerH - h;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={h}
              rx={4}
              fill={`url(#${gid})`}
              className="bar-anim"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <title>{d.tooltip ?? `${d.label}: ${format(d.value)}`}</title>
            </rect>
            {showLabel(i) && (
              <text
                x={x + barWidth / 2}
                y={H - 12}
                textAnchor="middle"
                className="fill-current text-[10px] opacity-60 tabular-nums"
              >
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function DonutChart({
  slices,
  centerLabel,
  centerValue,
  ariaLabel,
}: {
  slices: { label: string; value: number; tone: Tone; href?: string }[];
  centerLabel: string;
  centerValue: string;
  ariaLabel: string;
}) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  if (total === 0) {
    return (
      <div className="text-sm text-zinc-500 py-12 text-center">No data.</div>
    );
  }
  const cx = 160;
  const cy = 160;
  const R = 130;
  const r = 78; // inner hole — donut

  // Walk each slice as an annular arc path.
  let acc = 0;
  const arcs = slices.map((s) => {
    const startAngle = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += s.value;
    const endAngle = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const large = endAngle - startAngle > Math.PI ? 1 : 0;
    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle);
    const y2 = cy + R * Math.sin(endAngle);
    const xi1 = cx + r * Math.cos(endAngle);
    const yi1 = cy + r * Math.sin(endAngle);
    const xi2 = cx + r * Math.cos(startAngle);
    const yi2 = cy + r * Math.sin(startAngle);
    const path = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${r} ${r} 0 ${large} 0 ${xi2} ${yi2} Z`;
    return { ...s, path, share: s.value / total };
  });

  const fill = (tone: Tone) => TONE[tone].bar;

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      <svg
        viewBox="0 0 320 320"
        className="w-full max-w-xs"
        role="img"
        aria-label={ariaLabel}
      >
        {arcs.map((a, i) => {
          const slice = (
            <path
              d={a.path}
              fill={fill(a.tone)}
              className="transition-opacity hover:opacity-80"
              style={{
                animation: `fade-up 320ms ${i * 80}ms cubic-bezier(0.22,1,0.36,1) backwards`,
              }}
            >
              <title>{`${a.label}: ${(a.share * 100).toFixed(1)}%`}</title>
            </path>
          );
          return (
            <g key={a.label}>
              {a.href ? <a href={a.href}>{slice}</a> : slice}
            </g>
          );
        })}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="fill-zinc-500 dark:fill-zinc-400 text-[11px] uppercase tracking-wider"
        >
          {centerLabel}
        </text>
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          className="fill-zinc-900 dark:fill-zinc-50 text-xl font-semibold tabular-nums"
        >
          {centerValue}
        </text>
      </svg>
      <ul className="flex-1 w-full space-y-2.5">
        {arcs.map((a) => (
          <li key={a.label}>
            <a
              href={a.href ?? "#"}
              className="group flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
            >
              <span
                className="size-3 rounded-sm shrink-0"
                style={{ backgroundColor: fill(a.tone) }}
              />
              <span className="flex-1 text-sm text-zinc-900 dark:text-zinc-100 truncate">
                {a.label}
              </span>
              <span className="text-sm font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                {fmtMoney(a.value)}
              </span>
              <span className="text-xs text-zinc-500 w-12 text-right tabular-nums">
                {(a.share * 100).toFixed(1)}%
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    success:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
    running:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
    error:
      "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20",
    never:
      "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${
        map[status] ?? map.never
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === "success"
            ? "bg-emerald-500"
            : status === "running"
              ? "bg-amber-500 animate-pulse"
              : status === "error"
                ? "bg-rose-500"
                : "bg-zinc-400"
        }`}
      />
      {status}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="fade-up flex items-baseline justify-between gap-4 flex-wrap">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      )}
    </div>
  );
}
