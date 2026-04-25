import { prisma } from "@/lib/db";
import {
  getKpis,
  getMonthlyRevenue,
  getTopAccounts,
  type MonthlyPoint,
} from "@/lib/queries/executive";

export const dynamic = "force-dynamic";

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);

const fmtInt = (n: number) => new Intl.NumberFormat("en-CA").format(n);

function pctDelta(current: number, prev: number): string | null {
  if (prev === 0) return null;
  const pct = ((current - prev) / prev) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}% YoY`;
}

function KpiCard({
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

function MonthlyRevenueChart({ data }: { data: MonthlyPoint[] }) {
  if (data.length === 0) {
    return <div className="text-sm text-zinc-500">No invoice data in range.</div>;
  }
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const W = 720;
  const H = 220;
  const PAD_X = 40;
  const PAD_Y = 24;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;
  const barWidth = (innerW / data.length) * 0.72;
  const step = innerW / data.length;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label="Revenue by month"
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
        const h = (d.revenue / max) * innerH;
        const x = PAD_X + i * step + (step - barWidth) / 2;
        const y = H - PAD_Y - h;
        return (
          <g key={d.month}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={h}
              rx={3}
              className="fill-zinc-900 dark:fill-zinc-100"
            />
            <title>{`${d.month}: ${fmtMoney(d.revenue)} (${d.invoices} invoices)`}</title>
            <text
              x={x + barWidth / 2}
              y={H - PAD_Y + 14}
              textAnchor="middle"
              className="fill-current text-[10px] opacity-60"
            >
              {d.month.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default async function DashboardPage() {
  const company = await prisma.company.findUnique({ where: { slug: "1cleanair" } });
  if (!company) {
    return (
      <main className="p-10 text-zinc-700">
        No company seeded yet — run <code>pnpm db:seed</code>.
      </main>
    );
  }

  const now = new Date();
  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - 30);
  const range = { from, to: now };

  const [kpis, monthly, top] = await Promise.all([
    getKpis(company.id, range),
    getMonthlyRevenue(company.id, 12),
    getTopAccounts(company.id, range, 10),
  ]);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {company.name}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Last 30 days · {range.from.toISOString().slice(0, 10)} →{" "}
              {range.to.toISOString().slice(0, 10)}
            </p>
          </div>
        </header>

        <section className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard
            label="Revenue"
            value={fmtMoney(kpis.revenue)}
            hint={pctDelta(kpis.revenue, kpis.revenuePrev)}
          />
          <KpiCard label="Invoices" value={fmtInt(kpis.invoices)} />
          <KpiCard label="Avg invoice" value={fmtMoney(kpis.avgInvoice)} />
          <KpiCard label="New customers" value={fmtInt(kpis.newCustomers)} />
          <KpiCard label="Outstanding AR" value={fmtMoney(kpis.outstandingAr)} />
        </section>

        <section className="mt-10 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Revenue by month (last 12 months)
          </h2>
          <div className="mt-4 text-zinc-900 dark:text-zinc-100">
            <MonthlyRevenueChart data={monthly} />
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
          <h2 className="px-6 pt-6 text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Top accounts (last 30 days)
          </h2>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-2">Account</th>
                <th className="px-6 py-2 text-right">Invoices</th>
                <th className="px-6 py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {top.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-zinc-500">
                    No invoices in the last 30 days.
                  </td>
                </tr>
              ) : (
                top.map((row) => (
                  <tr key={row.smId}>
                    <td className="px-6 py-2 text-zinc-900 dark:text-zinc-100">
                      {row.accountName ?? "—"}
                    </td>
                    <td className="px-6 py-2 text-right text-zinc-700 dark:text-zinc-300">
                      {fmtInt(row.invoices)}
                    </td>
                    <td className="px-6 py-2 text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {fmtMoney(row.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
