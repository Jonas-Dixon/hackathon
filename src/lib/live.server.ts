import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ApiCall, LiveBank, LiveConsent, LiveSnapshot } from "./live";

const DEFAULTS: Record<string, string> = {
  OPEN_PAYMENTS_CLIENT_ID: "aabc04df-b82c-44e9-abec-d039ad9587dd",
  OPEN_PAYMENTS_CLIENT_SECRET: "bq0NfFhaWMUneL-sX8Fmw5DYVGjCEhXPS0itmjJZp20",
  OPEN_PAYMENTS_AUTH: "https://auth.sandbox.openbankingplatform.com",
  OPEN_PAYMENTS_API: "https://api.sandbox.openbankingplatform.com",
  ZWAPGRID_API_KEY:
    "9nNPoXhu7nvwiIzfuTRL1dKrYy7QkmHgpxUcPDHAODVtqlsjWHw9Na1BJSZ3amlb_/WV2f52P7obsMbPuRKBxS9+Avo0EmCueHzAibSXt0RY=_30OfJftNwmwLIoTsW12BAw==",
  ZWAPGRID_API: "https://apione.zwapgrid.com",
  ZWAPGRID_CONSENT_ID: "e016cecd-f628-49e8-9902-7461277da8b6",
};

const ZG_STATUS: Record<number, string> = {
  0: "CREATED",
  1: "ACCEPTED",
  2: "REVOKED",
  3: "INACTIVE",
};

const PREFER = ["DABASESX", "ESSESESS", "SWEDSESS", "NDEASESS", "HANDSESS"];

function parseDotenv(text: string, into: Record<string, string>) {
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    into[line.slice(0, i)] = line.slice(i + 1);
  }
}

function creds(): Record<string, string> {
  const out = { ...DEFAULTS };
  for (const file of [
    resolve("/workspace/.env"),
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../../.env"),
  ]) {
    try {
      parseDotenv(readFileSync(file, "utf8"), out);
    } catch {
      /* missing is fine */
    }
  }
  // Platform env last — Render/Vercel project vars beat the baked-in defaults,
  // so the sandbox keys can be rotated without a code change. `process.env` is
  // real inside the Nitro server; only the *client* bundle can't see it.
  for (const key of Object.keys(DEFAULTS)) {
    const fromEnv = process.env[key];
    if (fromEnv) out[key] = fromEnv;
  }
  return out;
}

function abs(base: string, path: string) {
  const root = (base || "").replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const url = `${root}${suffix}`;
  if (!/^https?:\/\//.test(url)) {
    throw new Error(`Ogiltig URL (${path}). Bas saknas.`);
  }
  return url;
}

