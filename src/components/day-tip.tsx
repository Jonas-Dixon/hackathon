import { DayCapacityInline } from "@/components/capacity-limits";
import { SourceIcon } from "@/components/source-mark";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  certaintyLabel,
  certaintyTip,
  riskLabel,
  type Certainty,
  type DayPoint,
  type Flow,
} from "@/lib/engine";
import { useT } from "@/lib/lang";
import { cn, formatSek } from "@/lib/utils";

const CERTAINTY_STYLE: Record<Certainty, string> = {
  fast: "border-fg/25 text-fg",
  forutsagbar: "border-line-strong text-muted",
  antagande: "border-dashed border-line-strong text-subtle",
};

function EventRow({ flow }: { flow: Flow }) {
  const t = useT();
  return (
    <li className="flex items-start justify-between gap-3 py-1.5">
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm text-fg">{flow.label}</span>
        <span className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "cursor-help rounded-full border px-1.5 py-px font-mono text-[9px] tracking-wide uppercase",
                  CERTAINTY_STYLE[flow.certainty],
                )}
              >
                {certaintyLabel(flow.certainty)}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-[17rem]">
              <span className="block font-medium text-foreground">
                {t.day.certaintyEvent(certaintyLabel(flow.certainty))}
              </span>
              <span className="mt-0.5 block text-muted-foreground">
                {certaintyTip(flow.certainty)}
              </span>
              <span className="mt-1.5 block border-t border-border pt-1.5 text-muted-foreground">
                {flow.basis}
              </span>
            </TooltipContent>
          </Tooltip>
          <SourceIcon id={flow.source} className="size-3 shrink-0 text-subtle" />
        </span>
      </span>
      <span
        className={cn(
          "shrink-0 font-mono text-xs tabular",
          flow.kind === "in" ? "text-clear" : "text-storm",
        )}
      >
        {flow.kind === "in" ? "+" : "−"}
        {formatSek(flow.amount, true)}
      </span>
    </li>
  );
}

export function DayTip({ day }: { day: DayPoint | null }) {
  const t = useT();
  if (!day) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        {t.day.empty}
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
        <p
          className={cn(
            "font-mono text-xs",
            day.risk === "storm"
              ? "text-storm"
              : day.risk === "watch"
                ? "text-watch"
                : "text-muted",
          )}
        >
          {riskLabel(day.risk)}
        </p>
      </div>
      <p className="mt-1 text-xl font-semibold tabular text-fg">
        {formatSek(day.endCash)} <span className="text-sm font-normal text-muted">{t.day.leftAfter}</span>
      </p>
      <p className={cn("mt-0.5 font-mono text-xs tabular", net >= 0 ? "text-clear" : "text-storm")}>
        {t.day.netto} {net >= 0 ? "+" : ""}
        {formatSek(net)}
      </p>
      <ul className="mt-2 divide-y divide-border">
        {rows.map((f) => (
          <EventRow key={f.label + f.date} flow={f} />
        ))}
        {!rows.length ? (
          <li className="py-1.5 text-sm text-subtle">{t.day.nothingBooked}</li>
        ) : null}
      </ul>
      <DayCapacityInline endCash={day.endCash} />
    </div>
  );
}
