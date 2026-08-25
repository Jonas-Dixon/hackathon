import type { CiteId } from "./citations";

/**
 * Allt som demon fyller i åt användaren. När riktiga nycklar är påkopplade
 * byts varje fält mot sitt `wire`-anrop — inget UI behöver ändras.
 */

export type DataMode = "demo" | "live";

/** Sätts till "live" när AIS och bokföringen svarar med riktiga poster. */
export const DATA_MODE: DataMode = "demo";

export type FieldOrigin = "op" | "zg" | "derived";

/** Ett prefillat värde plus var det kommer ifrån i skarpt läge. */
export type Sourced<T> = {
  value: T;
  origin: FieldOrigin;
  wire: string;
  cite: CiteId;
};

function sourced<T>(value: T, origin: FieldOrigin, wire: string, cite: CiteId): Sourced<T> {
  return { value, origin, wire, cite };
}

export type CompanyProfile = {
  name: Sourced<string>;
  orgNumber: Sourced<string>;
  city: string;
  employees: number;
  bank: Sourced<string>;
  bankgiro: Sourced<string>;
  currency: string;
  cash: Sourced<number>;
};

export const COMPANY_PROFILE: CompanyProfile = {
  name: sourced(
    "Nordborr AB",
    "zg",
    "GET /accounting/api/v1/consents/{id}/companyinformation → name",
    "zg-consent",
  ),
  orgNumber: sourced(
    "559184-2201",
    "zg",
    "GET /accounting/api/v1/consents/{id}/companyinformation → organizationNumber",
    "zg-consent",
  ),
  city: "Västerås",
  employees: 11,
  bank: sourced(
    "Danske Bank A/S",
    "op",
    "GET /psd2/aspspinformation/v1/aspsps → bicFi DABASESX",
    "op-aspsp",
  ),
  bankgiro: sourced(
    "5051-9071",
    "op",
    "GET /psd2/accountinformation/v1/accounts → cashAccount",
    "op-balance",
  ),
  currency: "SEK",
  cash: sourced(
    418_400,
    "op",
    "GET /psd2/accountinformation/v1/accounts/{id}/balances → interimAvailable",
    "op-balance",
  ),
};

/**
 * Villkoren en ny order ärver. Demon fyller i dem så den som visar upp
 * produkten bara behöver skriva belopp och datum.
 */
export type OrderTemplate = {
  customer: Sourced<string>;
  customerCountry: string;
  /** Andel av ordervärdet som går till material och måste betalas i förskott. */
  materialShare: Sourced<number>;
  /** Dagar från att ordern läggs tills materialfakturan förfaller. */
  materialLeadDays: Sourced<number>;
  /** Betalningsvillkor på kundfakturan. */
  paymentTermDays: Sourced<number>;
  /** Vad historiken säger att kunden faktiskt lägger på ovanpå villkoren. */
  customerLateDays: Sourced<number>;
  vatRate: number;
};

export const ORDER_TEMPLATE: OrderTemplate = {
  customer: sourced(
    "Müller Tiefbau GmbH",
    "zg",
    "GET /accounting/api/v1/consents/{id}/customerinvoices → party",
    "zg-cinv-muller",
  ),
  customerCountry: "DE",
  materialShare: sourced(
    0.62,
    "derived",
    "Medianandel material på tidigare ordrar i bokföringen",
    "zg-sinv-atlas",
  ),
  materialLeadDays: sourced(
    12,
    "derived",
    "Snittid från orderdatum till förfallen materialfaktura",
    "zg-sinv-atlas",
  ),
  paymentTermDays: sourced(60, "zg", "Villkor på kundens senaste fakturor", "zg-cinv-muller"),
  customerLateDays: sourced(
    23,
    "derived",
    "Snitt av dueDate mot paidDate på tre betalda fakturor",
    "zg-cinv-muller",
  ),
  vatRate: 0.25,
};

export const MODE_LABEL: Record<DataMode, string> = {
  demo: "Demodata",
  live: "Skarp data",
};
