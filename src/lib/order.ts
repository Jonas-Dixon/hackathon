import { CUSHION, fmtDay } from "./capacity";
import type { CiteId } from "./citations";
import { TODAY, baseFlows, projectWith, type DayPoint, type Flow } from "./engine";
import { ORDER_TEMPLATE } from "./profile";
import { addDays, formatSek, iso, parseIso } from "./utils";

/** Det enda användaren fyller i. Allt annat ärvs från mallen. */
export type OrderDraft = {
  amount: number;
  orderDate: string;
};

export type VerdictId = "yes" | "tight" | "no";

export type Judgement = {
  verdict: VerdictId;
  /** Svaret i en mening. */
  headline: string;
  reason: string;
  /** Tidigaste datum ordern håller, när dagens datum inte gör det. */
  earliest: string | null;
  /** Vad som måste ändras för att det ska gå på det datum de valde. */
  blocker: { label: string; date: string; amount: number } | null;
  materialCost: number;
  materialDate: string;
  paymentDate: string;
  trough: number;
  troughDate: string;
  shortfall: number;
  days: DayPoint[];
  cites: CiteId[];
};

export const MAX_SHIFT_DAYS = 120;

export function defaultDraft(): OrderDraft {
  return { amount: 280_000, orderDate: iso(addDays(TODAY, 12)) };
}

/** Materialet betalas i förskott, kunden betalar långt senare — det är hela problemet. */
export function orderFlows(draft: OrderDraft): Flow[] {
  const t = ORDER_TEMPLATE;
  const placed = parseIso(draft.orderDate);
  const materialCost = Math.round(draft.amount * t.materialShare.value);
  const materialDate = iso(placed);
  const paymentDate = iso(
    addDays(placed, t.paymentTermDays.value + t.customerLateDays.value),
  );

  return [
    {
      date: materialDate,
      amount: materialCost,
      label: `Material, ${t.customer.value}`,
      kind: "out",
      source: "order",
      certainty: "fast",
      basis: `${Math.round(t.materialShare.value * 100)} % av ordervärdet, betalas innan leverans`,
    },
    {
      date: paymentDate,
      amount: draft.amount,
      label: `Betalning, ${t.customer.value}`,
      kind: "in",
      source: "order",
      certainty: "antagande",
      basis: `Netto ${t.paymentTermDays.value} dagar plus ${t.customerLateDays.value} dagar som historiken visar`,
    },
  ];
}

function troughOf(days: DayPoint[]): DayPoint {
  return days.reduce((m, p) => (p.endCash < m.endCash ? p : m), days[0]);
}

/**
 * Posten som faktiskt tippar kassan i botten — den största utbetalningen i
 * dagarna närmast bottenläget, inte den största i hela perioden.
 */
function blockerFor(days: DayPoint[], trough: DayPoint): Judgement["blocker"] {
  const end = days.indexOf(trough);
  const window = days.slice(Math.max(0, end - 10), end + 1);
  const outs = window.flatMap((p) => p.outflows.map((f) => ({ f, date: p.date })));
  if (!outs.length) return null;
  const worst = outs.reduce((m, o) => (o.f.amount > m.f.amount ? o : m), outs[0]);
  return { label: worst.f.label, date: worst.date, amount: worst.f.amount };
}

/** Måste täcka orderdatum + betalningsvillkor + förseningen, med marginal. */
export const HORIZON_DAYS = 300;

function troughFor(draft: OrderDraft): { days: DayPoint[]; trough: DayPoint } {
  const days = projectWith([...baseFlows(), ...orderFlows(draft)], HORIZON_DAYS);
  return { days, trough: troughOf(days) };
}

/**
 * Rullar orderdatumet framåt en dag i taget tills kassan håller sig över
 * kudden hela vägen. Returnerar null om den aldrig gör det inom horisonten.
 */
export function earliestSafeDate(draft: OrderDraft): string | null {
  const start = parseIso(draft.orderDate);
  for (let shift = 1; shift <= MAX_SHIFT_DAYS; shift++) {
    const candidate = iso(addDays(start, shift));
    const { trough } = troughFor({ ...draft, orderDate: candidate });
    if (trough.endCash >= CUSHION) return candidate;
  }
  return null;
}

export function judge(draft: OrderDraft): Judgement {
  const t = ORDER_TEMPLATE;
  const { days, trough } = troughFor(draft);
  const materialCost = Math.round(draft.amount * t.materialShare.value);
  const placed = parseIso(draft.orderDate);
  const paymentDate = iso(addDays(placed, t.paymentTermDays.value + t.customerLateDays.value));
  const shortfall = Math.max(0, CUSHION - trough.endCash);
  const cites: CiteId[] = ["op-balance", "zg-cinv-muller", "zg-sinv-atlas", "model-order"];

  if (trough.endCash >= CUSHION) {
    return {
      verdict: "yes",
      headline: "Ja — lägg ordern",
      reason: `Kassan bottnar på ${formatSek(trough.endCash, true)} den ${fmtDay(trough.date)}, kvar över kudden hela vägen.`,
      earliest: null,
      blocker: null,
      materialCost,
      materialDate: draft.orderDate,
      paymentDate,
      trough: trough.endCash,
      troughDate: trough.date,
      shortfall: 0,
      days,
      cites,
    };
  }

  const blocker = blockerFor(days, trough);

  if (trough.endCash >= 0) {
    return {
      verdict: "tight",
      headline: "Ja, men det blir tunt",
      reason: `Kassan går ner till ${formatSek(trough.endCash, true)} den ${fmtDay(trough.date)}. En sen kund och det brister.`,
      earliest: earliestSafeDate(draft),
      blocker,
      materialCost,
      materialDate: draft.orderDate,
      paymentDate,
      trough: trough.endCash,
      troughDate: trough.date,
      shortfall,
      days,
      cites,
    };
  }

  const earliest = earliestSafeDate(draft);
  return {
    verdict: "no",
    headline: earliest ? `Nej — men lägg den ${fmtDay(earliest)}` : "Nej — den ryms inte i år",
    reason: `Materialet på ${formatSek(materialCost, true)} tar kassan till ${formatSek(trough.endCash, true)} den ${fmtDay(trough.date)}. Kunden betalar först ${fmtDay(paymentDate)}.`,
    earliest,
    blocker,
    materialCost,
    materialDate: draft.orderDate,
    paymentDate,
    trough: trough.endCash,
    troughDate: trough.date,
    shortfall,
    days,
    cites,
  };
}
