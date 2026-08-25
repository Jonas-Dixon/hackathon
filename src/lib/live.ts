import { createServerFn } from "@tanstack/react-start";

export type LiveBank = { bic: string; name: string; logoUrl?: string };
export type LiveConsent = {
  id: string;
  name: string;
  status: string;
  source: string | null;
  createdOn: string | null;
};
export type ApiField = { k: string; v: string };
export type ApiCall = {
  id: string;
  source: "op" | "zg";
  method: "GET" | "POST";
  path: string;
  http: number | null;
  ok: boolean;
  locked: boolean;
  title: string;
  fields: ApiField[];
};
export type LiveSnapshot = {
  fetchedAt: string;
  calls: ApiCall[];
  op: { ok: boolean; aspspCount: number; banks: LiveBank[]; scope: string; error?: string };
  zg: { ok: boolean; consents: LiveConsent[]; invoices: number | null; error?: string };
};

// Samma delade sandbox och samma health-check-problem som i financials.ts —
// cacha snapshotet i TTL_MS så inte varje sidladdning trycker en ny omgång.
const TTL_MS = 30_000;

let cached: { at: number; snapshot: LiveSnapshot } | null = null;

export const getLiveSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) return cached.snapshot;

  const { fetchLive } = await import("./live.server");
  const snapshot = (await fetchLive()) as LiveSnapshot;
  cached = { at: now, snapshot };
  return snapshot;
});
