import { addDays, iso, parseIso } from "./utils";

/** Riktigt datum, för reskontran vi läser är daterad i verklig tid. */
export const TODAY = parseIso(new Date().toISOString().slice(0, 10));

export type FlowKind = "in" | "out";
export type FlowSource = "bank" | "boks" | "order";

/**
 * Hur säker en post är. Det avgör hur mycket vikt den ska få — inte hur
 * stor den är. En avtalad lön är hårdare än en kund som brukar betala sent.
 */
export type Certainty = "fast" | "forutsagbar" | "antagande";

export type Flow = {
  date: string;
  amount: number;
  label: string;
  kind: FlowKind;
  source: FlowSource;
  certainty: Certainty;
  /** Varför vi vet det här — visas i klartext, inte som gissning. */
  basis: string;
};

export const CERTAINTY_LABEL: Record<Certainty, string> = {
  fast: "Fast",
  forutsagbar: "Förutsägbar",
  antagande: "Antagande",
};

export const CERTAINTY_TIP: Record<Certainty, string> = {
  fast: "Avtalad post. Datum och belopp är kända i förväg.",
  forutsagbar: "Faktura med förfallodatum, justerad efter hur motparten brukar betala.",
  antagande: "Ingen faktura ännu. Vi räknar med den, men den kan utebli.",
};

export type Risk = "clear" | "watch" | "storm" | "gap";

/** Kassaläget en given dag, i klartext. Ingen väderliknelse. */
export const RISK_LABEL: Record<Risk, string> = {
  clear: "Täckt",
  watch: "Tunn marginal",
  storm: "Under noll",
  gap: "Lucka i data",
};

export type DayPoint = {
  date: string;
  weekday: string;
  startCash: number;
  endCash: number;
  inflows: Flow[];
  outflows: Flow[];
  risk: Risk;
};

export type ScenarioId = "german" | "service" | "none";

export type Scenario = {
  id: ScenarioId;
  name: string;
  blurb: string;
  orderAmount: number;
  materialCost: number;
  materialDate: string;
  startDate: string;
  payDate: string;
  customer: string;
};

export const COMPANY = {
  name: "Nordborr AB",
  org: "559184-2201",
  trade: "Bergvärme, pålning, geoteknik",
  people: 11,
  city: "Västerås",
  cash: 418_400,
  completeness: 0.71,
  bankShare: 0.82,
  booksShare: 0.61,
};

export const SCENARIOS: Scenario[] = [
  {
    id: "german",
    name: "Tysk order",
    blurb: "Müller Tiefbau, 840 k. Material måste köpas nu. De betalar om 60 dagar.",
    orderAmount: 840_000,
    materialCost: 520_000,
    materialDate: "2026-12-02",
    startDate: "2026-12-08",
    payDate: "2027-02-06",
    customer: "Müller Tiefbau GmbH",
  },
  {
    id: "service",
    name: "Servicejobb",
    blurb: "Befintlig kund. 95 k. Lite material, betalt inom 14 dagar.",
    orderAmount: 95_000,
    materialCost: 18_000,
    materialDate: "2026-11-24",
    startDate: "2026-11-25",
    payDate: "2026-12-09",
    customer: "Mälarenergi AB",
  },
  {
    id: "none",
    name: "Ingen ny order",
    blurb: "Bara det som redan ligger. Lön, material, inbetalningar.",
    orderAmount: 0,
    materialCost: 0,
    materialDate: "2026-11-20",
    startDate: "2026-11-20",
    payDate: "2026-11-20",
    customer: "—",
  },
];

