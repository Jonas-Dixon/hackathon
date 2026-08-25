/**
 * Skarp bokföringsdata från Zwapgrid API.1 över ett accepterat Fortnox-consent.
 *
 * Allt läses genom de enhetliga endpointerna, så ingenting hänger på vilket
 * bokföringssystem som sitter bakom samtycket. Källan svarar i contracts.ts-form
 * och vet inget om motorn eller UI:t.
 *
 * Banken är ännu inte inkopplad: Open Payments kräver signering med BankID innan
 * saldo och transaktioner släpps. Det står som luckor i `gaps` i stället för att
 * visas som nollor.
 */

import { zwapgridConfig } from "../live.server";
import type {
  AisBalance,
  BookkeepingCompany,
  BookkeepingInvoice,
  DataGap,
  FinancialSnapshot,
  FinancialSource,
  RecurringCost,
} from "./contracts.ts";
import { fetchBank } from "./open-payments.server";

const PAGE = 100;

// ---------------------------------------------------------------- transport

type Envelope<T> = { meta?: { totalPages?: number }; data?: T[] };

function root() {
  const c = zwapgridConfig();
  return {
    base: `${c.api.replace(/\/$/, "")}/accounting/api/v1/consents/${c.consentId}`,
    key: c.apiKey,
  };
}

