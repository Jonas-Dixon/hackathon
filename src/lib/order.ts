import { CUSHION, fmtDay } from "./capacity";
import type { CiteId } from "./citations";
import { TODAY, baseFlows, projectWith, type DayPoint, type Flow } from "./engine";
import { strings } from "./lang";
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
  /** Samma order lagd på det tidigaste datum som håller — kurvan att jämföra mot. */
  suggestedDays: DayPoint[] | null;
  /** Utan någon ny order alls. Referenslinjen. */
  baselineDays: DayPoint[];
  /** Underskott som finns oavsett ordern, och som inget orderdatum lagar. */
  baselineHole: { date: string; cash: number; blocker: Judgement["blocker"] } | null;
  cites: CiteId[];
};

export const MAX_SHIFT_DAYS = 120;

export function defaultDraft(): OrderDraft {
  return { amount: 280_000, orderDate: iso(addDays(TODAY, 12)) };
}

/** Materialet betalas i förskott, kunden betalar långt senare — det är hela problemet. */
export function orderFlows(draft: OrderDraft): Flow[] {
  const t = ORDER_TEMPLATE;
  const L = strings();
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
      label: L.flow.orderMaterial(t.customer.value),
      kind: "out",
      source: "order",
      certainty: "fast",
      basis: L.flow.orderMaterialBasis(Math.round(t.materialShare.value * 100)),
    },
    {
      date: paymentDate,
      amount: draft.amount,
      label: L.flow.orderPayment(t.customer.value),
      kind: "in",
      source: "order",
      certainty: "antagande",
      basis: L.flow.orderPaymentBasis(t.paymentTermDays.value, t.customerLateDays.value),
    },
  ];
}

function troughOf(days: DayPoint[]): DayPoint {
  if (!days.length) {
    return {
      date: iso(TODAY),
      weekday: "",
      startCash: 0,
      endCash: 0,
      inflows: [],
      outflows: [],
      risk: "gap",
    };
  }
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

/** Dagarna efter kundens betalning som fortfarande hör till ordern. */
const TAIL_DAYS = 30;

/**
 * Spannet en order faktiskt påverkar: materialet ut, kunden betalar, och en
 * marginal för lönen strax efter.
 *
 * Bottnen mäts bara här. Längre bort vet reskontran vad som ska ut i tolv
 * månader men bara vad som ska in i tre — att döma på det spannet vore att
 * stoppa varje order för ett underskott som bara beror på att fakturorna för
 * hösten ännu inte är skrivna.
 */
export function orderSpanDays(): number {
  const t = ORDER_TEMPLATE;
  return t.paymentTermDays.value + t.customerLateDays.value + TAIL_DAYS;
}

/** Horisonten måste nå förbi ordern även när den skjuts framåt i tiden. */
export function horizonFor(orderDate: string): number {
  const placed = parseIso(orderDate);
  const offset = Math.round((placed.getTime() - TODAY.getTime()) / 86_400_000);
  return Math.max(0, offset) + orderSpanDays();
}

/**
 * Bottnen inom orderns eget spann — samma fönster som kurvan ritar.
 *
 * Fönstret börjar på orderdatumet, för frågan är vad *ordern* gör med kassan.
 * Ett hål som redan ligger före orderdatumet hör inte hit: det finns kvar hur
 * mycket ordern än flyttas, och skulle bara få varje datum att se omöjligt ut.
 * Det rapporteras separat, som `baselineHole`.
 */
export function troughWithin(days: DayPoint[], orderDate: string): DayPoint {
  const from = Math.max(0, days.findIndex((d) => d.date === orderDate));
  const scope = days.slice(from, from + orderSpanDays());
  return troughOf(scope.length ? scope : days);
}

/**
 * Underskott som finns utan någon ny order alls, fram till att ordern är klar.
 *
 * Att flytta ordern lagar inte det här — därför hålls det utanför domen, men
 * det får inte tigas ihjäl heller: kassan kan gå back innan ordern ens är lagd.
 */
function holeBefore(baselineDays: DayPoint[], orderDate: string): Judgement["baselineHole"] {
  const placed = Math.max(0, baselineDays.findIndex((d) => d.date === orderDate));
  const scope = baselineDays.slice(0, placed + orderSpanDays());
  if (!scope.length) return null;
  const low = troughOf(scope);
  if (low.endCash >= 0) return null;
  return { date: low.date, cash: low.endCash, blocker: blockerFor(scope, low) };
}

function troughFor(draft: OrderDraft): { days: DayPoint[]; trough: DayPoint } {
  const days = projectWith(
    [...baseFlows(), ...orderFlows(draft)],
    horizonFor(draft.orderDate),
  );
  return { days, trough: troughWithin(days, draft.orderDate) };
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
  const L = strings();
  const { days, trough } = troughFor(draft);
  const materialCost = Math.round(draft.amount * t.materialShare.value);
  const placed = parseIso(draft.orderDate);
  const paymentDate = iso(addDays(placed, t.paymentTermDays.value + t.customerLateDays.value));
  const shortfall = Math.max(0, CUSHION - trough.endCash);
  const cites: CiteId[] = ["op-balance", "zg-cinv-muller", "zg-sinv-atlas", "model-order"];
  const baselineDays = projectWith(baseFlows(), horizonFor(draft.orderDate));
  const baselineHole = holeBefore(baselineDays, draft.orderDate);

  if (trough.endCash >= CUSHION) {
    return {
      verdict: "yes",
      headline: L.verdict.yes,
      reason: L.verdict.reasonYes(formatSek(trough.endCash, true), fmtDay(trough.date)),
      earliest: null,
      blocker: null,
      materialCost,
      materialDate: draft.orderDate,
      paymentDate,
      trough: trough.endCash,
      troughDate: trough.date,
      shortfall: 0,
      days,
      suggestedDays: null,
      baselineDays,
      baselineHole,
      cites,
    };
  }

  const blocker = blockerFor(days, trough);

  const earliest = earliestSafeDate(draft);
  const suggestedDays = earliest
    ? troughFor({ ...draft, orderDate: earliest }).days
    : null;

  if (trough.endCash >= 0) {
    return {
      verdict: "tight",
      headline: L.verdict.tight,
      reason: L.verdict.reasonTight(formatSek(trough.endCash, true), fmtDay(trough.date)),
      earliest,
      blocker,
      materialCost,
      materialDate: draft.orderDate,
      paymentDate,
      trough: trough.endCash,
      troughDate: trough.date,
      shortfall,
      days,
      suggestedDays,
      baselineDays,
      baselineHole,
      cites,
    };
  }

  return {
    verdict: "no",
    headline: earliest ? L.verdict.noEarliest(fmtDay(earliest)) : L.verdict.noNever,
    reason: L.verdict.reasonNo(
      formatSek(materialCost, true),
      formatSek(trough.endCash, true),
      fmtDay(trough.date),
      fmtDay(paymentDate),
    ),
    earliest,
    blocker,
    materialCost,
    materialDate: draft.orderDate,
    paymentDate,
    trough: trough.endCash,
    troughDate: trough.date,
    shortfall,
    days,
    suggestedDays,
    baselineDays,
    baselineHole,
    cites,
  };
}
