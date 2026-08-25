/**
 * Banken, via Open Payments (PSD2 AIS).
 *
 * Sandboxen släpper konton, saldon och transaktioner så snart det finns ett
 * samtycke och rätt PSU-headers — den behöver inte signeras med BankID först,
 * trots att `consentStatus` stannar på `received`. Skarpt mot en riktig bank
 * krävs SCA, och då är det steg 4 nedan som behöver en auktorisering.
 *
 * Kontot vi räknar på är företagskontot i bolagets valuta, valt på `usage:
 * ORGA` — inte på id, eftersom sandboxen bär både privat- och företagskonton.
 */

import { openPaymentsConfig } from "../live.server";
import type { AisAccount, AisBalance, AisTransaction, Iso4217 } from "./contracts";

/**
 * Kontohavaren samtycket skapas för. Måste vara samma vid varje anrop, annars
 * svarar AIS inte på samtycket — sandboxen godtar vilket personnummer som helst.
 */
const PSU = process.env.OPEN_PAYMENTS_PSU_ID ?? "199001019999";

/** SEB i sandboxen. Byts bolaget bank är det den här som ska ändras. */
const BICFI = process.env.OPEN_PAYMENTS_BICFI ?? "ESSESESS";

export type BankSnapshot = {
  accounts: AisAccount[];
  balances: AisBalance[];
  transactions: AisTransaction[];
  account: AisAccount;
};

const CURRENCIES: Iso4217[] = ["SEK", "EUR", "NOK", "DKK"];

function currency(raw: string | undefined): Iso4217 {
  const hit = CURRENCIES.find((c) => c === raw);
  if (!hit) throw new Error(`Okänd valuta från banken: ${raw}`);
  return hit;
}

function headers(token: string, consentId?: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Request-ID": crypto.randomUUID(),
    "X-BicFi": BICFI,
    "PSU-ID": PSU,
    "PSU-Corporate-ID": PSU,
    ...(consentId ? { "Consent-ID": consentId } : {}),
  };
}

