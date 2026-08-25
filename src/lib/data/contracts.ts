/**
 * Datakontraktet mellan API:erna och beräkningsmotorn.
 *
 * Formen speglar vad Open Payments (PSD2 AIS) och Zwapgrid faktiskt svarar,
 * inte vad UI:t råkar behöva. Den som genererar mockdata ska kunna skriva JSON
 * i den här formen utan att titta på någon React-kod, och den som kopplar in
 * skarpa nycklar ska kunna byta implementation utan att röra motorn.
 *
 * Se adapter.ts för hur formen översätts till det motorn räknar på.
 */

/* ── Open Payments · PSD2 Account Information ────────────────────────── */

export type Iso4217 = "SEK" | "EUR" | "NOK" | "DKK";

/** GET /psd2/accountinformation/v1/accounts */
export type AisAccount = {
  resourceId: string;
  iban: string | null;
  bban: string | null;
  currency: Iso4217;
  name: string | null;
  product: string | null;
  /** PRIV eller ORGA. Vi bryr oss om ORGA. */
  usage: "PRIV" | "ORGA" | null;
  bicFi: string;
};

/** GET /psd2/accountinformation/v1/accounts/{id}/balances */
export type AisBalance = {
  /** interimAvailable är den vi räknar på — betalningar på väg ut är avdragna. */
  balanceType: "interimAvailable" | "interimBooked" | "closingBooked" | "expected";
  amount: number;
  currency: Iso4217;
  referenceDate: string;
};

/**
 * GET /psd2/accountinformation/v1/accounts/{id}/transactions
 * Fälten som ofta saknas är medvetet nullable — banken lämnar dem tomma och
 * produkten ska säga det högt i stället för att visa en lucka som ett faktum.
 */
export type AisTransaction = {
  transactionId: string;
  bookingDate: string;
  valueDate: string | null;
  /** Negativt = ut från kontot. */
  amount: number;
  currency: Iso4217;
  creditorName: string | null;
  creditorIban: string | null;
  creditorBankgiro: string | null;
  debtorName: string | null;
  remittanceInformation: string | null;
  status: "booked" | "pending";
};

/* ── Zwapgrid · bokföring ─────────────────────────────────────────────── */

/** GET /accounting/api/v1/consents/{id}/companyinformation */
export type BookkeepingCompany = {
  name: string;
  organizationNumber: string;
  vatNumber: string | null;
  city: string | null;
  currency: Iso4217;
};

export type InvoiceStatus = "PAID" | "UNPAID" | "OVERDUE" | "CREDITED";

/**
 * GET /accounting/api/v1/consents/{id}/supplierinvoices
 * GET /accounting/api/v1/consents/{id}/customerinvoices
 */
export type BookkeepingInvoice = {
  id: string;
  kind: "supplier" | "customer";
  party: string;
  partyOrgNumber: string | null;
  issueDate: string;
  dueDate: string;
  /** Alltid positivt. `kind` avgör riktningen. */
  amount: number;
  currency: Iso4217;
  status: InvoiceStatus;
  /** Satt först när fakturan är betald — grunden för betalmönster. */
  paidDate: string | null;
  /** Mottagarkonto på leverantörsfakturor. Ändras det är det en varningssignal. */
  bankgiro: string | null;
  iban: string | null;
  paymentTermDays: number | null;
};

/** Återkommande poster som inte ligger som faktura — lön, skatt, hyra. */
export type RecurringCost = {
  id: string;
  label: string;
  amount: number;
  /** Dag i månaden posten dras. */
  dayOfMonth: number;
  category: "payroll" | "tax" | "rent" | "utility" | "insurance" | "other";
};

/* ── Det samlade underlaget ───────────────────────────────────────────── */

export type FinancialSnapshot = {
  fetchedAt: string;
  /** Vilket läge datan kommer från — visas för användaren, aldrig gissat. */
  mode: "demo" | "live";
  company: BookkeepingCompany;
  accounts: AisAccount[];
  balances: AisBalance[];
  transactions: AisTransaction[];
  invoices: BookkeepingInvoice[];
  recurring: RecurringCost[];
  /** Vad som inte gick att hämta. Tomt fält ska aldrig tolkas som noll. */
  gaps: DataGap[];
};

export type DataGap = {
  source: "open-payments" | "zwapgrid";
  /** Anropet som inte gav fullt svar. */
  endpoint: string;
  /** Varför: SCA saknas, consent ej kopplad, fältet tomt hos banken. */
  reason: string;
  /** Hur produkten hanterar luckan i stället för att stanna. */
  fallback: string;
};

/** Den som kopplar in skarp data implementerar bara den här. */
export type FinancialSource = {
  id: string;
  load: () => Promise<FinancialSnapshot>;
};
