import type { CiteId } from "./citations";
import {
  SCENARIOS,
  TODAY,
  currentCash,
  project,
  type DayPoint,
  type Risk,
  type Scenario,
} from "./engine";
import { formatSek, iso, parseIso } from "./utils";

/** Säkerhetskudde. Under den vill ingen hamna, även om kontot är på plus. */
export const CUSHION = 80_000;

/** Referensjobb vi mäter utrymmet i — "hur många sådana till får plats?". */
const REFERENCE = SCENARIOS.find((s) => s.id === "service")!;

export type TimelineDay = {
  date: string;
  endCash: number;
  risk: Risk;
  /** Fast händelse den här dagen — lön, skatt, hyra. Blir en tick på tidslinjen. */
  fixed: string | null;
};

export type Driver = {
  date: string;
  label: string;
  amount: number;
  cites: CiteId[];
};

export type CapacitySummary = {
  /** Svaret, i klartext. Det enda de flesta behöver läsa. */
  headline: string;
  sub: string;
  ok: boolean;
  /** Kassan går faktiskt under noll, inte bara under kudden. */
  under: boolean;
  /** Kvar över kudden när det är som tunnast. Noll när det inte räcker. */
  headroomNow: number;
  /** Hur långt under kudden det dyker. Noll när det räcker. */
  shortfall: number;
  ordersLeft: number;
  referenceName: string;
  ceilingDate: string | null;
  days: TimelineDay[];
  drivers: Driver[];
  cites: CiteId[];
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

function troughOf(points: DayPoint[]): DayPoint {
  return points.reduce((m, p) => (p.endCash < m.endCash ? p : m), points[0]);
}

function fixedOn(day: DayPoint): string | null {
  const fixed = day.outflows.find((f) => f.certainty === "fast");
  return fixed ? fixed.label : null;
}

function citeFor(label: string): CiteId[] {
  const l = label.toLowerCase();
  if (l.includes("lön")) return ["model-payroll", "zg-lag"];
  if (l.includes("material")) return ["zg-sinv-atlas", "model-order"];
  if (l.includes("skatt")) return ["model-payroll"];
  if (l.includes("atlas") || l.includes("borrkronor")) return ["zg-sinv-atlas"];
  return ["zg-lag"];
}

/**
 * Hur många referensjobb till som får plats innan kassan går under kudden.
 * Vi lägger på ett jobb i taget och räknar om — inte en division.
 */
function ordersThatFit(base: DayPoint[]): number {
  const cost = REFERENCE.materialCost;
  const room = troughOf(base).endCash - CUSHION;
  if (room <= 0) return 0;
  return Math.floor(room / cost);
}

export function capacityFor(scenario: Scenario, takeOrder: boolean): CapacitySummary {
  const points = project(scenario, takeOrder);
  const window = points.slice(0, 84);
  const trough = troughOf(window);
  const ceiling = window.find((p) => p.endCash < CUSHION) ?? null;
  const room = trough.endCash - CUSHION;
  const headroomNow = Math.max(0, room);
  const shortfall = Math.max(0, -room);
  const ordersLeft = ordersThatFit(window);

  const drivers: Driver[] = window
    .flatMap((p) => p.outflows.map((f) => ({ ...f, day: p.date })))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4)
    .map((f) => ({
      date: f.day,
      label: f.label,
      amount: f.amount,
      cites: citeFor(f.label),
    }));

  const days: TimelineDay[] = window.map((p) => ({
    date: p.date,
    endCash: p.endCash,
    risk: p.risk,
    fixed: fixedOn(p),
  }));

  const ok = !ceiling;
  let headline: string;
  let sub: string;

  if (ok) {
    headline =
      ordersLeft > 1
        ? `Ja — ${ordersLeft} jobb till får plats`
        : ordersLeft === 1
          ? "Ja — ett jobb till får plats"
          : "Ja, men inget mer";
    sub = `Kassan håller sig över kudden hela perioden. Lägst ${formatSek(trough.endCash, true)} den ${fmtDay(trough.date)}.`;
  } else {
    headline = `Nej — utrymmet tar slut ${fmtDay(ceiling.date)}`;
    sub =
      trough.endCash < 0
        ? `Kassan går under noll den ${fmtDay(trough.date)}, som lägst −${formatSek(Math.abs(trough.endCash), true)}.`
        : `Kassan dyker under kudden den ${fmtDay(ceiling.date)} och stannar tunn.`;
  }

  return {
    headline,
    sub,
    ok,
    under: trough.endCash < 0,
    headroomNow,
    shortfall,
    ordersLeft,
    referenceName: REFERENCE.name.toLowerCase(),
    ceilingDate: ceiling?.date ?? null,
    days,
    drivers,
    cites: ["op-balance", "zg-sinv-atlas", "zg-lag"],
  };
}

/** Läget just nu, utan ny order — det som sidopanelen och onboardingen visar. */
export function baselineCapacity(): CapacitySummary {
  return capacityFor(SCENARIOS.find((s) => s.id === "none")!, false);
}

export function todayIso(): string {
  return iso(TODAY);
}

export function methodLine(): string {
  const cushion = Math.round(CUSHION / 1000).toLocaleString("sv-SE");
  return `Utrymmet är allt över kudden på ${cushion} k. Vi projicerar saldot dag för dag i 12 veckor — bankens saldo, fakturornas förfallodatum justerade efter hur motparten brukar betala, och ordern där dess utgifter faktiskt landar. Taket är första dagen kassan dyker under kudden. Startsaldo ${currentCash().toLocaleString("sv-SE")} kr.`;
}