const BASE_FLOWS: Flow[] = [
  { date: "2026-11-21", amount: 42_000, label: "Kund, pålning Enköping", kind: "in", source: "bank", certainty: "forutsagbar", basis: "Faktura förfaller idag, kunden har betalat i tid tre gånger" },
  { date: "2026-11-24", amount: 61_500, label: "Diesel och slitage", kind: "out", source: "boks", certainty: "forutsagbar", basis: "Leverantörsfaktura med förfallodatum" },
  { date: "2026-11-25", amount: 187_200, label: "Lön november", kind: "out", source: "boks", certainty: "fast", basis: "Lön den 25:e, 11 anställda" },
  { date: "2026-11-27", amount: 28_400, label: "Hyra maskinpark", kind: "out", source: "boks", certainty: "fast", basis: "Löpande hyresavtal, samma belopp varje månad" },
  { date: "2026-11-28", amount: 92_000, label: "Kundfordran, Villa Åkerby", kind: "in", source: "bank", certainty: "forutsagbar", basis: "Faktura förfaller, kunden betalar normalt på dagen" },
  { date: "2026-12-01", amount: 38_000, label: "Skattekonto, arbetsgivaravgift", kind: "out", source: "boks", certainty: "fast", basis: "Skatteverket, förfaller den 12:e — dras den 1:a" },
  { date: "2026-12-04", amount: 140_000, label: "Abetong, etapp 2", kind: "in", source: "bank", certainty: "forutsagbar", basis: "Faktura CINV-ABETONG förfaller, kunden betalar i tid" },
  { date: "2026-12-10", amount: 48_700, label: "Borrkronor, Atlas", kind: "out", source: "boks", certainty: "forutsagbar", basis: "Leverantörsfaktura med förfallodatum" },
  { date: "2026-12-12", amount: 19_500, label: "Försäkring maskiner", kind: "out", source: "boks", certainty: "fast", basis: "Årsavtal, kvartalsvis debitering" },
  { date: "2026-12-15", amount: 76_000, label: "Kund, väntad betalning", kind: "in", source: "bank", certainty: "antagande", basis: "Ingen faktura ännu — bygger på fjolårets december" },
  { date: "2026-12-18", amount: 22_000, label: "Underentreprenör", kind: "out", source: "boks", certainty: "forutsagbar", basis: "Leverantörsfaktura med förfallodatum" },
  { date: "2026-12-23", amount: 187_200, label: "Lön december", kind: "out", source: "boks", certainty: "fast", basis: "Lön, tidigarelagd till den 23:e för helgen" },
  { date: "2026-12-29", amount: 14_800, label: "El och verkstad", kind: "out", source: "boks", certainty: "fast", basis: "Löpande abonnemang" },
  { date: "2027-01-08", amount: 31_000, label: "Vinterservice", kind: "in", source: "bank", certainty: "antagande", basis: "Låg säsong — snittet för januari de tre senaste åren" },
  { date: "2027-01-15", amount: 41_200, label: "Leverantör, stål", kind: "out", source: "boks", certainty: "forutsagbar", basis: "Leverantörsfaktura med förfallodatum" },
  { date: "2027-01-25", amount: 187_200, label: "Lön januari", kind: "out", source: "boks", certainty: "fast", basis: "Lön den 25:e, 11 anställda" },
  { date: "2027-01-12", amount: 185_000, label: "Slutfaktura, Mälarenergi", kind: "in", source: "bank", certainty: "forutsagbar", basis: "Etapp 3 godkänd, faktura förfaller 12 jan" },
  { date: "2027-02-02", amount: 55_000, label: "Kund, eftersläp", kind: "in", source: "bank", certainty: "antagande", basis: "Förfallna fakturor som ännu inte betalats" },
  { date: "2027-02-10", amount: 210_000, label: "Bergvärme, Hallstahammar", kind: "in", source: "bank", certainty: "forutsagbar", basis: "Tecknat kontrakt, fakturering vid driftsättning" },
  { date: "2027-02-25", amount: 187_200, label: "Lön februari", kind: "out", source: "boks", certainty: "fast", basis: "Lön den 25:e, 11 anställda" },
  { date: "2027-03-06", amount: 265_000, label: "Pålning, Västerås hamn", kind: "in", source: "bank", certainty: "forutsagbar", basis: "Ramavtal, delfaktura per etapp" },
  { date: "2027-03-25", amount: 187_200, label: "Lön mars", kind: "out", source: "boks", certainty: "fast", basis: "Lön den 25:e, 11 anställda" },
  { date: "2027-04-09", amount: 295_000, label: "Geoteknik, Enköping", kind: "in", source: "bank", certainty: "antagande", basis: "Offert accepterad muntligt, inte fakturerad" },
  { date: "2027-04-26", amount: 187_200, label: "Lön april", kind: "out", source: "boks", certainty: "fast", basis: "Lön den 25:e, faller på helg" },
  { date: "2027-05-07", amount: 240_000, label: "Bergvärme, etapp 2", kind: "in", source: "bank", certainty: "antagande", basis: "Säsongssnitt för maj de tre senaste åren" },
];

