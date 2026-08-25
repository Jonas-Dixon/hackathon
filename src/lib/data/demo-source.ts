import type {
  AisAccount,
  AisBalance,
  AisTransaction,
  BookkeepingCompany,
  BookkeepingInvoice,
  FinancialSnapshot,
  FinancialSource,
  RecurringCost,
} from "./contracts.ts";

/**
 * Demons data, skriven i exakt samma form som API:erna svarar.
 *
 * Den här filen är mallen: byt innehållet mot genererad mockdata, eller ersätt
 * hela källan med en som anropar Open Payments och Zwapgrid skarpt. Formen är
 * kontraktet — inget annat behöver ändras.
 */

const COMPANY: BookkeepingCompany = {
  name: "Nordborr AB",
  organizationNumber: "559184-2201",
  vatNumber: "SE559184220101",
  city: "Västerås",
  currency: "SEK",
};

const ACCOUNTS: AisAccount[] = [
  {
    resourceId: "acc-nordborr-1",
    iban: "SE45 5000 0000 0583 9825 7466",
    bban: "50000000058398257466",
    currency: "SEK",
    name: "Nordborr AB Företagskonto",
    product: "Företagskonto",
    usage: "ORGA",
    bicFi: "DABASESX",
  },
];

const BALANCES: AisBalance[] = [
  {
    balanceType: "interimAvailable",
    amount: 418_400,
    currency: "SEK",
    referenceDate: "2026-11-20",
  },
  { balanceType: "closingBooked", amount: 431_900, currency: "SEK", referenceDate: "2026-11-19" },
];

const ATLAS_GIRO_PAID = "5051-9071";
const ATLAS_GIRO_INVOICE = "5822-1104";

const TRANSACTIONS: AisTransaction[] = [
  {
    transactionId: "op-4412",
    bookingDate: "2026-09-18",
    valueDate: "2026-09-18",
    amount: -48_700,
    currency: "SEK",
    creditorName: "Atlas Copco",
    creditorIban: null,
    creditorBankgiro: ATLAS_GIRO_PAID,
    debtorName: null,
    remittanceInformation: "Borrkronor",
    status: "booked",
  },
  {
    transactionId: "op-4418",
    bookingDate: "2026-10-09",
    valueDate: "2026-10-09",
    amount: -41_200,
    currency: "SEK",
    creditorName: "Atlas Copco",
    creditorIban: null,
    creditorBankgiro: ATLAS_GIRO_PAID,
    debtorName: null,
    remittanceInformation: "Stål, etapp 1",
    status: "booked",
  },
  {
    transactionId: "op-4421",
    bookingDate: "2026-10-22",
    valueDate: "2026-10-22",
    amount: -48_700,
    currency: "SEK",
    creditorName: "Atlas Copco",
    creditorIban: null,
    creditorBankgiro: ATLAS_GIRO_PAID,
    debtorName: null,
    remittanceInformation: "Kronor okt",
    status: "booked",
  },
  {
    transactionId: "op-4429",
    bookingDate: "2026-11-06",
    valueDate: "2026-11-06",
    amount: -19_800,
    currency: "SEK",
    creditorName: "Atlas Copco",
    creditorIban: null,
    creditorBankgiro: ATLAS_GIRO_PAID,
    debtorName: null,
    remittanceInformation: "Servicekit",
    status: "booked",
  },
  // Banken lämnar avsändaren tom. Beloppet matchar Abetongs faktura.
  {
    transactionId: "op-abetong",
    bookingDate: "2026-12-04",
    valueDate: "2026-12-04",
    amount: 140_000,
    currency: "SEK",
    creditorName: null,
    creditorIban: null,
    creditorBankgiro: null,
    debtorName: null,
    remittanceInformation: "ETAPP2",
    status: "booked",
  },
  {
    transactionId: "op-muller-1",
    bookingDate: "2026-06-14",
    valueDate: "2026-06-14",
    amount: 86_400,
    currency: "SEK",
    creditorName: null,
    creditorIban: null,
    creditorBankgiro: null,
    debtorName: "Muller Tiefbau",
    remittanceInformation: "Sondborrning",
    status: "booked",
  },
  {
    transactionId: "op-muller-2",
    bookingDate: "2026-08-02",
    valueDate: "2026-08-02",
    amount: 112_000,
    currency: "SEK",
    creditorName: null,
    creditorIban: null,
    creditorBankgiro: null,
    debtorName: null,
    remittanceInformation: "INV-8841",
    status: "booked",
  },
  {
    transactionId: "op-muller-3",
    bookingDate: "2026-09-29",
    valueDate: "2026-09-29",
    amount: 64_200,
    currency: "SEK",
    creditorName: null,
    creditorIban: null,
    creditorBankgiro: null,
    debtorName: "Muller Tiefbau GmbH",
    remittanceInformation: null,
    status: "booked",
  },
];

