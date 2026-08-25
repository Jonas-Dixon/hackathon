export type SourceId = "bank" | "boks" | "order";
export type FeedStatus = "live" | "lag" | "model";

/** Grön prick bara när källan faktiskt svarade — inte när vi föll tillbaka på demo. */
export type FeedHealth = { bank: boolean; boks: boolean };

export function feedHealthFrom(snapshot: {
  mode: "demo" | "live";
  accounts: unknown[];
  invoices: unknown[];
}): FeedHealth {
  return {
    bank: snapshot.mode === "live" && snapshot.accounts.length > 0,
    boks: snapshot.mode === "live" && snapshot.invoices.length > 0,
  };
}

export const FEEDS: Record<
  SourceId,
  {
    id: SourceId;
    name: string;
    short: string;
    href: string;
    role: string;
    status: FeedStatus;
    statusLabel: string;
    synced: string;
    coverage: number;
    tip: string;
  }
> = {
  bank: {
    id: "bank",
    name: "Open Payments",
    short: "Bank",
    href: "https://www.openpayments.io/",
    role: "AIS + PIS · Danske ORGA",
    status: "live",
    statusLabel: "Live",
    synced: "2 min sedan",
    coverage: 0.82,
    tip: "accountinformation + paymentinitiation + bankgiroinformation. Saldo (interimAvailable), transaktioner, swedish-giro. Live just nu.",
  },
  boks: {
    id: "boks",
    name: "Zwapgrid",
    short: "Böcker",
    href: "https://www.zwapgrid.com/",
    role: "Fakturor, lön, leverantör",
    status: "lag",
    statusLabel: "Släpar",
    synced: "4 dagar sedan",
    coverage: 0.61,
    tip: "Bokföringen, via Zwapgrid. Fakturor och lön. Senast för 4 dagar sen — därför 61%.",
  },
  order: {
    id: "order",
    name: "Ordern",
    short: "Order",
    href: "#",
    role: "Scenario, inte live",
    status: "model",
    statusLabel: "Scenario",
    synced: "inmatad nu",
    coverage: 1,
    tip: "Ordern du testar. Inte från banken eller böckerna.",
  },
};
