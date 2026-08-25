import { useId } from "react";
import { fmtDay } from "@/lib/capacity";
import type { DayPoint } from "@/lib/engine";
import type { Judgement } from "@/lib/order";
import { cn, formatSek } from "@/lib/utils";

const W = 360;
const H = 176;
const PAD = { top: 24, right: 44, bottom: 24, left: 10 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

type Bounds = { min: number; max: number; len: number };

function xAt(i: number, b: Bounds) {
  return PAD.left + (i / Math.max(1, b.len - 1)) * PLOT_W;
}

function yAt(v: number, b: Bounds) {
  return PAD.top + (1 - (v - b.min) / (b.max - b.min)) * PLOT_H;
}

function linePath(days: DayPoint[], b: Bounds): string {
  return days
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xAt(i, b).toFixed(1)} ${yAt(d.endCash, b).toFixed(1)}`)
    .join(" ");
}

/** Hela ytan under kurvan, ned till bottenkanten. Ger kurvan tyngd. */
function areaPath(days: DayPoint[], b: Bounds): string {
  const floor = H - PAD.bottom;
  const line = days
    .map((d, i) => `L ${xAt(i, b).toFixed(1)} ${yAt(d.endCash, b).toFixed(1)}`)
    .join(" ");
  return `M ${xAt(0, b).toFixed(1)} ${floor} ${line} L ${xAt(days.length - 1, b).toFixed(1)} ${floor} Z`;
}

/** Ytan mellan kurvan och noll, bara där kassan faktiskt är negativ. */
function deficitPath(days: DayPoint[], b: Bounds): string {
  const zero = yAt(0, b);
  const parts: string[] = [];
  let run: number[] = [];

  const flush = () => {
    if (run.length >= 2) {
      const line = run.map((i) => `L ${xAt(i, b).toFixed(1)} ${yAt(days[i].endCash, b).toFixed(1)}`);
      parts.push(
        `M ${xAt(run[0], b).toFixed(1)} ${zero.toFixed(1)} ${line.join(" ")} L ${xAt(run[run.length - 1], b).toFixed(1)} ${zero.toFixed(1)} Z`,
      );
    }
    run = [];
  };

  days.forEach((d, i) => {
    if (d.endCash < 0) run.push(i);
    else flush();
  });
  flush();
  return parts.join(" ");
}

function troughOf(days: DayPoint[]) {
  let idx = 0;
  days.forEach((d, i) => {
    if (d.endCash < days[idx].endCash) idx = i;
  });
  return idx;
}

/**
 * Ett scenario: kassan dag för dag med nollinjen som referens. Går kurvan under
 * noll fylls gapet rött — svaret syns innan någon läser en siffra.
 */
function Scenario({
  days,
  bounds,
  label,
  sub,
  ok,
  dimmed = false,
}: {
  days: DayPoint[];
  bounds: Bounds;
  label: string;
  sub: string;
  ok: boolean;
  dimmed?: boolean;
}) {
  const uid = useId();
  const idx = troughOf(days);
  const trough = days[idx];
  const under = trough.endCash < 0;
  const deficit = deficitPath(days, bounds);
  const zero = yAt(0, bounds);
  const stroke = under ? "#b42318" : "#1a7a4c";

  // Två avläsbara nivåer utöver nollan, avrundade till jämna hundratusen.
  const step = Math.max(100_000, Math.round(bounds.max / 2 / 100_000) * 100_000);
  const gridLines = [step, step * 2].filter((v) => v < bounds.max && v > bounds.min);

  return (
    <div className={cn("min-w-0 flex-1", dimmed && "opacity-90")}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[13px] font-medium text-fg">{label}</p>
        <p
          className={cn(
            "font-mono text-[12px] tabular",
            under ? "text-storm" : "text-clear",
          )}
        >
          {ok ? "Håller" : "Brister"}
        </p>
      </div>
      <p className="mt-0.5 text-[11px] text-subtle">{sub}</p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-1.5 h-auto w-full"
        role="img"
        aria-label={`${label}: lägsta kassa ${formatSek(trough.endCash)}`}
      >
        <defs>
          <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b42318" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#b42318" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.16" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${uid}-clip`}>
            <rect x={PAD.left} y={PAD.top - 6} width={PLOT_W} height={PLOT_H + 12} />
          </clipPath>
        </defs>

        {/* Rutnät — tre nivåer, tillräckligt för att läsa av höjd */}
        {gridLines.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yAt(v, bounds)}
              y2={yAt(v, bounds)}
              stroke="#e4e3dc"
              strokeWidth="1"
            />
            <text
              x={W - PAD.right + 6}
              y={yAt(v, bounds) + 3}
              className="fill-subtle font-mono"
              fontSize="9"
            >
              {formatSek(v, true)}
            </text>
          </g>
        ))}

        {/* Zonen under noll. Kurvan som tar sig hit är svaret. */}
        <rect
          x={PAD.left}
          y={zero}
          width={PLOT_W}
          height={Math.max(0, H - PAD.bottom - zero)}
          fill="#b42318"
          opacity="0.05"
        />

        <g clipPath={`url(#${uid}-clip)`}>
          <path d={areaPath(days, bounds)} fill={`url(#${uid}-area)`} />
          {deficit ? <path d={deficit} fill={`url(#${uid}-fill)`} /> : null}
        </g>

        {/* Nollinjen — allt handlar om den */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={zero}
          y2={zero}
          stroke="#161615"
          strokeWidth="1.25"
        />
        <text
          x={W - PAD.right + 6}
          y={zero + 3}
          className="fill-fg font-mono font-medium"
          fontSize="9"
        >
          0
        </text>

        <path
          d={linePath(days, bounds)}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        <circle cx={xAt(idx, bounds)} cy={yAt(trough.endCash, bounds)} r="3.5" fill={stroke} />
        <text
          x={Math.min(W - PAD.right - 24, Math.max(PAD.left + 24, xAt(idx, bounds)))}
          y={under ? PAD.top + 10 : yAt(trough.endCash, bounds) - 9}
          textAnchor="middle"
          className={cn("font-mono font-medium", under ? "fill-storm" : "fill-clear")}
          fontSize="12"
        >
          {under ? "lägst " : ""}
          {formatSek(trough.endCash, true)}
        </text>

        <text x={PAD.left} y={H - 6} className="fill-subtle font-mono" fontSize="9">
          {fmtDay(days[0].date)}
        </text>
        <text
          x={W - PAD.right}
          y={H - 6}
          textAnchor="end"
          className="fill-subtle font-mono"
          fontSize="9"
        >
          {fmtDay(days[days.length - 1].date)}
        </text>
      </svg>
    </div>
  );
}

