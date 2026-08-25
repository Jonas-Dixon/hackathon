import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayTip } from "@/components/day-tip";
import { CERTAINTY_LABEL, type Certainty, type DayPoint } from "@/lib/engine";
import { addDays, cn, formatSek, iso, parseIso } from "@/lib/utils";

const WEEKDAYS = ["M", "T", "O", "T", "F", "L", "S"];
const WEEKDAYS_LONG = ["mån", "tis", "ons", "tor", "fre", "lör", "sön"];
const MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

/** Prickens form säger hur säker dagens tyngsta post är. */
const DOT: Record<Certainty, string> = {
  fast: "bg-fg",
  forutsagbar: "border border-fg/55",
  antagande: "bg-fg/20",
};

function netOf(d: DayPoint) {
  return d.inflows.reduce((s, f) => s + f.amount, 0) - d.outflows.reduce((s, f) => s + f.amount, 0);
}

function hasEvents(d: DayPoint) {
  return d.inflows.length > 0 || d.outflows.length > 0;
}

/** Den post som betyder mest den dagen — störst belopp vinner. */
function leadFlow(d: DayPoint) {
  const all = [...d.outflows, ...d.inflows];
  if (!all.length) return null;
  return all.reduce((m, f) => (f.amount > m.amount ? f : m), all[0]);
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

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-3">
      {(["fast", "forutsagbar", "antagande"] as const).map((c) => (
        <span key={c} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", DOT[c])} />
          {CERTAINTY_LABEL[c]}
        </span>
      ))}
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="h-3 w-px rounded-full bg-storm/45" />
        Kassan under noll
      </span>
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

  const events = days.filter((d) => hasEvents(d) || markDates[d.date]);

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
                <span className="size-10" />
              </div>
            );
          }
          const active = d.date === activeDate;
          const lead = leadFlow(d);
          const short = d.endCash < 0;
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
                  !active && short && "bg-storm/15 text-storm",
                  !active && !short && lead && "bg-secondary text-fg",
                  !active && !short && !lead && "text-subtle",
                )}
              >
                {Number(d.date.slice(-2))}
              </span>
              {lead ? (
                <span className={cn("size-1.5 rounded-full", DOT[lead.certainty])} />
              ) : (
                <span className="h-1.5" />
              )}
            </button>
          );
        })}
      </div>

      <DayTip day={days.find((d) => d.date === activeDate) ?? days[0] ?? null} />

      <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
        {events.map((d) => {
          const net = netOf(d);
          const active = d.date === activeDate;
          const lead = leadFlow(d);
          const count = d.inflows.length + d.outflows.length;
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
                <span className="flex w-10 shrink-0 flex-col items-center">
                  <span className="font-mono text-[10px] text-subtle">
                    {WEEKDAYS_LONG[(parseIso(d.date).getDay() + 6) % 7]}
                  </span>
                  <span className="font-mono text-sm tabular text-fg">
                    {Number(d.date.slice(-2))}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-fg">
                    {lead?.label ?? "Inget bokat"}
                    {count > 1 ? ` +${count - 1}` : ""}
                  </span>
                  {lead ? (
                    <span className="mt-0.5 flex items-center gap-1.5">
                      <span className={cn("size-1.5 rounded-full", DOT[lead.certainty])} />
                      <span className="text-[11px] text-muted-foreground">
                        {CERTAINTY_LABEL[lead.certainty]}
                      </span>
                    </span>
                  ) : null}
                </span>
                {count ? (
                  <span
                    className={cn(
                      "shrink-0 font-mono text-sm tabular",
                      net >= 0 ? "text-clear" : "text-storm",
                    )}
                  >
                    {net >= 0 ? "+" : ""}
                    {formatSek(net, true)}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <Legend />
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
          if (!d) return <div key={`e-${i}`} className="min-h-[66px]" />;

          const active = d.date === activeDate;
          const net = netOf(d);
          const dayNum = Number(d.date.slice(-2));
          const lead = leadFlow(d);
          const short = d.endCash < 0;
          const isToday = markDates[d.date] === "idag";
          const monthStart = dayNum === 1;

          return (
            <button
              key={d.date}
              type="button"
              onMouseEnter={() => onSelect(d)}
              onFocus={() => onSelect(d)}
              onClick={() => onSelect(d)}
              className={cn(
                "relative flex min-h-[66px] flex-col justify-between overflow-hidden rounded-[10px] border p-1.5 text-left transition-colors duration-150",
                active
                  ? "border-fg/40 bg-elevated"
                  : lead
                    ? "border-line bg-card hover:border-line-strong"
                    : "border-transparent bg-transparent hover:border-line",
              )}
            >
              {short ? (
                <span
                  className="absolute inset-y-2 left-0 w-px rounded-full bg-storm/45"
                  aria-hidden="true"
                />
              ) : null}

              <span className="flex items-start justify-between gap-1">
                <span
                  className={cn(
                    "font-mono text-[11px] tabular",
                    isToday ? "font-medium text-fg" : lead ? "text-muted" : "text-subtle/70",
                  )}
                >
                  {monthStart ? `1 ${MONTHS[parseIso(d.date).getMonth()]}` : dayNum}
                </span>
                {isToday ? (
                  <span className="rounded-full bg-fg px-1.5 py-px font-mono text-[8px] tracking-wide text-primary-foreground uppercase">
                    idag
                  </span>
                ) : lead ? (
                  <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", DOT[lead.certainty])} />
                ) : null}
              </span>

              {lead ? (
                <span className="min-w-0">
                  <span className="block truncate text-[10px] leading-tight text-muted-foreground">
                    {lead.label}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block font-mono text-[11px] tabular",
                      net >= 0 ? "text-clear" : "text-storm",
                    )}
                  >
                    {net >= 0 ? "+" : ""}
                    {formatSek(net, true)}
                  </span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <Legend />
    </div>
  );
}
