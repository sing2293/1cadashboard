"use client";

import { Pencil, RefreshCw, SearchX } from "lucide-react";
import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@1ca/ui/components/data-table";
import { Field } from "@1ca/ui/components/field";
import { useNoticeToast } from "@1ca/ui/components/notice-toast";
import { StatusPill } from "@1ca/ui/components/status-pill";
import { Toolbar, ToolbarSearch } from "@1ca/ui/components/toolbar";
import { GlassAlert } from "@1ca/ui/glassyui/glass-alert";
import { GlassButton } from "@1ca/ui/glassyui/glass-button";
import {
  GlassDialog,
  GlassDialogContent,
  GlassDialogDescription,
  GlassDialogTitle,
} from "@1ca/ui/glassyui/glass-dialog";
import { GlassInput } from "@1ca/ui/glassyui/glass-input";
import { GlassSegmentedControl, GlassSegmentedControlItem } from "@1ca/ui/glassyui/glass-segmented-control";
import {
  GlassSelect,
  GlassSelectContent,
  GlassSelectItem,
  GlassSelectSeparator,
  GlassSelectTrigger,
  GlassSelectValue,
} from "@1ca/ui/glassyui/glass-select";
import { GlassSpinner } from "@1ca/ui/glassyui/glass-spinner";
import { formatDate, formatNumber } from "@1ca/ui/lib/format";
import { linkPunches, refreshFromSources, setRate } from "./actions";

export interface TechPayRow {
  id: number;
  name: string;
  punchesEmployeeId: string | null;
  /** "auto" (names matched) or "manual". */
  linkedBy: string | null;
  /** Worked hours in Mobile Punches over the last 7 days; null when not linked. */
  weekHours: number | null;
  /** Newest first. */
  rates: { hourlyRate: number; effectiveFrom: string }[];
}

export interface EmployeeOption {
  id: string;
  name: string;
  linkedTo: { id: number; name: string } | null;
}

const money = (n: number) => `$${formatNumber(n, 2)}`;
// Radix Select can't hold an empty value.
const UNLINKED = "none";

/** Pulls route names, Mobile Punches hours and the techs on recent jobs now, rather than at the next sync. */
export function RefreshButton() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { notify, toast } = useNoticeToast();

  return (
    <div className="flex flex-col items-end gap-1">
      <GlassButton
        variant="soft"
        size="sm"
        className="ca-control-sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await refreshFromSources();
            if (r.ok) notify(r.message ?? "Updated");
            else setError(r.error);
          })
        }
      >
        {pending ? <GlassSpinner size="sm" label="Refreshing" /> : <RefreshCw aria-hidden className="size-4" />}
        Refresh from Mobile Punches
      </GlassButton>
      {error && (
        <p role="alert" className="max-w-xs text-right text-sm text-ca-danger">
          Couldn&rsquo;t refresh: {error}
        </p>
      )}
      {toast}
    </div>
  );
}

