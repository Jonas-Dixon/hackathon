import { CUSHION, fmtDay } from "./capacity";
import { TODAY, baseFlows, projectWith, type DayPoint, type Flow } from "./engine";
import { HORIZON_DAYS, orderFlows, type OrderDraft } from "./order";
import { ORDER_TEMPLATE } from "./profile";
import { addDays, formatSek, iso, parseIso } from "./utils";

/**
 * `judge()` svarar på om ordern håller, och när den skulle hålla. Det här är
 * frågan efter: tänk om ni inte kan vänta?
 *
 * Två funktioner på samma maskineri — ändra en parameter, projicera om, titta
 * på botten:
 *
 *   levers()       — minsta ändringen som vänder svaret, och vilka som inte gör det
 *   orderCeiling() — hur stor order kassan bär över huvud taget
 *
 * Ingen av dem beslutar något. De visar vad räknandet säger; ägaren förhandlar.
 */

function troughOf(days: DayPoint[]): DayPoint {
  return days.reduce((m, p) => (p.endCash < m.endCash ? p : m), days[0]);
}

function troughFor(flows: Flow[]): DayPoint {
  return troughOf(projectWith(flows, HORIZON_DAYS));
}

/** Flytta en post n dagar, utan att röra resten av listan. */
function shift(flow: Flow, days: number): Flow {
  return { ...flow, date: iso(addDays(parseIso(flow.date), days)) };
}

function pct(n: number): string {
  return `${Math.round(n * 100)} %`;
}

export type Lever = {
  id: string;
  /** Vad man gör, i två-tre ord. */
  title: string;
  /** Exakt vad man ska be om, med siffran ifylld. Det här är det man agerar på. */
  ask: string;
  /** Vad det gör med kassan. */
  effect: string;
  trough: number;
  troughDate: string;
  /** Tar den här ändringen ensam upp botten över kudden? */
  solves: boolean;
  /** Hur mycket botten lyfts, i kronor. Sorteringsnyckel. */
  lift: number;
};

type Variant = { ask: string; effect: string; flows: Flow[] };

/**
 * Leta upp den minsta ändringen som räcker. Stegen kommer i stigande
 * "jobbighet" — vi vill be om 20 % förskott före 50 %.
 *
 * Hittar vi ingen som når över kudden returnerar vi den bästa ändå, märkt som
 * otillräcklig. Att veta att en spak inte räcker är också ett svar.
 */
function search(steps: number[], make: (step: number) => Variant | null) {
  let best: { variant: Variant; point: DayPoint } | null = null;

  for (const step of steps) {
    const variant = make(step);
    if (!variant) continue;
    const point = troughFor(variant.flows);
    if (!best || point.endCash > best.point.endCash) best = { variant, point };
    if (point.endCash >= CUSHION) return { variant, point, solved: true };
  }
  return best ? { ...best, solved: false } : null;
}

function toLever(
  id: string,
  title: string,
  found: ReturnType<typeof search>,
  baseTrough: number,
): Lever | null {
  if (!found) return null;
  const lift = found.point.endCash - baseTrough;
  return {
    id,
    title,
    ask: found.variant.ask,
    // Påstå inte att en spak löser något den inte löser. Räcker den inte ska
    // raden säga varför — det är själva svaret för de flesta av dem.
    effect: found.solved
      ? found.variant.effect
      : lift === 0
        ? `Rör inte botten. Hålet ligger ${fmtDay(found.point.date)}, innan några nya pengar hinner in.`
        : `Lyfter botten ${formatSek(lift, true)}, men ${formatSek(CUSHION - found.point.endCash, true)} fattas fortfarande.`,
    trough: found.point.endCash,
    troughDate: found.point.date,
    solves: found.solved,
    lift,
  };
}

/** Den största utbetalningen som faktiskt går att skjuta på. Lön och skatt gör det inte. */
function movablePayable(flows: Flow[]): Flow | null {
  const locked = /lön|skatt|hyra|försäkring/i;
  return (
    flows
      .filter((f) => f.kind === "out" && f.source !== "order" && !locked.test(f.label))
      .sort((a, b) => b.amount - a.amount)[0] ?? null
  );
}

/** Den största inbetalningen som ligger efter botten — den är värd ett telefonsamtal. */
function pullableReceivable(flows: Flow[], troughDate: string): Flow | null {
  return (
    flows
      .filter((f) => f.kind === "in" && f.source !== "order" && f.date > troughDate)
      .sort((a, b) => b.amount - a.amount)[0] ?? null
  );
}

/**
 * Vad skulle göra det till ett ja — på det datum de faktiskt valde? Sorterat:
 * de som räcker först, störst lyft överst.
 */
