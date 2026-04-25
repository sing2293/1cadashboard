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
      className="fade-up relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg shadow-black/10"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="absolute -top-12 -right-12 size-32 rounded-full opacity-25 blur-2xl"
        style={{ backgroundColor: TONE[tone].bar }}
      />
      <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r ${t.stripe}`} />
      <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] relative">
        {label}
      </div>
      <div
        className={`mt-2 font-semibold tabular-nums ${valueClass} ${t.text} relative`}
      >
        {value}
      </div>
      {hintNode && (
        <div className="mt-1.5 text-xs font-medium tabular-nums relative">{hintNode}</div>
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
    <section className="fade-up mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg shadow-black/10 overflow-hidden">
      <div className="px-6 pt-5 pb-3 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
        {subtitle && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>
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
    <div className="flex flex-col items-center gap-5">
      <svg
        viewBox="0 0 320 320"
        className="w-full max-w-[240px]"
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
          y={cy - 4}
          textAnchor="middle"
          className="fill-[var(--text-muted)] text-[12px] uppercase tracking-wider"
        >
          {centerLabel}
        </text>
        <text
          x={cx}
          y={cy + 24}
          textAnchor="middle"
          className="fill-[var(--text)] text-2xl font-semibold tabular-nums"
        >
          {centerValue}
        </text>
      </svg>
      <ul className="w-full space-y-1.5">
        {arcs.map((a) => (
          <li key={a.label}>
            <a
              href={a.href ?? "#"}
              className="group flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5 transition-colors"
            >
              <span
                className="size-3 rounded-sm shrink-0"
                style={{ backgroundColor: fill(a.tone) }}
              />
              <span className="flex-1 text-sm text-[var(--text)] truncate">
                {a.label}
              </span>
              <span className="text-sm font-medium tabular-nums text-[var(--text)]">
                {fmtMoney(a.value)}
              </span>
              <span className="text-xs text-[var(--text-muted)] w-12 text-right tabular-nums">
                {(a.share * 100).toFixed(1)}%
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AreaChart({
  series,
  ariaLabel,
  format = (n) => String(n),
  height = 280,
}: {
  series: { label: string; tone: Tone; points: { x: string; y: number }[] }[];
  ariaLabel: string;
  format?: (n: number) => string;
  height?: number;
}) {
  if (series.length === 0 || series[0].points.length === 0) {
    return (
      <div className="text-sm text-[var(--text-muted)] py-12 text-center">
        No data.
      </div>
    );
  }
  const W = 800;
  const H = height;
  const PAD_L = 56;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 32;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const xLabels = series[0].points.map((p) => p.x);
  const n = xLabels.length;
  const max = Math.max(
    1,
    ...series.flatMap((s) => s.points.map((p) => p.y)),
  );
  const xAt = (i: number) =>
    PAD_L + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yAt = (v: number) => PAD_T + innerH - (v / max) * innerH;

  // Y-axis ticks
  const ticks = [0.25, 0.5, 0.75, 1].map((f) => ({
    y: yAt(max * f),
    label: format(max * f),
  }));

  // Smooth path via simple monotonic interpolation: connect with quadratic
  // Bezier through midpoints, anchored at actual data points for accuracy.
  function buildLinePath(pts: { x: number; y: number }[]): string {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const cx = (a.x + b.x) / 2;
      d += ` Q ${a.x} ${a.y}, ${cx} ${(a.y + b.y) / 2} T ${b.x} ${b.y}`;
    }
    return d;
  }

  const labelEvery = Math.max(1, Math.ceil(n / 12));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        {series.map((s) => {
          const t = TONE[s.tone];
          return (
            <linearGradient
              key={s.label}
              id={`area-${s.label.replace(/\W/g, "")}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={t.bar} stopOpacity={0.45} />
              <stop offset="100%" stopColor={t.bar} stopOpacity={0.02} />
            </linearGradient>
          );
        })}
      </defs>

      {ticks.map((tk, i) => (
        <g key={i}>
          <line
            x1={PAD_L}
            y1={tk.y}
            x2={W - PAD_R}
            y2={tk.y}
            stroke="currentColor"
            strokeOpacity={0.06}
            strokeDasharray="3 3"
          />
          <text
            x={PAD_L - 8}
            y={tk.y + 3}
            textAnchor="end"
            className="fill-[var(--text-muted)] text-[10px] tabular-nums"
          >
            {tk.label}
          </text>
        </g>
      ))}

      {series.map((s, idx) => {
        const t = TONE[s.tone];
        const pts = s.points.map((p, i) => ({ x: xAt(i), y: yAt(p.y) }));
        const linePath = buildLinePath(pts);
        const baseY = PAD_T + innerH;
        const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`;
        const id = `area-${s.label.replace(/\W/g, "")}`;
        return (
          <g key={s.label}>
            <path
              d={areaPath}
              fill={`url(#${id})`}
              className="fade-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            />
            <path
              d={linePath}
              fill="none"
              stroke={t.bar}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="fade-up"
              style={{ animationDelay: `${idx * 100 + 150}ms` }}
            >
              <title>{s.label}</title>
            </path>
          </g>
        );
      })}

      {xLabels.map((label, i) => {
        if (i !== n - 1 && i % labelEvery !== 0) return null;
        return (
          <text
            key={i}
            x={xAt(i)}
            y={H - 12}
            textAnchor="middle"
            className="fill-[var(--text-muted)] text-[10px] tabular-nums"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

export function RingGauge({
  value,
  total,
  label,
  centerLabel,
  tone = "indigo",
  size = 110,
}: {
  value: number;
  total: number;
  label: string;
  centerLabel: string;
  tone?: Tone;
  size?: number;
}) {
  const R = 40;
  const C = 2 * Math.PI * R;
  const pct = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
  const dash = pct * C;
  const t = TONE[tone];
  const id = `ring-${tone}-${label.replace(/\W/g, "")}`;
  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="-rotate-90"
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={t.barTo} />
            <stop offset="100%" stopColor={t.bar} />
          </linearGradient>
        </defs>
        <circle
          cx={50}
          cy={50}
          r={R}
          fill="none"
          stroke="var(--border)"
          strokeWidth={8}
        />
        <circle
          cx={50}
          cy={50}
          r={R}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          className="ring-anim"
          style={
            { ["--circ" as string]: `${C}` } as React.CSSProperties
          }
        />
        <text
          x={50}
          y={56}
          textAnchor="middle"
          transform="rotate(90 50 50)"
          className="fill-[var(--text)] text-[14px] font-semibold tabular-nums"
        >
          {centerLabel}
        </text>
      </svg>
      <div className="mt-2 text-xs text-[var(--text-muted)]">{label}</div>
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