export function TechPayTable({ rows, employees, today }: { rows: TechPayRow[]; employees: EmployeeOption[]; today: string }) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"all" | "attention">("all");
  const [editing, setEditing] = useState<TechPayRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { notify, toast } = useNoticeToast();

  const needle = query.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (!needle || r.name.toLowerCase().includes(needle)) &&
      (view === "all" || !r.punchesEmployeeId || r.rates.length === 0),
  );

  const link = (row: TechPayRow, value: string) =>
    start(async () => {
      setError(null);
      const employeeId = value === UNLINKED ? null : value;
      const r = await linkPunches(row.id, employeeId);
      if (r.ok) notify(employeeId ? `${row.name} linked` : `${row.name} unlinked`);
      else setError(r.error);
    });

  return (
    <>
      <Toolbar label="Find a tech">
        <ToolbarSearch placeholder="Search techs" aria-label="Search techs" value={query} onChange={(e) => setQuery(e.target.value)} />
        <GlassSegmentedControl
          aria-label="Show"
          className="ca-control-sm"
          value={view}
          onValueChange={(v) => setView(v as "all" | "attention")}
        >
          <GlassSegmentedControlItem value="all">All</GlassSegmentedControlItem>
          <GlassSegmentedControlItem value="attention">Needs attention</GlassSegmentedControlItem>
        </GlassSegmentedControl>
      </Toolbar>

      {error && (
        <GlassAlert key={error} tone="danger" title="Couldn’t save the link" onDismiss={() => setError(null)}>
          {error}
        </GlassAlert>
      )}

      <Table label="Techs" aria-busy={pending}>
        <TableHeader>
          <TableRow>
            <TableHead>Tech</TableHead>
            <TableHead>Mobile Punches employee</TableHead>
            <TableHead numeric className="hidden sm:table-cell">
              Hours, last 7 days
            </TableHead>
            <TableHead>Pay rate</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.length === 0 ? (
            <TableEmpty
              colSpan={5}
              icon={SearchX}
              title={rows.length === 0 ? "No techs yet" : "No techs match"}
              description={
                rows.length === 0
                  ? "Refresh from Mobile Punches to bring in the techs on recent ServiceMonster jobs."
                  : "Try another name, or show all techs."
              }
            />
          ) : (
            shown.map((row) => {
              const current = row.rates[0];
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>
                    <GlassSelect value={row.punchesEmployeeId ?? UNLINKED} onValueChange={(v) => link(row, v)}>
                      <GlassSelectTrigger aria-label={`Mobile Punches employee for ${row.name}`} className="ca-control-sm w-full sm:w-[15rem]">
                        <span className="truncate">
                          <GlassSelectValue />
                        </span>
                      </GlassSelectTrigger>
                      <GlassSelectContent>
                        <GlassSelectItem value={UNLINKED}>Not linked</GlassSelectItem>
                        <GlassSelectSeparator />
                        {employees.map((e) => {
                          const elsewhere = e.linkedTo && e.linkedTo.id !== row.id;
                          return (
                            <GlassSelectItem key={e.id} value={e.id} disabled={!!elsewhere}>
                              {elsewhere ? `${e.name} (linked to ${e.linkedTo?.name})` : e.name}
                            </GlassSelectItem>
                          );
                        })}
                      </GlassSelectContent>
                    </GlassSelect>
                    {row.linkedBy === "auto" && <div className="mt-1 text-xs text-ca-muted">Matched by name</div>}
                  </TableCell>
                  <TableCell numeric muted={row.weekHours === null} className="hidden sm:table-cell">
                    {row.weekHours === null ? "—" : formatNumber(row.weekHours, 1)}
                  </TableCell>
                  <TableCell>
                    {current ? (
                      <>
                        <span className="tabular-nums">{money(current.hourlyRate)}/h</span>
                        <div className="text-xs text-ca-muted">since {formatDate(current.effectiveFrom)}</div>
                      </>
                    ) : (
                      <StatusPill tone="warning" size="sm">
                        No rate
                      </StatusPill>
                    )}
                  </TableCell>
                  <TableCell>
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0"
                      aria-label={`Set pay rate for ${row.name}`}
                      onClick={() => setEditing(row)}
                    >
                      <Pencil aria-hidden className="size-4" />
                    </GlassButton>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <GlassDialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <GlassDialogContent className="w-[min(28rem,calc(100vw-2rem))]">
          {editing && (
            <RateForm key={editing.id} row={editing} today={today} onDone={(message) => {
              setEditing(null);
              if (message) notify(message);
            }} />
          )}
        </GlassDialogContent>
      </GlassDialog>
      {toast}
    </>
  );
}

function RateForm({ row, today, onDone }: { row: TechPayRow; today: string; onDone: (message?: string) => void }) {
  const [rate, setRateValue] = useState(row.rates[0] ? String(row.rates[0].hourlyRate) : "");
  const [from, setFrom] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      setError(null);
      const r = await setRate(row.id, Number(rate), from);
      if (r.ok) onDone(`${row.name}: ${money(Number(rate))} an hour from ${formatDate(from)}`);
      else setError(r.error);
    });

  return (
    <>
      <GlassDialogTitle className="text-lg font-semibold tracking-tight">Pay rate for {row.name}</GlassDialogTitle>
      <GlassDialogDescription className="mt-1 text-sm text-ca-muted">
        The rate applies from the day you pick until the next rate. Days before it keep the rate they had.
      </GlassDialogDescription>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Hourly rate" hint="Dollars per hour">
          <GlassInput
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="27.50"
            value={rate}
            onChange={(e) => setRateValue(e.target.value)}
          />
        </Field>
        <Field label="Applies from">
          <GlassInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
      </div>

      {row.rates.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold">Rate history</p>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {row.rates.map((r) => (
              <li key={r.effectiveFrom} className="flex justify-between gap-4">
                <span className="text-ca-muted">From {formatDate(r.effectiveFrom)}</span>
                <span className="tabular-nums">{money(r.hourlyRate)}/h</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <GlassAlert tone="danger" title="Couldn’t save the rate" className="mt-4">
          {error}
        </GlassAlert>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <GlassButton size="sm" variant="ghost" className="ca-control-sm" onClick={() => onDone()}>
          Cancel
        </GlassButton>
        <GlassButton size="sm" variant="prominent" className="ca-control-sm" onClick={save} disabled={pending || !rate || !from}>
          {pending && <GlassSpinner size="sm" label="Saving" />}
          Save rate
        </GlassButton>
      </div>
    </>
  );
}