export function levers(draft: OrderDraft): Lever[] {
  if (draft.amount <= 0) return [];

  const others = baseFlows();
  const order = orderFlows(draft);
  const material = order.find((f) => f.kind === "out");
  const payment = order.find((f) => f.kind === "in");
  if (!material || !payment) return [];

  const basePoint = troughFor([...others, ...order]);
  const baseTrough = basePoint.endCash;

  // Ligger botten redan över kudden är frågan "vad skulle göra det till ett ja?"
  // meningslös — det är ett ja. Då hade varje spak "löst" ett icke-problem.
  if (baseTrough >= CUSHION) return [];

  const t = ORDER_TEMPLATE;
  const out: (Lever | null)[] = [];

  // 1. Förskott. Kunden betalar en del vid beställning i stället för allt på slutet.
  out.push(
    toLever(
      "deposit",
      "Förskott",
      search([0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6], (share) => {
        const amount = Math.round(draft.amount * share);
        return {
          ask: `Be ${t.customer.value} om ${pct(share)} förskott — ${formatSek(amount)} vid beställning.`,
          effect: `Pengarna finns när materialet ska betalas ${fmtDay(material.date)}.`,
          flows: [
            ...others,
            material,
            { ...payment, amount: payment.amount - amount },
            {
              ...payment,
              date: material.date,
              amount,
              label: `Förskott, ${t.customer.value}`,
              certainty: "forutsagbar",
              basis: `${pct(share)} av ordervärdet, betalas vid beställning`,
            },
          ],
        };
      }),
      baseTrough,
    ),
  );

  // 2. Kortare betalvillkor. Samma order, pengarna kommer tidigare.
  out.push(
    toLever(
      "terms",
      "Kortare villkor",
      search([7, 14, 21, 30, 45], (days) => {
        const moved = shift(payment, -days);
        if (moved.date <= draft.orderDate) return null;
        return {
          ask: `Förhandla ner betalningen ${days} dagar — ${fmtDay(moved.date)} i stället för ${fmtDay(payment.date)}.`,
          effect: `Betalningen hinner in före botten den ${fmtDay(basePoint.date)}.`,
          flows: [...others, material, moved],
        };
      }),
      baseTrough,
    ),
  );

  // 3. Kredit på materialet. Ordern ligger kvar på sitt datum — bara fakturan flyttas.
  out.push(
    toLever(
      "material",
      "Kredit på materialet",
      search([14, 30, 45, 60], (days) => {
        const moved = shift(material, days);
        return {
          ask: `Be leverantören om ${days} dagars kredit — betala materialet ${fmtDay(moved.date)}.`,
          effect: `Ordern ligger kvar ${fmtDay(draft.orderDate)}, bara utbetalningen flyttas.`,
          flows: [...others, moved, payment],
        };
      }),
      baseTrough,
    ),
  );

  // 4. Ring en kund som redan är skyldig er pengar.
  const receivable = pullableReceivable(others, basePoint.date);
  if (receivable) {
    const rest = others.filter((f) => f !== receivable);
    out.push(
      toLever(
        "receivable",
        "Ring en kund",
        search([7, 14, 21, 30], (days) => {
          const moved = shift(receivable, -days);
          if (moved.date < iso(TODAY)) return null;
          return {
            ask: `Tidigarelägg ${receivable.label} med ${days} dagar — ${formatSek(receivable.amount)} den ${fmtDay(moved.date)}.`,
            effect: `Förfaller ${fmtDay(receivable.date)}, alltså efter botten den ${fmtDay(basePoint.date)}.`,
            flows: [...rest, moved, material, payment],
          };
        }),
        baseTrough,
      ),
    );
  }

  // 5. Skjut på en egen leverantör. Lön och skatt räknas inte som flyttbara.
  const payable = movablePayable(others);
  if (payable) {
    const rest = others.filter((f) => f !== payable);
    out.push(
      toLever(
        "payable",
        "Skjut en faktura",
        search([14, 21, 30, 45], (days) => {
          const moved = shift(payable, days);
          return {
            ask: `Be om ${days} dagars anstånd på ${payable.label} — ${formatSek(payable.amount)}.`,
            effect: `Flyttar en utbetalning förbi botten.`,
            flows: [...rest, moved, material, payment],
          };
        }),
        baseTrough,
      ),
    );
  }

  return out
    .filter((l): l is Lever => l !== null)
    .sort((a, b) => Number(b.solves) - Number(a.solves) || b.lift - a.lift);
}

/* ------------------------------------------------------------------ */
/* Takhöjd — hur stor order kassan bär, innan någon har frågat.         */
/* ------------------------------------------------------------------ */