const INVOICES: BookkeepingInvoice[] = [
  {
    id: "SINV-ATLAS-NEW",
    kind: "supplier",
    party: "Atlas Copco",
    partyOrgNumber: "556007-3204",
    issueDate: "2026-11-18",
    dueDate: "2026-12-02",
    amount: 520_000,
    currency: "SEK",
    status: "UNPAID",
    paidDate: null,
    bankgiro: ATLAS_GIRO_INVOICE,
    iban: null,
    paymentTermDays: 14,
  },
  {
    id: "CINV-ABETONG",
    kind: "customer",
    party: "Abetong AB",
    partyOrgNumber: "556232-4771",
    issueDate: "2026-11-04",
    dueDate: "2026-12-04",
    amount: 140_000,
    currency: "SEK",
    status: "UNPAID",
    paidDate: null,
    bankgiro: null,
    iban: null,
    paymentTermDays: 30,
  },
  {
    id: "CINV-MULL-1",
    kind: "customer",
    party: "Müller Tiefbau GmbH",
    partyOrgNumber: null,
    issueDate: "2026-04-20",
    dueDate: "2026-05-20",
    amount: 86_400,
    currency: "SEK",
    status: "PAID",
    paidDate: "2026-06-14",
    bankgiro: null,
    iban: null,
    paymentTermDays: 30,
  },
  {
    id: "CINV-MULL-2",
    kind: "customer",
    party: "Müller Tiefbau GmbH",
    partyOrgNumber: null,
    issueDate: "2026-06-11",
    dueDate: "2026-07-11",
    amount: 112_000,
    currency: "SEK",
    status: "PAID",
    paidDate: "2026-08-02",
    bankgiro: null,
    iban: null,
    paymentTermDays: 30,
  },
  {
    id: "CINV-MULL-3",
    kind: "customer",
    party: "Müller Tiefbau GmbH",
    partyOrgNumber: null,
    issueDate: "2026-08-08",
    dueDate: "2026-09-07",
    amount: 64_200,
    currency: "SEK",
    status: "PAID",
    paidDate: "2026-09-29",
    bankgiro: null,
    iban: null,
    paymentTermDays: 30,
  },
];

const RECURRING: RecurringCost[] = [
  { id: "rec-payroll", label: "Lön", amount: 187_200, dayOfMonth: 25, category: "payroll" },
  { id: "rec-tax", label: "Skattekonto, arbetsgivaravgift", amount: 38_000, dayOfMonth: 12, category: "tax" },
  { id: "rec-rent", label: "Hyra maskinpark", amount: 28_400, dayOfMonth: 27, category: "rent" },
  { id: "rec-utility", label: "El och verkstad", amount: 14_800, dayOfMonth: 29, category: "utility" },
];

/** Det vi inte fick — sägs högt i stället för att visas som nollor. */
const GAPS: FinancialSnapshot["gaps"] = [
  {
    source: "open-payments",
    endpoint: "GET /psd2/accountinformation/v1/accounts/{id}/transactions",
    reason: "consentStatus är received — väntar på signering med BankID",
    fallback: "Saldo och poster modellerade på riktig svarsform tills SCA är klar",
  },
  {
    source: "zwapgrid",
    endpoint: "GET /accounting/api/v1/consents/{id}/supplierinvoices",
    reason: "Consent skapad men source är null — bokföringssystem ej kopplat (403)",
    fallback: "Fakturor läses ur demounderlaget i samma form som API:et svarar",
  },
  {
    source: "open-payments",
    endpoint: "creditorName på inkommande betalningar",
    reason: "PSD2 kräver inte ifyllt namn — cirka var femte post saknar avsändare",
    fallback: "Namnet trianguleras mot obetalda kundfakturor i bokföringen",
  },
];

export const demoSource: FinancialSource = {
  id: "demo",
  load: async () => ({
    fetchedAt: new Date().toISOString(),
    mode: "demo",
    company: COMPANY,
    accounts: ACCOUNTS,
    balances: BALANCES,
    transactions: TRANSACTIONS,
    invoices: INVOICES,
    recurring: RECURRING,
    gaps: GAPS,
  }),
};
