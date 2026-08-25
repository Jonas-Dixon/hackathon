import { Link } from "@tanstack/react-router";
import { Info, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  usedPctFor,
  toneFor,
  type CapacityRow,
  type CapacityTone,
} from "@/lib/capacity";
import { cn } from "@/lib/utils";

const FILL: Record<CapacityTone, string> = {
  ink: "bg-ink",
  watch: "bg-watch",
  storm: "bg-storm",
};

const TEXT: Record<CapacityTone, string> = {
  ink: "text-fg",
  watch: "text-watch",
  storm: "text-storm",
};

export function LimitBar({
  pct,
  tone,
  className,
}: {
  pct: number;
  tone: CapacityTone;
  className?: string;
}) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setWidth(Math.min(100, pct)));
    return () => cancelAnimationFrame(raf);
  }, [pct]);
  return (
    <div
      role="meter"
      aria-valuenow={Math.min(100, pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]",
          FILL[tone],
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function CapacityRowView({ row }: { row: CapacityRow }) {
  return (
    <div className="grid grid-cols-1 items-center gap-x-8 gap-y-2 py-5 sm:grid-cols-[minmax(11rem,17rem)_1fr_auto]">
      <div className="min-w-0">
        <p className="truncate text-[15px] font-medium text-fg">{row.label}</p>
        <p className="mt-1 truncate text-[13px] text-muted-foreground" title={row.sub}>
          {row.sub}
        </p>
      </div>
      <LimitBar pct={row.usedPct} tone={row.tone} />
      <p
        className={cn(
          "whitespace-nowrap text-[15px] tabular sm:w-24 sm:text-right",
          row.tone === "ink" ? "text-muted" : TEXT[row.tone],
        )}
      >
        {row.usedPct}% använt
      </p>
    </div>
  );
}

export function CapacityCallout({
  amount,
  date,
  label,
}: {
  amount: number;
  date: string;
  label: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card px-4 py-4">
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm leading-relaxed text-muted">
        <span className="font-medium text-fg">Ditt utrymme är tillfälligt boostat.</span>{" "}
        {label} ger +{amount.toLocaleString("sv-SE")} kr den {date} och lyfter utrymmet
        fram till nästa lön. När pengarna landat räknas utrymmet om mot det som ligger
        framför.
      </p>
    </div>
  );
}

export function CapacityFooter() {
  return (
    <p className="flex items-center gap-1.5 text-[13px] text-subtle">
      Senast uppdaterad: nyss
      <RefreshCw className="size-3" aria-hidden="true" />
    </p>
  );
}

// Liten rad i sidopanelen — samma idé som context-mätaren i Claude Code.
export function CapacityMini({ row }: { row: CapacityRow }) {
  return (
    <Link
      to="/utrymme"
      className="block rounded-md border border-border bg-background px-2.5 py-2 transition-colors hover:bg-secondary"
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-fg">Orderutrymme</span>
        <span
          className={cn(
            "font-mono text-[11px] tabular",
            row.tone === "ink" ? "text-subtle" : TEXT[row.tone],
          )}
        >
          {row.usedPct}%
        </span>
      </span>
      <LimitBar pct={row.usedPct} tone={row.tone} className="mt-1.5 h-1.5" />
      <span className="mt-1.5 block truncate text-[11px] text-muted-foreground">{row.sub}</span>
    </Link>
  );
}

// Mikroraden i transaktionslistan: hur mycket av utrymmet som är kvar efter dagen.
export function DayCapacityInline({ endCash }: { endCash: number }) {
  const pct = usedPctFor(endCash);
  const tone = toneFor(endCash);
  return (
    <div className="mt-2.5 flex items-center gap-2 border-t border-border pt-2.5">
      <span className="flex-1 text-[11px] text-subtle">Orderutrymme efter dagen</span>
      <LimitBar pct={pct} tone={tone} className="w-20 shrink-0 sm:w-24" />
      <span
        className={cn(
          "w-9 text-right font-mono text-[11px] tabular",
          tone === "ink" ? "text-subtle" : TEXT[tone],
        )}
      >
        {Math.min(999, pct)}%
      </span>
    </div>
  );
}