async function get<T>(path: string): Promise<T> {
  const { base, key } = root();
  const res = await fetch(`${base}${path}`, {
    headers: {
      "x-api-key": key,
      "x-correlation-id": crypto.randomUUID(),
      Accept: "application/json",
    },
    // Sandboxen kan hänga i stället för att svara med 429. Utan en gräns
    // väntar hela sidan tills klienten eller Renders proxy ger upp och
    // stänger anslutningen, vilket syns som en okontrollerad "aborted".
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Zwapgrid ${path} → ${res.status}`);
  return (await res.json()) as T;
}

/** API.1 ger som mest 100 rader per sida, så en hel reskontra måste gås igenom. */
async function list<T>(endpoint: string, query = ""): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; ; page += 1) {
    const sep = query ? "&" : "";
    const body = await get<Envelope<T>>(
      `/${endpoint}?Count=${PAGE}&CurrentPage=${page}${sep}${query}`,
    );
    out.push(...(body.data ?? []));
    if (page >= (body.meta?.totalPages ?? 1)) break;
  }
  return out;
}

// ---------------------------------------------------------------- råa former

type RawInvoice = {
  id: string;
  reference: string | null;
  issueDate: string | null;
  dueDate: string | null;
  totalBalanceAmount?: { amount?: number } | null;
  legalMonetaryTotal?: { payableAmount?: { amount?: number } | null } | null;
  accountingCustomerParty?: {
    supplierAssignedAccountId?: { id?: string | null } | null;
    party?: {
      partyName?: { name?: string | null } | null;
      partyLegalEntity?: { companyId?: { id?: string | null } | null } | null;
    } | null;
  } | null;
  accountingSupplierParty?: {
    customerAssignedAccountId?: { id?: string | null } | null;
    party?: {
      partyName?: { name?: string | null } | null;
      partyLegalEntity?: { companyId?: { id?: string | null } | null } | null;
    } | null;
  } | null;
};

type RawPayment = {
  id: string;
  paidDate: string | null;
  amount?: number | null;
  billingReferences?: { invoiceDocumentReferences?: { id?: string | null }[] | null }[] | null;
};

type RawParty = {
  id: string;
  party?: {
    partyName?: { name?: string | null } | null;
    partyLegalEntity?: { companyId?: { id?: string | null } | null } | null;
  } | null;
  paymentMeans?: { financialAccount?: { id?: string | null } | null }[] | null;
};

type RawCompany = {
  partyName?: { name?: string | null } | null;
  partyLegalEntity?: { companyId?: { id?: string | null } | null } | null;
};

// ---------------------------------------------------------------- översättning

const DAY = 86_400_000;

/** Fakturans id → betalningen som löste den. */
function settlements(payments: RawPayment[]) {
  const map = new Map<string, RawPayment>();
  for (const p of payments) {
    for (const ref of p.billingReferences ?? []) {
      for (const doc of ref.invoiceDocumentReferences ?? []) {
        if (doc.id) map.set(doc.id, p);
      }
    }
  }
  return map;
}

/**
 * En reglerad faktura rapporterar noll på varje beloppsfält — Fortnox nollar
 * den när saldot är borta. Det som faktiskt betalades står kvar på betalningen,
 * så historiken måste läsas därifrån.
 */
function amountOf(inv: RawInvoice, settlement: RawPayment | undefined) {
  const open = inv.legalMonetaryTotal?.payableAmount?.amount ?? inv.totalBalanceAmount?.amount ?? 0;
  return open > 0 ? open : (settlement?.amount ?? 0);
}

function termDays(inv: RawInvoice): number | null {
  if (!inv.issueDate || !inv.dueDate) return null;
  return Math.round((Date.parse(inv.dueDate) - Date.parse(inv.issueDate)) / DAY);
}

function toInvoice(
  inv: RawInvoice,
  kind: BookkeepingInvoice["kind"],
  paid: Map<string, RawPayment>,
  bankgiroFor: (partyNumber: string) => string | null,
  today: string,
): BookkeepingInvoice | null {
  if (!inv.dueDate) return null;
  const settlement = paid.get(inv.id);
  const amount = amountOf(inv, settlement);
  if (amount <= 0) return null;

  const side = kind === "customer" ? inv.accountingCustomerParty : inv.accountingSupplierParty;
  const partyNumber =
    (kind === "customer"
      ? inv.accountingCustomerParty?.supplierAssignedAccountId?.id
      : inv.accountingSupplierParty?.customerAssignedAccountId?.id) ?? "";

  const paidDate = settlement?.paidDate?.slice(0, 10) ?? null;
  const status: BookkeepingInvoice["status"] = paidDate
    ? "PAID"
    : inv.dueDate < today
      ? "OVERDUE"
      : "UNPAID";

  return {
    id: inv.reference ?? inv.id,
    kind,
    party: side?.party?.partyName?.name ?? "Okänd motpart",
    partyOrgNumber: side?.party?.partyLegalEntity?.companyId?.id ?? null,
    issueDate: inv.issueDate ?? inv.dueDate,
    dueDate: inv.dueDate,
    amount,
    currency: "SEK",
    status,
    paidDate,
    // Mottagarkontot ligger på leverantörsregistret, inte på fakturan — det är
    // just därför ett nytt leverantörsnummer kan bära ett annat konto.
    bankgiro: kind === "supplier" ? bankgiroFor(partyNumber) : null,
    iban: null,
    paymentTermDays: termDays(inv),
  };
}

/**
 * Lön och arbetsgivaravgift ligger inte som fakturor någonstans. De är också
 * månadens största utbetalningar, så utan dem blir varje svar för optimistiskt.
 */
const RECURRING: RecurringCost[] = [
  { id: "rec-payroll", label: "Lön", amount: 187_200, dayOfMonth: 25, category: "payroll" },
  {
    id: "rec-tax",
    label: "Skattekonto, arbetsgivaravgift",
    amount: 38_000,
    dayOfMonth: 12,
    category: "tax",
  },
];

/**
 * Bara om banken inte svarar. Prognosen ska kunna visas ändå, men en siffra vi
 * hittat på får aldrig se ut som ett banksvar — därför följer den med en lucka.
 */
const UNVERIFIED_BALANCE = 418_400;

const UNVERIFIED_BALANCE_FALLBACK = (today: string): AisBalance[] => [
  { balanceType: "interimAvailable", amount: UNVERIFIED_BALANCE, currency: "SEK", referenceDate: today },
];

const OFFLINE_BANK_GAPS: DataGap[] = [
  {
    source: "open-payments",
    endpoint: "GET /psd2/accountinformation/v1/accounts",
    reason: "Banken svarade inte, så saldot är inte hämtat",
    fallback: `Prognosen utgår från ${UNVERIFIED_BALANCE.toLocaleString("sv-SE")} kr — en angiven siffra, inte ett banksvar`,
  },
];

/**
 * Saldot är äkta, men bankens transaktioner tillhör en annan påhittad kund än
 * bokföringens — de går därför inte att para ihop med fakturorna. Det sägs högt
 * i stället för att en falsk matchning visas som ett fynd.
 */
const BANK_GAPS: DataGap[] = [
  {
    source: "open-payments",
    endpoint: "GET /psd2/accountinformation/v1/accounts/{id}/transactions",
    reason: "Sandboxens kontohistorik hör inte till samma bolag som bokföringen",
    fallback: "Betalmönster räknas ur bokföringens egna betalningar, inte ur banken",
  },
];

// ---------------------------------------------------------------- källan

async function load(): Promise<FinancialSnapshot> {
  const today = new Date().toISOString().slice(0, 10);

  const [company, sales, salesPayments, supplier, supplierPayments, suppliers] = await Promise.all([
    get<RawCompany>("/companyinformation"),
    list<RawInvoice>("salesinvoices"),
    list<RawPayment>("salesinvoices/payments"),
    list<RawInvoice>("supplierinvoices"),
    list<RawPayment>("supplierinvoices/payments"),
    list<RawParty>("suppliers"),
  ]);

  const giroByNumber = new Map<string, string | null>();
  for (const s of suppliers) {
    giroByNumber.set(
      s.id,
      s.paymentMeans?.find((m) => m.financialAccount?.id)?.financialAccount?.id ?? null,
    );
  }
  const bankgiroFor = (n: string) => giroByNumber.get(n) ?? null;

  const salesPaid = settlements(salesPayments);
  const supplierPaid = settlements(supplierPayments);

  const invoices: BookkeepingInvoice[] = [
    ...sales.map((i) => toInvoice(i, "customer", salesPaid, bankgiroFor, today)),
    ...supplier.map((i) => toInvoice(i, "supplier", supplierPaid, bankgiroFor, today)),
  ].filter((i): i is BookkeepingInvoice => i !== null);

  const bookkeeping: BookkeepingCompany = {
    name: company.partyName?.name ?? "Okänt bolag",
    organizationNumber: company.partyLegalEntity?.companyId?.id ?? "",
    vatNumber: null,
    city: null,
    currency: "SEK",
  };

  const bank = await fetchBank("SEK").catch((err: unknown) => {
    console.error("[open-payments] saldot kunde inte hämtas:", err);
    return null;
  });

  return {
    fetchedAt: new Date().toISOString(),
    mode: "live",
    company: bookkeeping,
    accounts: bank?.accounts ?? [],
    balances: bank?.balances ?? UNVERIFIED_BALANCE_FALLBACK(today),
    transactions: bank?.transactions ?? [],
    invoices,
    recurring: RECURRING,
    gaps: bank ? BANK_GAPS : OFFLINE_BANK_GAPS,
  };
}

export const zwapgridSource: FinancialSource = { id: "zwapgrid+fortnox", load };
