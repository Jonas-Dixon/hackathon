import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Cite, SourceRow } from "@/components/cite";
import { CUSHION, fmtDay, type CapacitySummary, type TimelineDay } from "@/lib/capacity";
import type { Risk } from "@/lib/engine";
import { useT } from "@/lib/lang";
import { cn, formatSek } from "@/lib/utils";

const SEGMENT: Record<Risk, string> = {
  clear: "bg-clear/70",
  watch: "bg-watch/75",
  storm: "bg-storm",
  gap: "bg-line",
};

/**
 * Tidslinje, inte procentmätare. Vänster kant är idag, höger kant är om 12
 * veckor. Färgen är kassaläget den dagen, tickarna är fasta händelser.
 */
export function CapacityTimeline({
  days,
  ceilingDate,
  compact = false,
}: {
  days: TimelineDay[];
  ceilingDate: string | null;
  compact?: boolean;
}) {
  const t = useT();
  const ceilingIdx = ceilingDate ? days.findIndex((d) => d.date === ceilingDate) : -1;
  const ceilingPct = ceilingIdx >= 0 ? (ceilingIdx / (days.length - 1)) * 100 : null;
  const ticks = days
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d.fixed)
    .map(({ d, i }) => ({ label: d.fixed as string, pct: (i / (days.length - 1)) * 100, date: d.date }));

  return (
    <div>
      <div className={cn("flex overflow-hidden rounded-full", compact ? "h-1.5" : "h-2.5")}>
        {days.map((d) => (
          <span key={d.date} className={cn("flex-1", SEGMENT[d.risk])} />
        ))}
      </div>

      {compact ? null : (
        <div className="relative mt-1 h-3">
          {ticks.map((t) => (
            <span
              key={t.date}
              className="absolute top-0 w-px bg-line-strong"
              style={{ left: `${t.pct}%`, height: "5px" }}
              aria-hidden="true"
            />
          ))}
          {ceilingPct != null ? (
            <span
              className="absolute top-0 w-[1.5px] bg-storm"
              style={{ left: `${ceilingPct}%`, height: "9px" }}
              aria-hidden="true"
            />
          ) : null}
        </div>
      )}

      {compact ? null : (
        <div className="relative mt-0.5 h-4">
          <span className="absolute left-0 font-mono text-[10px] text-subtle">{t.common.today}</span>
          {ceilingPct != null ? (
            <span
              className="absolute -translate-x-1/2 font-mono text-[10px] whitespace-nowrap text-storm"
              style={{ left: `${Math.min(82, Math.max(12, ceilingPct))}%` }}
            >
              {fmtDay(ceilingDate as string)}
            </span>
          ) : null}
          <span className="absolute right-0 font-mono text-[10px] text-subtle">
            {fmtDay(days[days.length - 1].date)}
          </span>
        </div>
      )}
    </div>
  );
}

/** Notisen: svaret, tidslinjen, och allt annat undanstoppat. */
export function CapacityNotice({
  summary,
  href = "/utrymme",
}: {
  summary: CapacitySummary;
  href?: string;
}) {
  const t = useT();
  return (
    <section className="rounded-lg border border-border bg-card px-4 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          className={cn(
            "text-[17px] font-semibold tracking-tight",
            summary.ok ? "text-fg" : "text-storm",
          )}
        >
          {summary.headline}
        </h2>
        <p className={cn("font-mono text-[13px] tabular", summary.ok ? "text-muted" : "text-storm")}>
          {summary.ok
            ? t.capacity.headroom(formatSek(summary.headroomNow, true))
            : t.capacity.shortfall(formatSek(summary.shortfall, true))}
        </p>
      </div>

      <p className="mt-1 text-[13px] text-muted-foreground">
        {summary.sub}
        <Cite ids={summary.cites} />
      </p>

      <div className="mt-3">
        <CapacityTimeline days={summary.days} ceilingDate={summary.ceilingDate} />
      </div>

      <details className="group mt-3 border-t border-border pt-2.5">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-[13px] text-muted transition-colors hover:text-fg [&::-webkit-details-marker]:hidden">
          <ChevronRight
            className="size-3.5 transition-transform duration-200 group-open:rotate-90"
            aria-hidden="true"
          />
          Vad tar utrymmet?
        </summary>
        <ul className="mt-2 space-y-1.5">
          {summary.drivers.map((d) => (
            <li key={d.date + d.label} className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="min-w-0 flex-1 truncate text-muted">
                {d.label}
                <span className="ml-1.5 font-mono text-[11px] text-subtle">{fmtDay(d.date)}</span>
                <Cite ids={d.cites} />
              </span>
              <span className="shrink-0 font-mono text-xs tabular text-storm">
                −{formatSek(d.amount, true)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2.5 text-[12px] leading-relaxed text-subtle">
          Kudden är {formatSek(CUSHION, true)} — utrymmet är allt över den.
        </p>
        <div className="mt-2.5">
          <Link
            to={href}
            className="text-[13px] text-fg underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-fg"
          >
            Hela underlaget
          </Link>
        </div>
      </details>
    </section>
  );
}

/** Sidopanelens rad. Bara svaret och tidslinjen. */
export function CapacityMini({ summary }: { summary: CapacitySummary }) {
  const t = useT();
  return (
    <Link
      to="/utrymme"
      className="block rounded-md border border-border bg-background px-2.5 py-2 transition-colors hover:bg-secondary"
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-fg">{t.capacity.cardTitle}</span>
        <span
          className={cn(
            "font-mono text-[11px] tabular",
            summary.ok ? "text-muted" : "text-storm",
          )}
        >
          {summary.ok ? formatSek(summary.headroomNow, true) : `−${formatSek(summary.shortfall, true)}`}
        </span>
      </span>
      <span className="mt-1.5 block">
        <CapacityTimeline days={summary.days} ceilingDate={summary.ceilingDate} compact />
      </span>
      <span className="mt-1.5 block truncate text-[11px] text-muted-foreground">
        {summary.ceilingDate
          ? t.capacity.ceilingAt(fmtDay(summary.ceilingDate))
          : t.capacity.jobsLeft(summary.ordersLeft)}
      </span>
    </Link>
  );
}

/** Mikroraden i dagkortet. Så diskret som det går utan att försvinna. */
export function DayCapacityInline({ endCash }: { endCash: number }) {
  const t = useT();
  const left = endCash - CUSHION;
  const ok = left > 0;
  return (
    <p className="mt-2.5 flex items-baseline justify-between gap-2 border-t border-border pt-2.5 text-[11px]">
      <span className="text-subtle">{t.capacity.leftAfterDay}</span>
      <span className={cn("font-mono tabular", ok ? "text-muted" : "text-storm")}>
        {ok ? formatSek(left, true) : `−${formatSek(Math.abs(left), true)}`}
      </span>
    </p>
  );
}

export function CapacitySources({ summary }: { summary: CapacitySummary }) {
  return <SourceRow ids={summary.cites} />;
}