async function opToken(c: Record<string, string>) {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: c.OPEN_PAYMENTS_CLIENT_ID,
    client_secret: c.OPEN_PAYMENTS_CLIENT_SECRET,
    scope: "aspspinformation accountinformation corporate",
  });
  const res = await fetch(abs(c.OPEN_PAYMENTS_AUTH, "/connect/token"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as {
    access_token?: string;
    scope?: string;
    expires_in?: number;
    error?: string;
  };
  if (!res.ok || !json.access_token) throw new Error(json.error ?? `OP token ${res.status}`);
  return { token: json.access_token, scope: json.scope ?? "", expiresIn: json.expires_in ?? 0, http: res.status };
}

async function fetchOp(c: Record<string, string>): Promise<{
  op: LiveSnapshot["op"];
  calls: ApiCall[];
}> {
  const tok = await opToken(c);
  const aspspRes = await fetch(abs(c.OPEN_PAYMENTS_API, "/psd2/aspspinformation/v1/aspsps?country=SE"), {
    headers: {
      Authorization: `Bearer ${tok.token}`,
      "X-Request-ID": crypto.randomUUID(),
      Accept: "application/json",
    },
  });
  if (!aspspRes.ok) throw new Error(`OP aspsps ${aspspRes.status}`);
  const json = (await aspspRes.json()) as {
    aspsps: { bicFi: string; name: string; logoUrl?: string }[];
  };
  const all = json.aspsps ?? [];
  const banks: LiveBank[] = PREFER.map((bic) => all.find((b) => b.bicFi === bic))
    .filter((b): b is { bicFi: string; name: string; logoUrl?: string } => Boolean(b))
    .map((b) => ({ bic: b.bicFi, name: b.name, logoUrl: b.logoUrl }));

  const calls: ApiCall[] = [
    {
      id: "op-token",
      source: "op",
      method: "POST",
      path: "/connect/token",
      http: tok.http,
      ok: true,
      locked: false,
      title: "Access token",
      fields: [
        { k: "grant_type", v: "client_credentials" },
        { k: "scope", v: tok.scope || "aspspinformation accountinformation corporate" },
        { k: "expires_in", v: String(tok.expiresIn) },
        { k: "token_type", v: "Bearer" },
      ],
    },
    {
      id: "op-aspsp",
      source: "op",
      method: "GET",
      path: "/psd2/aspspinformation/v1/aspsps?country=SE",
      http: aspspRes.status,
      ok: true,
      locked: false,
      title: "ASPSP Information",
      fields: [
        { k: "aspsps.length", v: String(all.length) },
        { k: "country", v: "SE" },
        ...banks.map((b) => ({ k: "bicFi", v: `${b.bic} · ${b.name}` })),
      ],
    },
    {
      id: "op-accounts",
      source: "op",
      method: "GET",
      path: "/psd2/accountinformation/v1/accounts",
      http: null,
      ok: false,
      locked: true,
      title: "AIS accounts",
      fields: [
        { k: "required", v: "Consent-ID + X-BicFi + PSU-Corporate-ID" },
        { k: "consentStatus", v: "received — väntar SCA / BankID" },
        { k: "balances", v: "—" },
        { k: "transactions", v: "—" },
      ],
    },
    {
      id: "op-pis",
      source: "op",
      method: "POST",
      path: "/psd2/payments/swedish-giro",
      http: null,
      ok: false,
      locked: true,
      title: "PIS swedish-giro",
      fields: [
        { k: "giroType", v: "BANKGIRO" },
        { k: "transactionStatus", v: "held" },
        { k: "reason", v: "skickas inte förrän AIS korsats mot faktura" },
      ],
    },
  ];

  return {
    op: { ok: true, aspspCount: all.length, banks, scope: tok.scope },
    calls,
  };
}

async function fetchZg(c: Record<string, string>): Promise<{ zg: LiveSnapshot["zg"]; calls: ApiCall[] }> {
  const headers = {
    "x-api-key": c.ZWAPGRID_API_KEY,
    "x-correlation-id": crypto.randomUUID(),
    Accept: "application/json",
  };
  const res = await fetch(abs(c.ZWAPGRID_API, "/consents/api/v1/consents"), { headers });
  if (!res.ok) throw new Error(`Zwapgrid consents ${res.status}`);
  const json = (await res.json()) as {
    meta?: { totalResources?: number };
    data: {
      id: string;
      name: string;
      status: number;
      source: string | null;
      createdOn: string | null;
    }[];
  };
  const consents: LiveConsent[] = (json.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    status: ZG_STATUS[row.status] ?? String(row.status),
    source: row.source,
    createdOn: row.createdOn,
  }));
  const first = consents[0];

  let invoices: number | null = null;
  let invHttp: number | null = null;
  let invDetail = "kräver status ACCEPTED";
  if (first) {
    const inv = await fetch(abs(c.ZWAPGRID_API, `/accounting/api/v1/consents/${first.id}/supplierinvoices`), {
      headers: { ...headers, "x-correlation-id": crypto.randomUUID() },
    });
    invHttp = inv.status;
    const body = (await inv.json().catch(() => ({}))) as {
      meta?: { totalResources?: number };
      data?: unknown[];
      detail?: string;
      title?: string;
    };
    if (inv.ok) {
      invoices = body.meta?.totalResources ?? body.data?.length ?? 0;
      invDetail = `${invoices} poster`;
    } else {
      invDetail = body.detail ?? body.title ?? `HTTP ${inv.status}`;
    }
  }

  const calls: ApiCall[] = [
    {
      id: "zg-consents",
      source: "zg",
      method: "GET",
      path: "/consents/api/v1/consents",
      http: res.status,
      ok: true,
      locked: false,
      title: "Consents",
      fields: [
        { k: "meta.totalResources", v: String(json.meta?.totalResources ?? consents.length) },
        ...(first
          ? [
              { k: "data[0].id", v: first.id },
              { k: "data[0].name", v: first.name },
              { k: "data[0].status", v: first.status },
              { k: "data[0].source", v: first.source ?? "null" },
              { k: "data[0].createdOn", v: first.createdOn ?? "—" },
            ]
          : [{ k: "data", v: "[]" }]),
      ],
    },
    {
      id: "zg-invoices",
      source: "zg",
      method: "GET",
      path: first
        ? `/accounting/api/v1/consents/${first.id}/supplierinvoices`
        : "/accounting/api/v1/consents/{id}/supplierinvoices",
      http: invHttp,
      ok: invoices != null,
      locked: invoices == null,
      title: "Supplier invoices",
      fields: [
        { k: "locked", v: invoices == null ? "true" : "false" },
        { k: "detail", v: invDetail },
      ],
    },
    {
      id: "zg-company",
      source: "zg",
      method: "GET",
      path: first
        ? `/accounting/api/v1/consents/${first.id}/companyinformation`
        : "/accounting/api/v1/consents/{id}/companyinformation",
      http: null,
      ok: false,
      locked: true,
      title: "Company information",
      fields: [
        { k: "locked", v: "true" },
        { k: "reason", v: "samma consent, source fortfarande null" },
      ],
    },
  ];

  return { zg: { ok: true, consents, invoices }, calls };
}

export async function fetchLive(): Promise<LiveSnapshot> {
  const c = creds();
  const [op, zg] = await Promise.allSettled([fetchOp(c), fetchZg(c)]);
  const opVal = op.status === "fulfilled" ? op.value : null;
  const zgVal = zg.status === "fulfilled" ? zg.value : null;
  return {
    fetchedAt: new Date().toISOString(),
    calls: [...(opVal?.calls ?? []), ...(zgVal?.calls ?? [])],
    op: opVal?.op ?? {
      ok: false,
      aspspCount: 0,
      banks: [],
      scope: "",
      error: op.status === "rejected" ? String(op.reason) : "okänt",
    },
    zg: zgVal?.zg ?? {
      ok: false,
      consents: [],
      invoices: null,
      error: zg.status === "rejected" ? String(zg.reason) : "okänt",
    },
  };
}