const WEEKDAYS = ["sön", "mån", "tis", "ons", "tor", "fre", "lör"];

export function daysAhead(n = 84) {
  return Array.from({ length: n }, (_, i) => addDays(TODAY, i));
}

/**
 * Underlaget som projektionen vilar på, satt av routens loader innan något
 * räknas. Ett bolag har en reskontra, så lösaren och orderhjälpen kan läsa den
 * genom `baseFlows()` utan att varje anropskedja behöver bära den vidare.
 *
 * Är den inte satt gäller demoflödet — en tom bok skulle se ut som ett bolag
 * helt utan åtaganden, vilket är det farligaste svaret vi kan ge.
 */
let LEDGER: { cash: number; flows: Flow[] } | null = null;

export function setLedger(ledger: { cash: number; flows: Flow[] }) {
  LEDGER = ledger;
}

export function currentCash(): number {
  return LEDGER?.cash ?? COMPANY.cash;
}

/** Grundflödet utan någon ny order — utgångspunkt för egna beräkningar. */
export function baseFlows(): Flow[] {
  return LEDGER ? [...LEDGER.flows] : [...BASE_FLOWS];
}

export function buildFlows(scenario: Scenario, takeOrder: boolean): Flow[] {
  const extra: Flow[] = [];
  if (takeOrder && scenario.orderAmount > 0) {
    extra.push({
      date: scenario.materialDate,
      amount: scenario.materialCost,
      label: `Material, ${scenario.customer}`,
      kind: "out",
      source: "order",
      certainty: "fast",
      basis: "Materialet måste köpas för att ordern ska kunna levereras",
    });
    extra.push({
      date: scenario.payDate,
      amount: scenario.orderAmount,
      label: `Betalning, ${scenario.customer}`,
      kind: "in",
      source: "order",
      certainty: scenario.id === "german" ? "antagande" : "forutsagbar",
      basis:
        scenario.id === "german"
          ? "Avtalat 60 dagar — men de tre tidigare fakturorna betalades i snitt 23 dagar sent"
          : "Befintlig kund, betalar inom 14 dagar",
    });
  }
  return [...BASE_FLOWS, ...extra];
}

function riskFor(endCash: number, payrollSoon: boolean): Risk {
  if (endCash < 0) return "storm";
  if (endCash < 80_000 || payrollSoon) return "watch";
  return "clear";
}

export function project(scenario: Scenario, takeOrder: boolean): DayPoint[] {
  return projectWith(buildFlows(scenario, takeOrder));
}

/**
 * Samma projektion, men för en godtycklig uppsättning poster. Horisonten måste
 * vara lång nog att kundens betalning ryms — annars ser varje order ut som en
 * ren utgift.
 */
export function projectWith(flows: Flow[], horizon = 84): DayPoint[] {
  let cash = currentCash();
  return daysAhead(horizon).map((d) => {
    const key = iso(d);
    const todays = flows.filter((f) => f.date === key);
    const inflows = todays.filter((f) => f.kind === "in");
    const outflows = todays.filter((f) => f.kind === "out");
    const startCash = cash;
    const net =
      inflows.reduce((s, f) => s + f.amount, 0) -
      outflows.reduce((s, f) => s + f.amount, 0);
    cash = startCash + net;
    const payrollSoon = outflows.some((f) => f.label.toLowerCase().includes("lön"));
    return {
      date: key,
      weekday: WEEKDAYS[d.getDay()],
      startCash,
      endCash: cash,
      inflows,
      outflows,
      risk: riskFor(cash, payrollSoon && cash < 200_000),
    };
  });
}

export type VerdictId = "yes" | "no" | "maybe" | "gap";

export type Verdict = {
  id: VerdictId;
  word: string;
  line: string;
  why: string[];
  trough: number;
  troughDate: string;
  needed: number;
  haveOnSpendDay: number;
};

