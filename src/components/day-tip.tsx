import { DayCapacityInline } from "@/components/capacity-limits";
import { SourceChip } from "@/components/source-mark";
import { formatSek } from "@/lib/utils";
import type { DayPoint } from "@/lib/engine";

const RISK_WORD = {
  clear: "Klart",
  watch: "Mulet",
  storm: "Oväder",
  gap: "Lucka",
};

export function DayTip({ day }: { day: DayPoint | null }) {
  if (!day) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        Tryck på en dag. Varje post har källa.
      </div>
    );
  }

  const net =
    day.inflows.reduce((s, f) => s + f.amount, 0) -
    day.outflows.reduce((s, f) => s + f.amount, 0);
  const rows = day.inflows.concat(day.outflows);

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-xs tracking-wide text-subtle uppercase">
          {day.weekday} {day.date}
        </p>
        <p className="font-mono text-xs text-fog">{RISK_WORD[day.risk]}</p>
      </div>
      <p className="mt-1 text-xl font-semibold tabular text-fg">
        {formatSek(day.endCash)} <span className="text-sm text-muted">på kontot efteråt</span>
      </p>
      <p className={`mt-0.5 font-mono text-xs tabular ${net >= 0 ? "text-clear" : "text-storm"}`}>
        Netto {net >= 0 ? "+" : ""}
        {formatSek(net)}
      </p>
      <ul className="mt-2 space-y-1">
        {rows.map((f) => (
          <li key={f.label + f.date} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-1.5 text-muted">
              <SourceChip id={f.source} showName={false} />
              <span className="truncate">{f.label}</span>
            </span>
            <span className={`tabular font-mono text-xs ${f.kind === "in" ? "text-clear" : "text-storm"}`}>
              {f.kind === "in" ? "+" : "−"}
              {formatSek(f.amount, true)}
            </span>
          </li>
        ))}
        {!rows.length ? <li className="text-sm text-subtle">Inget bokat den här dagen.</li> : null}
      </ul>
      <DayCapacityInline endCash={day.endCash} />
    </div>
  );
}
