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

export const getLiveSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchLive } = await import("./live.server");
  return fetchLive() as Promise<LiveSnapshot>;
});