async function token(): Promise<string> {
  const c = openPaymentsConfig();
  const res = await fetch(`${c.auth.replace(/\/$/, "")}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: c.clientId,
      client_secret: c.clientSecret,
      scope: "aspspinformation accountinformation corporate",
    }),
  });
  const json = (await res.json()) as { access_token?: string; error?: string };
  if (!json.access_token) throw new Error(json.error ?? `OP token ${res.status}`);
  return json.access_token;
}

/**
 * Samtycket lever i minnet så länge servern gör det. Ett nytt per sidladdning
 * vore ett nytt samtycke hos banken varje gång någon öppnar appen.
 */
let cached: { id: string; expires: number } | null = null;

async function consent(bearer: string): Promise<string> {
  if (cached && cached.expires > Date.now()) return cached.id;

  const c = openPaymentsConfig();
  const validUntil = new Date(Date.now() + 89 * 86_400_000).toISOString().slice(0, 10);
  const res = await fetch(`${c.api.replace(/\/$/, "")}/psd2/consent/v1/consents`, {
    method: "POST",
    headers: headers(bearer),
    body: JSON.stringify({
      access: { availableAccounts: "allAccounts" },
      recurringIndicator: true,
      validUntil,
      frequencyPerDay: 4,
      combinedServiceIndicator: false,
    }),
  });
  const json = (await res.json()) as { consentId?: string; tppMessages?: unknown };
  if (!json.consentId) throw new Error(`OP consent ${res.status}: ${JSON.stringify(json.tppMessages ?? json)}`);

  cached = { id: json.consentId, expires: Date.now() + 30 * 60_000 };
  return json.consentId;
}

type RawBalance = {
  balanceAmount: { amount: string; currency: string };
  balanceType: string;
  referenceDate?: string;
};

type RawAccount = {
  resourceId: string;
  iban: string | null;
  bban: string | null;
  currency: string;
  name: string | null;
  product: string | null;
  usage: string | null;
  bic: string;
  balances?: RawBalance[];
};

type RawTransaction = {
  transactionId: string;
  bookingDate: string;
  valueDate: string | null;
  transactionAmount: { amount: string; currency: string };
  creditorName?: string | null;
  creditorAccount?: { iban?: string | null };
  debtorName?: string | null;
  remittanceInformationUnstructured?: string | null;
};

const BALANCE_TYPES: AisBalance["balanceType"][] = [
  "interimAvailable",
  "interimBooked",
  "closingBooked",
  "expected",
];

function toBalance(raw: RawBalance, fallbackDate: string): AisBalance | null {
  const type = BALANCE_TYPES.find((t) => t === raw.balanceType);
  if (!type) return null;
  return {
    balanceType: type,
    amount: Number(raw.balanceAmount.amount),
    currency: currency(raw.balanceAmount.currency),
    referenceDate: raw.referenceDate ?? fallbackDate,
  };
}

function toAccount(raw: RawAccount): AisAccount {
  return {
    resourceId: raw.resourceId,
    iban: raw.iban ?? null,
    bban: raw.bban ?? null,
    currency: currency(raw.currency),
    name: raw.name ?? null,
    product: raw.product ?? null,
    usage: raw.usage === "ORGA" || raw.usage === "PRIV" ? raw.usage : null,
    bicFi: raw.bic,
  };
}

function toTransaction(raw: RawTransaction, status: AisTransaction["status"]): AisTransaction {
  return {
    transactionId: raw.transactionId,
    bookingDate: raw.bookingDate,
    valueDate: raw.valueDate ?? null,
    amount: Number(raw.transactionAmount.amount),
    currency: currency(raw.transactionAmount.currency),
    creditorName: raw.creditorName ?? null,
    creditorIban: raw.creditorAccount?.iban ?? null,
    // Bankgiro ligger inte i AIS-svaret. Luckan sägs högt i stället för att gissas.
    creditorBankgiro: null,
    debtorName: raw.debtorName ?? null,
    remittanceInformation: raw.remittanceInformationUnstructured ?? null,
    status,
  };
}

export async function fetchBank(homeCurrency: Iso4217 = "SEK"): Promise<BankSnapshot> {
  const c = openPaymentsConfig();
  const base = c.api.replace(/\/$/, "");
  const bearer = await token();
  const consentId = await consent(bearer);
  const today = new Date().toISOString().slice(0, 10);

  const res = await fetch(`${base}/psd2/accountinformation/v1/accounts?withBalance=true`, {
    headers: headers(bearer, consentId),
  });
  if (!res.ok) throw new Error(`OP accounts ${res.status}`);
  const { accounts: raw = [] } = (await res.json()) as { accounts?: RawAccount[] };

  const accounts = raw.map(toAccount);
  const chosen =
    raw.find((a) => a.usage === "ORGA" && a.currency === homeCurrency) ??
    raw.find((a) => a.currency === homeCurrency);
  if (!chosen) throw new Error(`Inget ${homeCurrency}-konto hos banken`);

  const balances = (chosen.balances ?? [])
    .map((b) => toBalance(b, today))
    .filter((b): b is AisBalance => b !== null);
  if (!balances.length) throw new Error(`Konto ${chosen.resourceId} svarade utan saldo`);

  // `dateFrom` är inte valfritt — utan det svarar banken utan poster.
  const from = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);
  const txRes = await fetch(
    `${base}/psd2/accountinformation/v1/accounts/${chosen.resourceId}/transactions?bookingStatus=both&dateFrom=${from}`,
    { headers: headers(bearer, consentId) },
  );
  const tx = txRes.ok
    ? ((await txRes.json()) as { transactions?: { booked?: RawTransaction[]; pending?: RawTransaction[] } })
    : {};

  const transactions = [
    ...(tx.transactions?.booked ?? []).map((t) => toTransaction(t, "booked")),
    ...(tx.transactions?.pending ?? []).map((t) => toTransaction(t, "pending")),
  ];

  return { accounts, balances, transactions, account: toAccount(chosen) };
}
