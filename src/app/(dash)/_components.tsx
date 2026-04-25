export const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtInt = (n: number) => new Intl.NumberFormat("en-CA").format(n);

export const fmtPct = (n: number, decimals = 1) =>
  `${(n * 100).toFixed(decimals)}%`;

export function pctDelta(current: number, prev: number): string | null {
  if (prev === 0) return null;
  const pct = ((current - prev) / prev) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}% YoY`;
}

export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string | null;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</div>
      )}
    </div>
  );
}

export function Section({
  title,
  children,
  padded = true,
}: {
  title: string;
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <section className="mt-10 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
      <h2
        className={`${
          padded ? "px-6 pt-6" : "p-4 pb-0"
        } text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide`}
      >
        {title}
      </h2>
      <div className={padded ? "p-6 pt-4" : "p-4"}>{children}</div>
    </section>
  );
}

export function BarChart({
  data,
  format = (n) => String(n),
  ariaLabel,
}: {
  data: { label: string; value: number; tooltip?: string }[];
  format?: (n: number) => string;
  ariaLabel: string;
}) {
  if (data.length === 0) {
    return <div className="text-sm text-zinc-500">No data.</div>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 720;
  const H = 220;
  const PAD_X = 40;
  const PAD_Y = 24;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;
  const step = innerW / data.length;
  const barWidth = step * 0.72;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={ariaLabel}
    >
      <line
        x1={PAD_X}
        y1={H - PAD_Y}
        x2={W - PAD_X}
        y2={H - PAD_Y}
        stroke="currentColor"
        strokeOpacity={0.2}
      />
      {data.map((d, i) => {
        const h = (d.value / max) * innerH;
        const x = PAD_X + i * step + (step - barWidth) / 2;
        const y = H - PAD_Y - h;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={h}
              rx={3}
              className="fill-zinc-900 dark:fill-zinc-100"
            />
            <title>{d.tooltip ?? `${d.label}: ${format(d.value)}`}</title>
            <text
              x={x + barWidth / 2}
              y={H - PAD_Y + 14}
              textAnchor="middle"
              className="fill-current text-[10px] opacity-60"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function StatusPill({
  status,
}: {
  status: "success" | "running" | "error" | string;
}) {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  const map: Record<string, string> = {
    success:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    running:
      "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    error: "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  };
  return <span className={`${base} ${map[status] ?? ""}`}>{status}</span>;
}
