import type { CiteId } from "./citations";
import type { ScenarioId } from "./engine";
import { ATLAS_GIRO_NEW, ATLAS_GIRO_OLD } from "./open-payments";

/** Shaped like Open Payments AIS (PSD2) + Zwapgrid supplier/customer invoices. */

export type BankTx = {
  id: string;
  booked: string;
  amount: number;
  creditorName: string | null;
  creditorIban: string | null;
  remittance: string | null;
};

export type Invoice = {
  id: string;
  party: string;
  kind: "supplier" | "customer";
  issueDate: string;
  dueDate: string;
  amount: number;
  status: "PAID" | "UNPAID" | "OVERDUE";
  iban: string | null;
  paidDate: string | null;
};

export type Finding = {
  id: string;
  tone: "storm" | "watch" | "clear" | "gap";
  /** Vad vi hittade, som en mening någon kan agera på. */
  title: string;
  /** Påståendet i prosa. Segmenten citeras var för sig. */
  claim: Claim[];
  /** Vad vi gör åt det. */
  action: string;
  cites: CiteId[];
};

/** En bit av ett påstående plus de källor just den biten vilar på. */
export type Claim = {
  text: string;
  cites?: CiteId[];
};

const ATLAS_OLD = "SE35 5000 0000 0583 9715 8392";
const ATLAS_NEW = "SE28 1200 0000 0130 4418 2291";

export const BANK_TX: BankTx[] = [
  {
    id: "op-4412",
    booked: "2026-09-18",
    amount: -48_700,
    creditorName: "Atlas Copco",
    creditorIban: ATLAS_OLD,
    remittance: "Borrkronor",
  },
  {
    id: "op-4418",
    booked: "2026-10-09",
    amount: -41_200,
    creditorName: "Atlas Copco",
    creditorIban: ATLAS_OLD,
    remittance: "Stål, etapp 1",
  },
  {
    id: "op-4421",
    booked: "2026-10-22",
    amount: -48_700,
    creditorName: "Atlas Copco",
    creditorIban: ATLAS_OLD,
    remittance: "Kronor okt",
  },
  {
    id: "op-4429",
    booked: "2026-11-06",
    amount: -19_800,
    creditorName: "Atlas Copco",
    creditorIban: ATLAS_OLD,
    remittance: "Servicekit",
  },
  {
    id: "op-abetong",
    booked: "2026-12-04",
    amount: 140_000,
    creditorName: null,
    creditorIban: null,
    remittance: "ETAPP2",
  },
  {
    id: "op-muller-1",
    booked: "2026-06-14",
    amount: 86_400,
    creditorName: "Muller Tiefbau",
    creditorIban: "DE89 3704 0044 0532 0130 00",
    remittance: "Sondborrning",
  },
  {
    id: "op-muller-2",
    booked: "2026-08-02",
    amount: 112_000,
    creditorName: null,
    creditorIban: "DE89 3704 0044 0532 0130 00",
    remittance: "INV-8841",
  },
  {
    id: "op-muller-3",
    booked: "2026-09-29",
    amount: 64_200,
    creditorName: "Muller Tiefbau GmbH",
    creditorIban: null,
    remittance: null,
  },
];

export const BOOKS: Invoice[] = [
  {
    id: "SINV-ATLAS-NEW",
    party: "Atlas Copco",
    kind: "supplier",
    issueDate: "2026-11-18",
    dueDate: "2026-12-02",
    amount: 520_000,
    status: "UNPAID",
    iban: ATLAS_NEW,
    paidDate: null,
  },
  {
    id: "SINV-ATLAS-1",
    party: "Atlas Copco",
    kind: "supplier",
    issueDate: "2026-09-02",
    dueDate: "2026-09-16",
    amount: 48_700,
    status: "PAID",
    iban: ATLAS_OLD,
    paidDate: "2026-09-18",
  },
  {
    id: "CINV-ABETONG",
    party: "Abetong AB",
    kind: "customer",
    issueDate: "2026-11-04",
    dueDate: "2026-12-04",
    amount: 140_000,
    status: "UNPAID",
    iban: null,
    paidDate: null,
  },
  {
    id: "CINV-MULL-1",
    party: "Müller Tiefbau GmbH",
    kind: "customer",
    issueDate: "2026-04-20",
    dueDate: "2026-05-20",
    amount: 86_400,
    status: "PAID",
    iban: null,
    paidDate: "2026-06-14",
  },
  {
    id: "CINV-MULL-2",
    party: "Müller Tiefbau GmbH",
    kind: "customer",
    issueDate: "2026-06-11",
    dueDate: "2026-07-11",
    amount: 112_000,
    status: "PAID",
    iban: null,
    paidDate: "2026-08-02",
  },
  {
    id: "CINV-MULL-3",
    party: "Müller Tiefbau GmbH",
    kind: "customer",
    issueDate: "2026-08-08",
    dueDate: "2026-09-07",
    amount: 64_200,
    status: "PAID",
    iban: null,
    paidDate: "2026-09-29",
  },
];

