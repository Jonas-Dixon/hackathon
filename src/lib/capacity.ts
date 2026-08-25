import {
  COMPANY,
  SCENARIOS,
  project,
  type DayPoint,
  type Flow,
  type Scenario,
} from "./engine";
import { parseIso } from "./utils";

// Säkerhetskudde: samma golv som engine.ts använder för "watch".
export const CUSHION = 80_000;

// Teoretiskt utrymme idag: allt över kudden går att binda i order.
export const HEADROOM_TOTAL = COMPANY.cash - CUSHION;

export type CapacityTone = "ink" | "watch" | "storm";

export type CapacityRow = {
  id: string;
  label: string;
  sub: string;
  usedPct: number;
  tone: CapacityTone;
  ceilingDate: string | null;
  trough: number;
};

export type CapacityBoost = {
  amount: number;
  date: string;
  label: string;
};

export type CapacitySnapshot = {
  period: CapacityRow;
  horizon: CapacityRow[];
  boost: CapacityBoost | null;
  headroomTotal: number;
  cushion: number;
};

export function fmtDay(dateIso: string, withWeekday = false): string {
  const d = parseIso(dateIso);
  const day = d
    .toLocaleDateString("sv-SE", { day: "numeric", month: "short" })
    .replace(".", "");
  if (!withWeekday) return day;
  const wd = d.toLocaleDateString("sv-SE", { weekday: "short" }).replace(".", "");
  return `${wd} ${day}`;
}

// Hur stor del av dagens utrymme som är intecknat, givet en projicerad lägstanivå.
export function usedPctFor(trough: number): number {
  const left = trough - CUSHION;
  return Math.max(0, Math.round((1 - left / HEADROOM_TOTAL) * 100));
}

export function toneFor(trough: number): CapacityTone {
  if (trough < 0) return "storm";
  if (trough < CUSHION) return "watch";
  return "ink";
}

function troughOf(points: DayPoint[]): DayPoint {
  return points.reduce((m, p) => (p.endCash < m.endCash ? p : m), points[0]);
}

function ceilingOf(points: DayPoint[]): DayPoint | null {
  return points.find((p) => p.endCash < CUSHION) ?? null;
}

// Största utgiften kring dagen då taket nås — det är den posten som "tar" utrymmet.
function ceilingDriver(points: DayPoint[], ceiling: DayPoint): Flow | null {
  const idx = points.indexOf(ceiling);
  const nearby = points.slice(Math.max(0, idx - 3), idx + 1);
  const outflows = nearby.flatMap((p) => p.outflows);
  if (outflows.length === 0) return null;
  return outflows.reduce((m, f) => (f.amount > m.amount ? f : m), outflows[0]);
}

// Nästa större inbetalning — det som "fyller på" utrymmet igen.
function nextRefill(points: DayPoint[], afterIdx = 0, min = 40_000): Flow | null {
  for (const p of points.slice(afterIdx)) {
    const big = p.inflows.find((f) => f.amount >= min);
    if (big) return big;
  }
  return null;
}

function rowFor(id: string, label: string, points: DayPoint[]): CapacityRow {
  const trough = troughOf(points);
  const ceiling = ceilingOf(points);
  let sub: string;
  if (ceiling) {
    const driver = ceilingDriver(points, ceiling);
    sub = `Taket nås ${fmtDay(ceiling.date, true)}${driver ? ` · ${driver.label}` : ""}`;
  } else {
    const refill = nextRefill(points);
    sub = refill
      ? `Fylls på ${fmtDay(refill.date, true)} · ${refill.label}`
      : "Inga större inbetalningar bokade";
  }
  return {
    id,
    label,
    sub,
    usedPct: usedPctFor(trough.endCash),
    tone: toneFor(trough.endCash),
    ceilingDate: ceiling?.date ?? null,
    trough: trough.endCash,
  };
}

function scenarioRow(s: Scenario): CapacityRow {
  const label =
    s.orderAmount > 0
      ? `${s.name} · ${Math.round(s.orderAmount / 1000)} k`
      : "Utan ny order";
  return rowFor(s.id, label, project(s, s.orderAmount > 0));
}

export function capacityMethodLine(): string {
  const total = Math.round(HEADROOM_TOTAL / 1000).toLocaleString("sv-SE");
  const cushion = Math.round(CUSHION / 1000).toLocaleString("sv-SE");
  return `Utrymmet är allt över kudden på ${cushion} k — idag ${total} k. Procenten visar hur mycket av det som redan är intecknat av det som ligger framför.`;
}

export function capacitySnapshot(): CapacitySnapshot {
  const base = project(SCENARIOS.find((s) => s.id === "none")!, false);
  const period = rowFor("period", "Närmaste 30 dagarna", base.slice(0, 30));
  const horizon = [
    scenarioRow(SCENARIOS.find((s) => s.id === "none")!),
    ...SCENARIOS.filter((s) => s.orderAmount > 0).map(scenarioRow),
  ];

  const refill = nextRefill(base.slice(0, 30), 0, 100_000);
  const boost: CapacityBoost | null = refill
    ? { amount: refill.amount, date: refill.date, label: refill.label }
    : null;

  return {
    period,
    horizon,
    boost,
    headroomTotal: HEADROOM_TOTAL,
    cushion: CUSHION,
  };
}
