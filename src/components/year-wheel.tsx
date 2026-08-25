import { useMemo } from "react";
import type { DayPoint, Risk } from "@/lib/engine";
import { TODAY } from "@/lib/engine";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

const SEASON_OF = [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0];
const SEASON = [
  { name: "Vinter", note: "stilla", fill: "rgba(90,108,128,0.32)" },
  { name: "Vår", note: "uppstart", fill: "rgba(26,122,76,0.2)" },
  { name: "Sommar", note: "högsäsong", fill: "rgba(26,122,76,0.38)" },
  { name: "Höst", note: "avslut", fill: "rgba(154,103,0,0.24)" },
];

const RISK_FILL: Record<Risk, string> = {
  clear: "rgba(26,122,76,0.4)",
  watch: "rgba(154,103,0,0.42)",
  storm: "rgba(180,35,24,0.52)",
  gap: "rgba(111,111,104,0.1)",
};

function polarPath(
  inner: number,
  outer: number,
  slice: number,
  slices: number,
  cx: number,
  cy: number,
) {
  const a0 = (slice / slices) * Math.PI * 2 - Math.PI / 2;
  const a1 = ((slice + 1) / slices) * Math.PI * 2 - Math.PI / 2;
  const p = (r: number, a: number) => [
    +(cx + Math.cos(a) * r).toFixed(2),
    +(cy + Math.sin(a) * r).toFixed(2),
  ];
  const [x0, y0] = p(inner, a0);
  const [x1, y1] = p(outer, a0);
  const [x2, y2] = p(outer, a1);
  const [x3, y3] = p(inner, a1);
  return `M ${x0} ${y0} L ${x1} ${y1} A ${outer} ${outer} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 0 0 ${x0} ${y0} Z`;
}

function midAngle(slice: number) {
  return ((slice + 0.5) / 12) * Math.PI * 2 - Math.PI / 2;
}

function pt(cx: number, cy: number, r: number, a: number) {
  return [+(cx + Math.cos(a) * r).toFixed(2), +(cy + Math.sin(a) * r).toFixed(2)] as const;
}

function monthRisk(days: DayPoint[], month: number, year: number): Risk {
  const inMonth = days.filter((d) => {
    const [y, m] = d.date.split("-").map(Number);
    return m === month + 1 && y === year;
  });
  if (!inMonth.length) return "gap";
  if (inMonth.some((d) => d.risk === "storm")) return "storm";
  if (inMonth.some((d) => d.risk === "watch")) return "watch";
  return "clear";
}

function pickDay(days: DayPoint[], month: number, year: number): DayPoint | null {
  const inMonth = days.filter((d) => {
    const [y, m] = d.date.split("-").map(Number);
    return m === month + 1 && y === year;
  });
  if (!inMonth.length) return null;
  return inMonth.reduce((w, d) => (d.endCash < w.endCash ? d : w), inMonth[0]);
}

export function YearWheel({
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
  const nowMonth = TODAY.getMonth();
  const nowYear = TODAY.getFullYear();
  const months = useMemo(
    () =>
      MONTHS.map((label, i) => {
        const year = i >= nowMonth ? nowYear : nowYear + 1;
        return {
          i,
          label,
          year,
          risk: monthRisk(days, i, year),
          season: SEASON[SEASON_OF[i]],
          day: pickDay(days, i, year),
        };
      }),
    [days, nowMonth, nowYear],
  );

  const size = 400;
  const cx = 200;
  const cy = 200;
  const rSeasonIn = 54;
  const rSeasonOut = 84;
  const rCashIn = 88;
  const rCashOut = 128;
  const rMonth = 146;
  const rSeason = 176;
  const current = months[nowMonth];
  const activeMonth = activeDate ? Number(activeDate.slice(5, 7)) - 1 : nowMonth;

  return (
    <div className="relative aspect-square w-full max-w-[420px]">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
        <circle cx={cx} cy={cy} r={rCashOut + 4} fill="#fafaf7" stroke="var(--color-line)" />
        {months.map((m) => (
          <path key={`s-${m.i}`} d={polarPath(rSeasonIn, rSeasonOut, m.i, 12, cx, cy)} fill={m.season.fill} />
        ))}
        {months.map((m) => {
          const on = m.i === activeMonth;
          return (
            <path
              key={`c-${m.i}`}
              d={polarPath(rCashIn, rCashOut, m.i, 12, cx, cy)}
              fill={RISK_FILL[m.risk]}
              stroke={on ? "#161615" : "rgba(22,22,21,0.1)"}
              strokeWidth={on ? 1.6 : 0.6}
              className="cursor-pointer"
              tabIndex={0}
              onMouseEnter={() => onHover(m.day)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(m.day)}
              onBlur={() => onHover(null)}
            />
          );
        })}
        {MONTHS.map((label, i) => {
          const [x, y] = pt(cx, cy, rMonth, midAngle(i));
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#5c5c56"
              fontSize="11"
              fontFamily="IBM Plex Mono, ui-monospace, monospace"
            >
              {label}
            </text>
          );
        })}
        {(
          [
            ["Vinter", -Math.PI / 2],
            ["Vår", 0],
            ["Sommar", Math.PI / 2],
            ["Höst", Math.PI],
          ] as const
        ).map(([t, a]) => {
          const [x, y] = pt(cx, cy, rSeason, a);
          return (
            <text
              key={t}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#161615"
              fontSize="12"
              fontFamily="IBM Plex Sans, sans-serif"
              fontWeight="600"
              letterSpacing="0.12em"
            >
              {t.toUpperCase()}
            </text>
          );
        })}
        {Object.entries(markDates).map(([date, tag]) => {
          const month = Number(date.slice(5, 7)) - 1;
          const [x, y] = pt(cx, cy, rCashOut - 12, midAngle(month));
          return <circle key={date + tag} cx={x} cy={y} r="4" fill="#161615" />;
        })}
        <circle cx={cx} cy={cy} r={rSeasonIn - 6} fill="#ffffff" stroke="var(--color-line)" />
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          fill="#161615"
          fontSize="14"
          fontFamily="IBM Plex Sans, sans-serif"
          fontWeight="600"
        >
          {current.label}
        </text>
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fill="#5c5c56"
          fontSize="11"
          fontFamily="IBM Plex Mono, ui-monospace, monospace"
        >
          {current.season.name}
        </text>
        <text
          x={cx}
          y={cy + 24}
          textAnchor="middle"
          fill="#8a8a82"
          fontSize="10"
          fontFamily="IBM Plex Mono, ui-monospace, monospace"
        >
          {current.season.note}
        </text>
      </svg>
    </div>
  );
}
