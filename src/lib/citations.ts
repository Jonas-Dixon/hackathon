import type { FinancialSnapshot } from "./data/contracts";
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

const SEEDS: Record<CiteId, CitationSeed> = {
  "op-balance": {
    id: "op-balance",
    source: "bank",
    call: "GET /psd2/accountinformation/v1/accounts/{id}/balances",
    field: "balances[0].balanceAmount · interimAvailable",
    value: "418 400 SEK",
    note: "Saldot vi räknar från. Tillgängligt, inte bokfört — betalningar på väg ut är redan avdragna.",
    status: "live",
  },
  "op-aspsp": {
    id: "op-aspsp",
    source: "bank",
    call: "GET /psd2/aspspinformation/v1/aspsps?country=SE",
    field: "aspsps.length",
    value: "111 banker",
    note: "Anropet gick igenom skarpt mot sandboxen. Det är beviset på att nyckeln lever.",
    status: "live",
  },
  "op-tx-atlas": {
    id: "op-tx-atlas",
    source: "bank",
    call: "GET /psd2/accountinformation/v1/accounts/{id}/transactions",
    field: "booked[] · creditorAccount.bankgiro",
    value: "4 betalningar → 5051-9071",
    note: "Fyra tidigare utbetalningar till Atlas Copco, alla till samma bankgiro.",
    status: "live",
  },
  "op-tx-muller": {
    id: "op-tx-muller",
    source: "bank",
    call: "GET /psd2/accountinformation/v1/accounts/{id}/transactions",
    field: "booked[] · bookingDate",
    value: "3 inbetalningar från Müller",
    note: "Datumen pengarna faktiskt landade. Matchas mot förfallodatum i böckerna.",
    status: "live",
  },
  "op-tx-nameless": {
    id: "op-tx-nameless",
    source: "bank",
    call: "GET /psd2/accountinformation/v1/accounts/{id}/transactions",
    field: "booked[].creditorName",
    value: "null",
    note: "PSD2 kräver inte ifyllt namn. Banken vet beloppet men inte vem — luckan fylls från böckerna.",
    status: "live",
  },
  "op-accounts-locked": {
    id: "op-accounts-locked",
    source: "bank",
    call: "GET /psd2/accountinformation/v1/accounts",
    field: "consentStatus",
    value: "received — väntar SCA",
    note: "Saldo och transaktioner är låsta tills någon signerar med BankID. Siffrorna i demon är därför modellerade på riktig svarsform.",
    status: "locked",
  },
  "op-pis-held": {
    id: "op-pis-held",
    source: "bank",
    call: "POST /psd2/payments/v1/swedish-giro",
    field: "transactionStatus",
    value: "held",
    note: "Betalningen skickas inte förrän kontot stämmer mot betalhistoriken.",
    status: "locked",
  },
  "zg-consent": {
    id: "zg-consent",
    source: "boks",
    call: "GET /consents/api/v1/consents",
    field: "data[0].status · data[0].source",
    value: "CREATED · null",
    note: "Samtycket finns men bokföringssystemet är inte kopplat än, så fakturaanropen ger 403.",
    status: "locked",
  },
  "zg-sinv-atlas": {
    id: "zg-sinv-atlas",
    source: "boks",
    call: "GET /accounting/api/v1/consents/{id}/supplierinvoices",
    field: "SINV-ATLAS-NEW · dueDate, amount, bankgiro",
    value: "2 dec · 520 000 SEK · 5822-1104",
    note: "Leverantörsfakturan för materialet. Bankgirot skiljer sig från de fyra tidigare betalningarna.",
    status: "lag",
  },
  "zg-cinv-muller": {
    id: "zg-cinv-muller",
    source: "boks",
    call: "GET /accounting/api/v1/consents/{id}/customerinvoices",
    field: "3 fakturor · dueDate mot paidDate",
    value: "snitt 23 dagar sent",
    note: "Tre betalda Müller-fakturor. Skillnaden mellan förfallodatum och betaldatum är mätt, inte gissad.",
    status: "lag",
  },
  "zg-cinv-abetong": {
    id: "zg-cinv-abetong",
    source: "boks",
    call: "GET /accounting/api/v1/consents/{id}/customerinvoices",
    field: "CINV-ABETONG · party, amount",
    value: "Abetong AB · 140 000 SEK",
    note: "Ger namnet till den namnlösa inbetalningen i banken.",
    status: "lag",
  },
  "zg-lag": {
    id: "zg-lag",
    source: "boks",
    call: "GET /consents/api/v1/consents",
    field: "data[0].createdOn",
    value: "senast synkad 16 nov",
    note: "Böckerna släpar fyra dagar. Lön och färska leverantörsfakturor kan saknas.",
    status: "lag",
  },
  "model-payroll": {
    id: "model-payroll",
    source: "boks",
    call: "Modell · återkommande poster",
    field: "lön den 25:e · 187 200 SEK",
    value: "3 månader framåt",
    note: "Avtalad post med känt datum och belopp. Rullas framåt tills böckerna säger annat.",
    status: "model",
  },
  "model-order": {
    id: "model-order",
    source: "order",
    call: "Modell · ordern du testar",
    field: "orderAmount, materialCost, betaldatum",
    value: "inmatad i scenariot",
    note: "Kommer varken från banken eller böckerna. Det är hypotesen vi räknar på.",
    status: "model",
  },
};

export const CITATIONS: Record<CiteId, Citation> = ORDER.reduce(
  (acc, id, i) => {
    acc[id] = { ...SEEDS[id], num: i + 1 };
    return acc;
  },
  {} as Record<CiteId, Citation>,
);

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
  return ids.map((id) => ({ ...CITATIONS[id], ...live[id] })).sort((a, b) => a.num - b.num);
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
        note: "Banken svarade inte. Siffran är angiven, inte hämtad — därför räknas den som en lucka.",
        status: "locked",
      },
    };
  }

  return {
    "op-balance": {
      call: `GET /psd2/accountinformation/v1/accounts/${account.resourceId}/balances`,
      field: `balances[0].balanceAmount · ${balance.balanceType}`,
      value: `${balance.amount.toLocaleString("sv-SE")} ${balance.currency}`,
      note: `Saldot vi räknar från, hämtat ur ${account.name ?? account.resourceId} den ${balance.referenceDate}.`,
      status: "live",
    },
    "op-accounts-locked": {
      call: "GET /psd2/accountinformation/v1/accounts?withBalance=true",
      field: "accounts.length · valt konto",
      value: `${snapshot.accounts.length} konton · ${account.resourceId}`,
      note: `Samtycket räcker för att läsa konton. Vi räknar på företagskontot ${account.iban ?? account.resourceId}.`,
      status: "live",
    },
  };
}

export const STATUS_WORD: Record<CiteStatus, string> = {
  live: "Live",
  lag: "Släpar",
  locked: "Låst",
  model: "Modell",
};