/** Samma antal dagar räknat från när ordern läggs — annars jämför vi inte samma sak. */
const WINDOW_DAYS = 100;

function windowFrom(days: DayPoint[], startDate: string): DayPoint[] {
  const start = Math.max(0, days.findIndex((d) => d.date === startDate));
  return days.slice(start, start + WINDOW_DAYS);
}

export function CashCurve({ verdict, className }: { verdict: Judgement; className?: string }) {
  const chosen = windowFrom(verdict.days, verdict.materialDate);
  const alt = verdict.suggestedDays
    ? windowFrom(verdict.suggestedDays, verdict.earliest as string)
    : null;

  const values = [...chosen.map((d) => d.endCash), ...(alt?.map((d) => d.endCash) ?? []), 0];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo) * 0.16 || 1;
  const bounds: Bounds = {
    min: lo - pad,
    max: hi + pad,
    len: Math.max(chosen.length, alt?.length ?? 0),
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
        <Scenario
          days={chosen}
          bounds={bounds}
          label={`Lagd ${fmtDay(verdict.materialDate)}`}
          sub={verdict.earliest ? "det ni valde" : "ordern"}
          ok={verdict.trough >= 0}
        />
        {alt ? (
          <Scenario
            days={alt}
            bounds={bounds}
            label={`Lagd ${fmtDay(verdict.earliest as string)}`}
            sub="samma order, senare"
            ok
            dimmed
          />
        ) : null}
      </div>
    </div>
  );
}