export function decide(scenario: Scenario, takeOrder: boolean): Verdict {
  if (!takeOrder || scenario.orderAmount === 0) {
    const pts = project(scenario, false);
    const trough = pts.reduce((m, p) => (p.endCash < m.endCash ? p : m), pts[0]);
    return {
      id: trough.endCash < 0 ? "no" : trough.endCash < 60_000 ? "maybe" : "yes",
      word: trough.endCash < 0 ? "Nej" : trough.endCash < 60_000 ? "Tveksamt" : "Ja",
      line:
        trough.endCash < 0
          ? "Även utan ny order går kassan under noll."
          : trough.endCash < 60_000
            ? "Det går — men kassan blir tunn runt lön."
            : "Utan ny order klarar ni er.",
      why: [
        `Lägsta kassa ${trough.endCash.toLocaleString("sv-SE")} kr ${trough.date}`,
        "Lön 25:e är den stora smällen",
      ],
      trough: trough.endCash,
      troughDate: trough.date,
      needed: 0,
      haveOnSpendDay: currentCash(),
    };
  }

  const withOrder = project(scenario, true);
  const spend = withOrder.find((p) => p.date === scenario.materialDate) ?? withOrder[0];
  const trough = withOrder.reduce((m, p) => (p.endCash < m.endCash ? p : m), withOrder[0]);
  const have = spend.startCash;
  const needed = scenario.materialCost;

  if (COMPANY.completeness < 0.4) {
    return {
      id: "gap",
      word: "Vet inte",
      line: "För lite data för att svara säkert.",
      why: ["Banken ger ofullständig data", "Bokföringen släpar"],
      trough: trough.endCash,
      troughDate: trough.date,
      needed,
      haveOnSpendDay: have,
    };
  }

  if (trough.endCash < -20_000) {
    return {
      id: "no",
      word: "Nej",
      line: `Materialet på ${needed.toLocaleString("sv-SE")} kr tar kassan under noll.`,
      why: [
        `På ${scenario.materialDate} har ni ungefär ${have.toLocaleString("sv-SE")} kr`,
        `Kunden betalar först ${scenario.payDate}`,
        `Lägsta punkt ${trough.endCash.toLocaleString("sv-SE")} kr`,
        ...(scenario.id === "german"
          ? ["Atlas-fakturan bytte IBAN mot fyra tidigare utbetalningar. Betala inte den."]
          : []),
      ],
      trough: trough.endCash,
      troughDate: trough.date,
      needed,
      haveOnSpendDay: have,
    };
  }

  if (trough.endCash < 80_000) {
    return {
      id: "maybe",
      word: "Tveksamt",
      line: "Det går knappt — en sen kund eller en lön och det brister.",
      why: [
        `Marginal efter material: ${trough.endCash.toLocaleString("sv-SE")} kr`,
        "December är låg säsong för borrning",
      ],
      trough: trough.endCash,
      troughDate: trough.date,
      needed,
      haveOnSpendDay: have,
    };
  }

  return {
    id: "yes",
    word: "Ja",
    line: "Kassan täcker materialet och lönen efteråt.",
    why: [
      `Efter inköpet ligger ni på plus`,
      `Lägsta punkt ${trough.endCash.toLocaleString("sv-SE")} kr ${trough.date}`,
    ],
    trough: trough.endCash,
    troughDate: trough.date,
    needed,
    haveOnSpendDay: have,
  };
}

export function sidekickNotes(scenario: Scenario, verdict: Verdict): string[] {
  const notes = [
    "Bygg och borrning. December–februari är ofta stilla. Maskinerna rullar, fakturorna gör det inte.",
  ];
  if (scenario.id === "german") {
    notes.push(
      "Tyska byggbolag kör lean. Tre gamla Müller-fakturor i Zwapgrid matchar Open Payments — alla sena. Inte en gissning.",
    );
  }
  if (verdict.id === "no") {
    notes.push(
      "Det här är samma fälla som när man tar en stor order och sen inte har täckning för inköpet.",
    );
  }
  if (scenario.id === "service") {
    notes.push("Kort cykel. Befintlig kund. Låg materialrisk.");
  }
  notes.push("Jag gissar bransch från transaktionerna. Jag fattar inte beslutet.");
  return notes;
}
