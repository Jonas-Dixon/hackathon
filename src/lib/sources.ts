import { strings } from "./lang";

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

export type Feed = {
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
};

/** Strukturen. Texten — roll, status, tips — kommer ur språkpaketet. */
const SHAPE: Record<SourceId, { name: string | null; href: string; status: FeedStatus; coverage: number }> = {
  bank: { name: "Open Payments", href: "https://www.openpayments.io/", status: "live", coverage: 0.82 },
  boks: { name: "Zwapgrid", href: "https://www.zwapgrid.com/", status: "lag", coverage: 0.61 },
  order: { name: null, href: "#", status: "model", coverage: 1 },
};

export function feed(id: SourceId): Feed {
  const shape = SHAPE[id];
  const L = strings().feeds[id];
  return {
    id,
    // Open Payments och Zwapgrid heter så på båda språken. "Ordern" gör det inte.
    name: shape.name ?? (L as { name: string }).name,
    short: L.short,
    href: shape.href,
    role: L.role,
    status: shape.status,
    statusLabel: L.statusLabel,
    synced: L.synced,
    coverage: shape.coverage,
    tip: L.tip,
  };
}
