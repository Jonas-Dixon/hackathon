import type { FinancialSnapshot } from "./data/contracts";
import { strings } from "./lang";
import type { SourceId } from "./sources";

/**
 * Varje påstående i appen pekar på en rad här. Numret är fast och globalt —
 * [3] betyder samma sak överallt, precis som en referenslista.
 */

export type CiteId =
  | "op-balance"
  | "op-aspsp"
  | "op-tx-atlas"
  | "op-tx-muller"
  | "op-tx-nameless"
  | "op-accounts-locked"
  | "op-pis-held"
  | "zg-consent"
  | "zg-sinv-atlas"
  | "zg-cinv-muller"
  | "zg-cinv-abetong"
  | "zg-lag"
  | "model-payroll"
  | "model-order";

export type CiteStatus = "live" | "lag" | "locked" | "model";

export type Citation = {
  id: CiteId;
  num: number;
  source: SourceId;
  /** API-anropet svaret kom ur, eller "Modell" när vi räknar själva. */
  call: string;
  field: string;
  value: string;
  note: string;
  status: CiteStatus;
};

const ORDER: CiteId[] = [
  "op-balance",
  "op-aspsp",
  "op-tx-atlas",
  "op-tx-muller",
  "op-tx-nameless",
  "op-accounts-locked",
  "op-pis-held",
  "zg-consent",
  "zg-sinv-atlas",
  "zg-cinv-muller",
  "zg-cinv-abetong",
  "zg-lag",
  "model-payroll",
  "model-order",
];

type CitationSeed = Omit<Citation, "num">;

/**
 * Formen på beviset: vilket anrop, vilken källa, hur färskt det är.
 *
 * Texten — fält, värde, notering — bor i språkpaketet, för den är det enda i
 * raden en människa faktiskt läser. Anropen är API-strängar och står som de är
 * på båda språken.
 */
type CitationShape = { id: CiteId; source: SourceId; call: string; status: CiteStatus };

const SHAPES: Record<CiteId, CitationShape> = {
  "op-balance": {
    id: "op-balance",
    source: "bank",
    call: "GET /psd2/accountinformation/v1/accounts/{id}/balances",
    status: "live",
  },
  "op-aspsp": {
    id: "op-aspsp",
    source: "bank",
    call: "GET /psd2/aspspinformation/v1/aspsps?country=SE",
    status: "live",
  },
  "op-tx-atlas": {
    id: "op-tx-atlas",
    source: "bank",
    call: "GET /psd2/accountinformation/v1/accounts/{id}/transactions",
    status: "live",
  },
  "op-tx-muller": {
    id: "op-tx-muller",
    source: "bank",
    call: "GET /psd2/accountinformation/v1/accounts/{id}/transactions",
    status: "live",
  },
  "op-tx-nameless": {
    id: "op-tx-nameless",
    source: "bank",
    call: "GET /psd2/accountinformation/v1/accounts/{id}/transactions",
    status: "live",
  },
  "op-accounts-locked": {
    id: "op-accounts-locked",
    source: "bank",
    call: "GET /psd2/accountinformation/v1/accounts",
    status: "locked",
  },
  "op-pis-held": {
    id: "op-pis-held",
    source: "bank",
    call: "POST /psd2/payments/v1/swedish-giro",
    status: "locked",
  },
  "zg-consent": {
    id: "zg-consent",
    source: "boks",
    call: "GET /consents/api/v1/consents",
    status: "locked",
  },
  "zg-sinv-atlas": {
    id: "zg-sinv-atlas",
    source: "boks",
    call: "GET /accounting/api/v1/consents/{id}/supplierinvoices",
    status: "lag",
  },
  "zg-cinv-muller": {
    id: "zg-cinv-muller",
    source: "boks",
    call: "GET /accounting/api/v1/consents/{id}/customerinvoices",
    status: "lag",
  },
  "zg-cinv-abetong": {
    id: "zg-cinv-abetong",
    source: "boks",
    call: "GET /accounting/api/v1/consents/{id}/customerinvoices",
    status: "lag",
  },
  "zg-lag": { id: "zg-lag", source: "boks", call: "GET /consents/api/v1/consents", status: "lag" },
  "model-payroll": { id: "model-payroll", source: "boks", call: "", status: "model" },
  "model-order": { id: "model-order", source: "order", call: "", status: "model" },
};

function seed(id: CiteId): CitationSeed {
  const shape = SHAPES[id];
  const text = strings().cite[id];
  return {
    ...shape,
    // Modellraderna har ingen URL — där är anropet en mening, och den översätts.
    call: "call" in text ? (text.call as string) : shape.call,
    field: text.field,
    value: text.value,
    note: text.note,
  };
}

/** Numret är fast och globalt — [3] betyder samma sak överallt, på båda språken. */
export const CITE_NUM: Record<CiteId, number> = ORDER.reduce(
  (acc, id, i) => {
    acc[id] = i + 1;
    return acc;
  },
  {} as Record<CiteId, number>,
);

function citation(id: CiteId): Citation {
  return { ...seed(id), num: CITE_NUM[id] };
}

export const CITATIONS: Record<CiteId, unknown> = SHAPES;

/**
 * Vad körningen faktiskt fick tillbaka, ovanpå fröna.
 *
 * Fröna beskriver formen på beviset; först när anropet gjorts vet vi värdet.
 * Utan det här skulle underlaget visa gårdagens siffra som om banken svarat
 * den idag — samma sorts lögn som produkten finns för att undvika.
 */
let live: Partial<Record<CiteId, Partial<CitationSeed>>> = {};

export function setCitationFacts(next: Partial<Record<CiteId, Partial<CitationSeed>>>) {
  live = next;
}

export function cites(ids: CiteId[]): Citation[] {
  return ids.map((id) => ({ ...citation(id), ...live[id] })).sort((a, b) => a.num - b.num);
}

/** Beviset för saldot, hämtat ur det snapshot prognosen faktiskt räknade på. */
export function citationFactsFrom(
  snapshot: FinancialSnapshot,
): Partial<Record<CiteId, Partial<CitationSeed>>> {
  const balance = snapshot.balances[0];
  const account = snapshot.accounts.find((a) => a.usage === "ORGA") ?? snapshot.accounts[0];

  if (!account || !balance) {
    return {
      "op-balance": {
        value: balance ? `${balance.amount.toLocaleString("sv-SE")} SEK` : "—",
        note: strings().cite.noBank,
        status: "locked",
      },
    };
  }

  const L = strings().cite;
  return {
    "op-balance": {
      call: `GET /psd2/accountinformation/v1/accounts/${account.resourceId}/balances`,
      field: `balances[0].balanceAmount · ${balance.balanceType}`,
      value: `${balance.amount.toLocaleString("sv-SE")} ${balance.currency}`,
      note: L.balanceFrom(account.name ?? account.resourceId, balance.referenceDate),
      status: "live",
    },
    "op-accounts-locked": {
      call: "GET /psd2/accountinformation/v1/accounts?withBalance=true",
      field: L.accountsField,
      value: L.accountsValue(snapshot.accounts.length, account.resourceId),
      note: L.accountsNote(account.iban ?? account.resourceId),
      status: "live",
    },
  };
}

export function statusWord(status: CiteStatus): string {
  return strings().citeStatus[status];
}