/** Vi letar inte högre än så här — bortom det är det inte kassan som begränsar. */
const SCAN_CEILING = 5_000_000;
const SCAN_STEP = 20_000;

export type CeilingRow = {
  id: string;
  label: string;
  detail: string;
  termDays: number;
  depositPct: number;
  maxOrder: number;
};

/** Ett tänkt uppdrag av storlek `amount`, lagt idag, ovanpå det som redan ligger. */
function syntheticOrder(amount: number, termDays: number, depositPct: number): Flow[] {
  const t = ORDER_TEMPLATE;
  const materialDate = iso(TODAY);
  const deposit = Math.round(amount * depositPct);
  const flows: Flow[] = [
    {
      date: materialDate,
      amount: Math.round(amount * t.materialShare.value),
      label: "Material, tänkt order",
      kind: "out",
      source: "order",
      certainty: "fast",
      basis: `${pct(t.materialShare.value)} av ordervärdet, som på tidigare ordrar`,
    },
    {
      // Samma sena betalning som historiken visar — inte villkoret på pappret.
      date: iso(addDays(TODAY, termDays + t.customerLateDays.value)),
      amount: amount - deposit,
      label: "Betalning, tänkt order",
      kind: "in",
      source: "order",
      certainty: "forutsagbar",
      basis: `Netto ${termDays} dagar plus ${t.customerLateDays.value} dagar som historiken visar`,
    },
  ];
  if (deposit > 0) {
    flows.push({
      date: materialDate,
      amount: deposit,
      label: "Förskott, tänkt order",
      kind: "in",
      source: "order",
      certainty: "forutsagbar",
      basis: `${pct(depositPct)} av ordervärdet vid beställning`,
    });
  }
  return flows;
}

/**
 * Största order som håller botten över kudden. Vi skannar uppåt i stället för
 * att dela intervallet — botten rör sig inte alltid monotont med ordervärdet
 * (en tidig betalning kan lyfta den), och ett linjärt svep tar första punkten
 * där det faktiskt brister.
 */
export function maxOrder(termDays: number, depositPct: number, existing: Flow[]): number {
  let last = 0;
  for (let amount = SCAN_STEP; amount <= SCAN_CEILING; amount += SCAN_STEP) {
    if (troughFor([...existing, ...syntheticOrder(amount, termDays, depositPct)]).endCash < CUSHION) {
      return last;
    }
    last = amount;
  }
  return last;
}

/**
 * Takhöjden på tre villkor. Poängen är jämförelsen mellan raderna, inte den
 * enskilda siffran — den visar vad som faktiskt begränsar bolaget.
 */
export function orderCeiling(): CeilingRow[] {
  const existing = baseFlows();
  const rows: Omit<CeilingRow, "maxOrder">[] = [
    { id: "t30", label: "30 dagar", detail: "utan förskott", termDays: 30, depositPct: 0 },
    { id: "t60", label: "60 dagar", detail: "utan förskott", termDays: 60, depositPct: 0 },
    { id: "t60d", label: "60 dagar", detail: "med 30 % förskott", termDays: 60, depositPct: 0.3 },
  ];
  return rows.map((r) => ({ ...r, maxOrder: maxOrder(r.termDays, r.depositPct, existing) }));
}

/**
 * Vad raderna säger tillsammans. Flyttar villkoren knappt taket är det inte
 * betaltiden som begränsar — det är att materialet ska köpas först.
 */
export function ceilingInsight(rows: CeilingRow[]): string {
  const t30 = rows.find((r) => r.id === "t30")?.maxOrder ?? 0;
  const t60 = rows.find((r) => r.id === "t60")?.maxOrder ?? 0;
  const dep = rows.find((r) => r.id === "t60d")?.maxOrder ?? 0;

  if (t30 === 0) return "Kassan bär ingen ny order på de här villkoren just nu.";

  const termGain = t30 - t60;
  const depGain = dep - t60;
  if (termGain === 0 && depGain > 0) {
    return `Betalvillkoren flyttar inte taket alls — materialet binder. Ni betalar det innan jobbet ens börjar, så det spelar ingen roll om kunden betalar efter 30 eller 60 dagar. Ett förskott på 30 % ger ${formatSek(depGain, true)} mer i tak.`;
  }
  if (depGain > termGain * 2) {
    return `Betalvillkoren är inte det som begränsar er — materialet är. Att gå från 60 till 30 dagar ger ${formatSek(termGain, true)} mer i tak. Ett förskott på 30 % ger ${formatSek(depGain, true)}.`;
  }
  return `Kortare betalvillkor lyfter taket med ${formatSek(termGain, true)}. Förskott ger ${formatSek(depGain, true)}.`;
}