function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

export function triangulate(scenarioId: ScenarioId): Finding[] {
  const findings: Finding[] = [];

  const atlasPaid = BANK_TX.filter((t) => t.creditorName === "Atlas Copco" && t.amount < 0);
  const newInv = BOOKS.find((i) => i.id === "SINV-ATLAS-NEW")!;
  const oldIban = atlasPaid[0]?.creditorIban;
  if (newInv.iban && oldIban && newInv.iban !== oldIban) {
    findings.push({
      id: "iban",
      tone: "storm",
      title: "Leverantören har bytt konto",
      claim: [
        {
          text: `Atlas Copco har fått ${atlasPaid.length} betalningar från er, alla till bankgiro ${ATLAS_GIRO_OLD}.`,
          cites: ["op-tx-atlas"],
        },
        {
          text: `Den nya fakturan på ${Math.round(newInv.amount / 1000)} 000 kr pekar på ${ATLAS_GIRO_NEW}.`,
          cites: ["zg-sinv-atlas"],
        },
        { text: "Samma leverantör, nytt konto, ingen förvarning." },
      ],
      action: "Betalningen hålls tillbaka tills någon ringt Atlas och bekräftat.",
      cites: ["op-tx-atlas", "zg-sinv-atlas", "op-pis-held"],
    });
  }

  const muller = BOOKS.filter((i) => i.party.startsWith("Müller") && i.paidDate && i.status === "PAID");
  if (muller.length && scenarioId === "german") {
    const delays = muller.map((i) => daysBetween(i.dueDate, i.paidDate!));
    const avg = Math.round(delays.reduce((s, n) => s + n, 0) / delays.length);
    findings.push({
      id: "late",
      tone: "watch",
      title: "Müller betalar sent varje gång",
      claim: [
        {
          text: `${muller.length} tidigare fakturor är betalda i snitt ${avg} dagar efter förfallodatum.`,
          cites: ["zg-cinv-muller", "op-tx-muller"],
        },
        {
          text: `Ordern är skriven på 60 dagar, så vi räknar med ${60 + avg} i stället.`,
          cites: ["model-order"],
        },
      ],
      action: "Prognosen använder det senare datumet. Inget antagande om tyska bolag — tre matchade betalningar.",
      cites: ["zg-cinv-muller", "op-tx-muller"],
    });
  }

  const namelessHits = BANK_TX.filter((t) => t.amount > 0 && !t.creditorName)
    .map((tx) => {
      const hit = BOOKS.find((i) => i.kind === "customer" && i.amount === tx.amount);
      return hit ? { tx, hit } : null;
    })
    .filter((x): x is { tx: BankTx; hit: Invoice } => x !== null);

  if (namelessHits.length) {
    const first = namelessHits[0];
    const extra = namelessHits.length > 1 ? ` +${namelessHits.length - 1} till` : "";
    findings.push({
      id: "nameless",
      tone: "clear",
      title: "Namnlös inbetalning identifierad",
      claim: [
        {
          text: `${Math.round(first.tx.amount / 1000)} 000 kr kommer in utan avsändarnamn — banken lämnar fältet tomt.`,
          cites: ["op-tx-nameless"],
        },
        {
          text: `Beloppet matchar en obetald faktura från ${first.hit.party}${extra}.`,
          cites: ["zg-cinv-abetong"],
        },
      ],
      action: "Vi fyller luckan från böckerna och säger att vi gjort det, i stället för att bara visa ett belopp.",
      cites: ["op-tx-nameless", "zg-cinv-abetong"],
    });
  }

  findings.push({
    id: "lag",
    tone: "gap",
    title: "Böckerna släpar fyra dagar",
    claim: [
      { text: "Banken svarar i realtid.", cites: ["op-aspsp"] },
      {
        text: "Bokföringen synkades senast 16 november, så lön och färska leverantörsfakturor kan saknas.",
        cites: ["zg-lag", "zg-consent"],
      },
    ],
    action: "Svaret blir sämre, inte blankt: när böckerna tystnar räknar vi vidare på bankens siffror.",
    cites: ["zg-lag", "op-aspsp"],
  });

  if (scenarioId === "service") {
    return findings.filter((f) => f.id === "lag" || f.id === "nameless");
  }
  if (scenarioId === "none") {
    return findings.filter((f) => f.id === "lag" || f.id === "nameless");
  }
  return findings;
}

export function ibanRisk(scenarioId: ScenarioId) {
  return triangulate(scenarioId).some((f) => f.id === "iban");
}
