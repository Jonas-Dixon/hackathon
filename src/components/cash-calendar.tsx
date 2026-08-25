import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayTip } from "@/components/day-tip";
import type { DayPoint } from "@/lib/engine";
import { addDays, cn, formatSek, iso, parseIso } from "@/lib/utils";

const WEEKDAYS = ["M", "T", "O", "T", "F", "L", "S"];
const WEEKDAYS_LONG = ["mån", "tis", "ons", "tor", "fre", "lör", "sön"];
const MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

const BAR: Record<DayPoint["risk"], string> = {
  storm: "bg-storm",
  watch: "bg-watch",
  clear: "bg-clear",
  gap: "bg-gap",
};

function tone(d: DayPoint) {
  if (d.risk === "storm") return "bg-storm/25";
  if (d.risk === "watch") return "bg-watch/22";
  return "bg-clear/18";
}

function netOf(d: DayPoint) {
  return d.inflows.reduce((s, f) => s + f.amount, 0) - d.outflows.reduce((s, f) => s + f.amount, 0);
}

function mondayPad(firstIso: string) {
  const d = parseIso(firstIso);
  return (d.getDay() + 6) % 7;
}

function weekMonday(dateIso: string) {
  const d = parseIso(dateIso);
  return addDays(d, -((d.getDay() + 6) % 7));
}

function weekLabel(start: Date) {
  const end = addDays(start, 6);
  return `${start.getDate()} ${MONTHS[start.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]}`;
}

export function CashCalendar({
  days,
  onHover,
  activeDate,
  markDates,
}: {
  days: DayPoint[];
  onHover: (d: DayPoint | null) => void;
  activeDate?: string;
  markDates: Record<string, string>;
}) {
  return (
    <div>
      <div className="md:hidden">
        <MobileCal days={days} onSelect={onHover} activeDate={activeDate} markDates={markDates} />
      </div>
      <div className="hidden md:block">
        <MonthGrid days={days} onSelect={onHover} activeDate={activeDate} markDates={markDates} />
      </div>
    </div>
  );
}

