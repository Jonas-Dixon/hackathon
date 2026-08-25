import type { Certainty, Flow } from "../engine.ts";
import { strings } from "../lang/index.ts";
import { addDays, iso, parseIso } from "../utils.ts";
import type {
  AisBalance,
  BookkeepingInvoice,
  FinancialSnapshot,
  RecurringCost,
} from "./contracts.ts";

/**
 * Översätter API-formen till de poster motorn projicerar på.
 *
 * Här bor besluten som gör prognosen ärlig: vilka poster som räknas som säkra,
 * och att kundfakturor flyttas till det datum kunden faktiskt brukar betala i
 * stället för det som står på fakturan.
 */

/** interimAvailable först — den har redan dragit av det som är på väg ut. */
export function availableBalance(balances: AisBalance[]): number {
  const order: AisBalance["balanceType"][] = [
    "interimAvailable",
    "interimBooked",
    "closingBooked",
    "expected",
  ];
  for (const type of order) {
    const hit = balances.find((b) => b.balanceType === type);
    if (hit) return hit.amount;
  }
  return 0;
}

const CERTAINTY_BY_CATEGORY: Record<RecurringCost["category"], Certainty> = {
  payroll: "fast",
  tax: "fast",
  rent: "fast",
  utility: "fast",
  insurance: "fast",
  other: "forutsagbar",
};

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/**
 * Hur många dagar efter förfallodatum en motpart brukar betala. Bygger bara på
 * fakturor som faktiskt är betalda — inga gissningar om branscher eller länder.
 */
export function paymentHabit(invoices: BookkeepingInvoice[], party: string): number {
  const settled = invoices.filter(
    (i) => i.party === party && i.status === "PAID" && i.paidDate,
  );
  if (settled.length === 0) return 0;
  const total = settled.reduce((s, i) => s + daysBetween(i.dueDate, i.paidDate as string), 0);
  return Math.round(total / settled.length);
}

function invoiceFlow(inv: BookkeepingInvoice, habitDays: number): Flow {
  const incoming = inv.kind === "customer";
  // Kundfakturor flyttas efter historiken. Leverantörsfakturor gör de inte —
  // vi antar inte att vi själva betalar sent.
  const date = incoming ? iso(addDays(parseIso(inv.dueDate), habitDays)) : inv.dueDate;
  const certainty: Certainty = incoming && habitDays > 7 ? "antagande" : "forutsagbar";
  const L = strings().flow;

  return {
    date,
    amount: inv.amount,
    label: incoming ? L.invoiceIn(inv.party) : L.invoiceOut(inv.party),
    kind: incoming ? "in" : "out",
    source: "boks",
    certainty,
    basis: incoming
      ? habitDays > 0
        ? L.invoiceInLate(inv.dueDate, inv.party, habitDays)
        : L.invoiceInOnTime(inv.dueDate)
      : L.invoiceOutBasis(inv.id, inv.dueDate),
  };
}

function recurringFlows(cost: RecurringCost, from: Date, months: number): Flow[] {
  const out: Flow[] = [];
  const L = strings().flow;
  // Källan skriver etiketten på sitt eget språk. Kategorin gör den läsbar på
  // läsarens — bara "other" saknar en och får behålla källans text.
  const label = cost.category === "other" ? cost.label : L.recurring[cost.category];
  for (let m = 0; m < months; m++) {
    const d = new Date(from.getFullYear(), from.getMonth() + m, cost.dayOfMonth);
    if (d < from) continue;
    out.push({
      date: iso(d),
      amount: cost.amount,
      label,
      kind: "out",
      source: "boks",
      certainty: CERTAINTY_BY_CATEGORY[cost.category],
      basis: L.recurringBasis(cost.dayOfMonth),
    });
  }
  return out;
}

/** Allt underlaget innehåller, som en lista motorn kan projicera. */
export function toFlows(snapshot: FinancialSnapshot, from: Date, months = 6): Flow[] {
  const open = snapshot.invoices.filter((i) => i.status === "UNPAID" || i.status === "OVERDUE");

  const habits = new Map<string, number>();
  for (const inv of open) {
    if (!habits.has(inv.party)) {
      habits.set(inv.party, paymentHabit(snapshot.invoices, inv.party));
    }
  }

  return [
    ...open.map((i) => invoiceFlow(i, habits.get(i.party) ?? 0)),
    ...snapshot.recurring.flatMap((c) => recurringFlows(c, from, months)),
  ].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Leverantörer vars fakturakonto skiljer sig från det ni faktiskt betalat till
 * tidigare. Kärnkontrollen mot fakturabedrägeri.
 */
export function accountMismatches(snapshot: FinancialSnapshot): Array<{
  party: string;
  invoiceId: string;
  paidTo: string;
  invoiceSays: string;
  timesPaid: number;
}> {
  const out: ReturnType<typeof accountMismatches> = [];

  for (const inv of snapshot.invoices) {
    if (inv.kind !== "supplier" || !inv.bankgiro) continue;
    const paid = snapshot.transactions.filter(
      (t) => t.amount < 0 && t.creditorName === inv.party && t.creditorBankgiro,
    );
    if (paid.length === 0) continue;

    const known = paid[0].creditorBankgiro as string;
    const consistent = paid.every((t) => t.creditorBankgiro === known);
    if (consistent && known !== inv.bankgiro) {
      out.push({
        party: inv.party,
        invoiceId: inv.id,
        paidTo: known,
        invoiceSays: inv.bankgiro,
        timesPaid: paid.length,
      });
    }
  }
  return out;
}

/**
 * Inbetalningar där banken inte lämnat avsändare men beloppet matchar en
 * obetald kundfaktura. Luckan fylls från böckerna — och sägs högt.
 */
export function namelessMatches(snapshot: FinancialSnapshot): Array<{
  transactionId: string;
  amount: number;
  matchedParty: string;
  invoiceId: string;
}> {
  const unpaid = snapshot.invoices.filter((i) => i.kind === "customer" && i.status !== "PAID");
  return snapshot.transactions
    .filter((t) => t.amount > 0 && !t.debtorName && !t.creditorName)
    .flatMap((t) => {
      const hit = unpaid.find((i) => i.amount === t.amount);
      return hit
        ? [
            {
              transactionId: t.transactionId,
              amount: t.amount,
              matchedParty: hit.party,
              invoiceId: hit.id,
            },
          ]
        : [];
    });
}