function MobileCal({
  days,
  onSelect,
  activeDate,
  markDates,
}: {
  days: DayPoint[];
  onSelect: (d: DayPoint) => void;
  activeDate?: string;
  markDates: Record<string, string>;
}) {
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const first = days[0];
  const [weekStart, setWeekStart] = useState(() =>
    weekMonday(activeDate ?? first?.date ?? iso(new Date())),
  );

  useEffect(() => {
    if (!activeDate) return;
    setWeekStart(weekMonday(activeDate));
  }, [activeDate]);

  const week = Array.from({ length: 7 }, (_, i) => {
    const key = iso(addDays(weekStart, i));
    return byDate.get(key) ?? null;
  });

  const events = days.filter(
    (d) => d.inflows.length || d.outflows.length || markDates[d.date],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Föregående vecka"
          onClick={() => setWeekStart((d) => addDays(d, -7))}
          className="grid size-11 place-items-center rounded-md border border-border"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="font-mono text-xs tracking-wide text-muted uppercase">{weekLabel(weekStart)}</p>
        <button
          type="button"
          aria-label="Nästa vecka"
          onClick={() => setWeekStart((d) => addDays(d, 7))}
          className="grid size-11 place-items-center rounded-md border border-border"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {week.map((d, i) => {
          if (!d) {
            return (
              <div key={`e-${i}`} className="flex min-h-16 flex-col items-center gap-1 pt-1">
                <span className="font-mono text-[10px] text-subtle">{WEEKDAYS[i]}</span>
                <span className="size-8 rounded-full bg-secondary/70" />
              </div>
            );
          }
          const active = d.date === activeDate;
          const mark = markDates[d.date];
          const storm = d.risk === "storm";
          return (
            <button
              key={d.date}
              type="button"
              onClick={() => onSelect(d)}
              className="flex min-h-16 flex-col items-center gap-1 pt-1"
            >
              <span className="font-mono text-[10px] text-subtle">{WEEKDAYS[i]}</span>
              <span
                className={cn(
                  "grid size-10 place-items-center rounded-full font-mono text-sm tabular",
                  active && "bg-primary text-primary-foreground",
                  !active && storm && "bg-storm/20 text-storm",
                  !active && !storm && "bg-secondary text-fg",
                )}
              >
                {Number(d.date.slice(-2))}
              </span>
              {mark ? (
                <span className="font-mono text-[9px] tracking-wide text-fg uppercase">{mark}</span>
              ) : (
                <span className="h-3" />
              )}
            </button>
          );
        })}
      </div>

      <DayTip day={days.find((d) => d.date === activeDate) ?? days[0] ?? null} />

      <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
        {events.map((d) => {
          const net = netOf(d);
          const mark = markDates[d.date];
          const active = d.date === activeDate;
          const empty = !d.inflows.length && !d.outflows.length;
          return (
            <li key={d.date}>
              <button
                type="button"
                onClick={() => onSelect(d)}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 px-3 py-2.5 text-left",
                  active && "bg-elevated",
                )}
              >
                <span className={cn("h-9 w-1 shrink-0 rounded-full", BAR[d.risk])} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-muted">
                      {WEEKDAYS_LONG[(parseIso(d.date).getDay() + 6) % 7]} {Number(d.date.slice(-2))}
                    </span>
                    {mark ? (
                      <span className="rounded-full bg-secondary px-1.5 py-px font-mono text-[9px] tracking-wide text-fg uppercase">
                        {mark}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-fg">
                    {d.outflows[0]?.label ?? d.inflows[0]?.label ?? "Inget bokat"}
                    {d.inflows.length + d.outflows.length > 1
                      ? ` +${d.inflows.length + d.outflows.length - 1}`
                      : ""}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-sm tabular",
                    empty ? "text-subtle" : net >= 0 ? "text-clear" : "text-storm",
                  )}
                >
                  {empty ? "—" : `${net >= 0 ? "+" : ""}${formatSek(net, true)}`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MonthGrid({
  days,
  onSelect,
  activeDate,
  markDates,
}: {
  days: DayPoint[];
  onSelect: (d: DayPoint) => void;
  activeDate?: string;
  markDates: Record<string, string>;
}) {
  const start = days[0]?.date ?? iso(new Date());
  const pad = mondayPad(start);
  const grid = days.slice(0, 42);
  const cells: Array<DayPoint | null> = [...Array.from({ length: pad }, () => null), ...grid];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5 px-0.5">
        {WEEKDAYS.map((w, i) => (
          <div
            key={`${w}-${i}`}
            className="text-center font-mono text-[10px] tracking-widest text-subtle uppercase"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          if (!d) {
            return <div key={`e-${i}`} className="min-h-[72px] rounded-[10px] bg-secondary/60" />;
          }
          const mark = markDates[d.date];
          const active = d.date === activeDate;
          const net = netOf(d);
          const dayNum = Number(d.date.slice(-2));
          const intensity = Math.min(
            1,
            (Math.abs(net) + (d.inflows.length || d.outflows.length ? 40000 : 0)) / 220000,
          );
          return (
            <button
              key={d.date}
              type="button"
              onMouseEnter={() => onSelect(d)}
              onFocus={() => onSelect(d)}
              onClick={() => onSelect(d)}
              className={`relative min-h-[72px] overflow-hidden rounded-[10px] border p-1.5 text-left transition-[border-color,background-color] duration-150 ${
                active
                  ? "border-fg/35 bg-elevated"
                  : "border-line bg-card hover:border-line-strong hover:bg-elevated"
              }`}
            >
              <div
                className={`pointer-events-none absolute inset-x-0 bottom-0 ${tone(d)}`}
                style={{ height: `${12 + intensity * 70}%` }}
              />
              <div className="relative flex items-start justify-between">
                <span className="font-mono text-[11px] text-muted">{dayNum}</span>
                {mark ? (
                  <span className="rounded-full bg-secondary px-1 py-px font-mono text-[8px] tracking-wide text-fg uppercase">
                    {mark}
                  </span>
                ) : null}
              </div>
              <p
                className={`relative mt-5 font-mono text-[10px] tabular ${
                  !d.inflows.length && !d.outflows.length
                    ? "text-subtle"
                    : net >= 0
                      ? "text-clear"
                      : "text-storm"
                }`}
              >
                {!d.inflows.length && !d.outflows.length
                  ? "—"
                  : `${net >= 0 ? "+" : ""}${formatSek(net, true)}`}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
