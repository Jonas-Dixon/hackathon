/**
 * Seeds the connected Fortnox tenant with Nordborr AB's book, through Zwapgrid.
 *
 * Writes go via Proxy.1 (Fortnox native) because the unified invoice-line schema
 * cannot set a revenue account, and Fortnox refuses to bookkeep a line without
 * one. Payments are created through unified API.1 so the write path we depend on
 * at read time is the one we exercise here. Reads are unified API.1 throughout.
 *
 *   ZWAPGRID_API_KEY=... node scripts/seed-fortnox.mjs
 *
 * Clears previous invoices first, so a clean run replaces rather than
 * accumulates. Fortnox will not cancel an invoice that is booked and paid,
 * so to fill gaps in an existing seed instead of rebuilding it, use:
 *
 *   --keep              leave existing invoices alone
 *   --only=1002,2011    restrict to these customer / supplier numbers
 *
 * Generation is seeded, so a filtered run produces exactly the same invoices
 * that a full run would have produced for those counterparties.
 */

const API_KEY = process.env.ZWAPGRID_API_KEY;
const CONSENT_ID = process.env.ZWAPGRID_CONSENT_ID ?? "60141c3c-7821-41d0-86d6-a5842ea721e3";
const BASE = process.env.ZWAPGRID_API ?? "https://apione.zwapgrid.com";

if (!API_KEY) {
  console.error("ZWAPGRID_API_KEY is not set.");
  process.exit(1);
}

const TODAY = "2026-08-25";
const HISTORY_START = "2025-09-01";
const ROOT = `${BASE}/accounting/api/v1/consents/${CONSENT_ID}`;

const KEEP = process.argv.includes("--keep");
const ONLY = process.argv
  .find((a) => a.startsWith("--only="))
  ?.slice("--only=".length)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// ---------------------------------------------------------------- primitives

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function request(method, url, body, attempt = 0) {
  const res = await fetch(url, {
    method,
    headers: {
      "x-api-key": API_KEY,
      "x-correlation-id": crypto.randomUUID(),
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    await sleep(400 * 2 ** attempt);
    return request(method, url, body, attempt + 1);
  }

  const text = await res.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, ok: res.ok, body: parsed };
}

const api = (method, path, body) => request(method, `${ROOT}${path}`, body);
const fortnox = (method, path, body) => request(method, `${ROOT}/proxy${path}`, body);

function fortnoxError(res) {
  // Fortnox is inconsistent about casing in this envelope.
  const info = res.body?.ErrorInformation;
  const message = info?.message ?? info?.Message;
  if (message) return `${message} (code ${info.code ?? info.Code})`;
  if (res.body?.detail) return res.body.detail;
  if (res.body?.errors) return JSON.stringify(res.body.errors);
  return `HTTP ${res.status} ${JSON.stringify(res.body ?? "").slice(0, 160)}`;
}

async function pool(items, size, worker) {
  const queue = [...items.entries()];
  const results = [];
  const runners = Array.from({ length: Math.min(size, queue.length) }, async () => {
    while (queue.length) {
      const [index, item] = queue.shift();
      results[index] = await worker(item, index);
    }
  });
  await Promise.all(runners);
  return results;
}

// ---------------------------------------------------------------- dates & rng

const DAY = 86_400_000;
const parse = (s) => new Date(`${s}T00:00:00Z`);
const iso = (d) => d.toISOString().slice(0, 10);
const shift = (s, days) => iso(new Date(parse(s).getTime() + days * DAY));
const before = (a, b) => parse(a).getTime() < parse(b).getTime();

/** Nudges a date off Saturday/Sunday, the way real settlement behaves. */
function businessDay(s) {
  const day = parse(s).getUTCDay();
  if (day === 6) return shift(s, 2);
  if (day === 0) return shift(s, 1);
  return s;
}

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = rng(20260825);

/** Box-Muller, so lateness clusters around the mean instead of spreading flat. */
function normal(mean, sd) {
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (lo, hi) => lo + rand() * (hi - lo);

// ---------------------------------------------------------------- the company

const CUSTOMERS = [
  {
    number: "1001",
    name: "Mälarenergi AB",
    org: "556554-1504",
    address: "Sjöhagsvägen 3",
    zip: "72130",
    city: "Västerås",
    terms: 30,
    lateMean: 2,
    lateSd: 3,
    cadenceDays: [26, 40],
    amounts: [95_000, 240_000],
    jobs: ["Bergvärme, etapp", "Servicearbete borrhål", "Energibrunn, komplettering"],
  },
  {
    number: "1002",
    name: "Müller Tiefbau GmbH",
    org: "DE811907980",
    address: "Industriestraße 44",
    zip: "40233",
    city: "Düsseldorf",
    country: "DE",
    terms: 60,
    lateMean: 34,
    lateSd: 11,
    cadenceDays: [45, 70],
    amounts: [310_000, 620_000],
    jobs: ["Pålning, delleverans", "Geoteknisk borrning", "Spontning, etapp"],
  },
  {
    number: "1003",
    name: "Abetong AB",
    org: "556047-0398",
    address: "Verkstadsgatan 8",
    zip: "35245",
    city: "Växjö",
    terms: 30,
    lateMean: 6,
    lateSd: 4,
    cadenceDays: [30, 48],
    amounts: [120_000, 290_000],
    jobs: ["Pålning industriplatta", "Grundförstärkning", "Borrning, fundament"],
  },
  {
    number: "1004",
    name: "Åkerby Fastigheter AB",
    org: "559102-4417",
    address: "Åkerbyvägen 17",
    zip: "72219",
    city: "Västerås",
    terms: 14,
    lateMean: -1,
    lateSd: 2,
    cadenceDays: [38, 60],
    amounts: [48_000, 130_000],
    jobs: ["Bergvärme villa", "Borrhål, radhus", "Service värmepump"],
  },
  {
    number: "1005",
    name: "Enköpings Kommun",
    org: "212000-0282",
    address: "Kungsgatan 42",
    zip: "74535",
    city: "Enköping",
    terms: 30,
    lateMean: 12,
    lateSd: 5,
    cadenceDays: [40, 65],
    amounts: [140_000, 330_000],
    jobs: ["Pålning skolbyggnad", "Geoteknisk undersökning", "Bergvärme, kommunhus"],
  },
  {
    number: "1006",
    name: "Peab Anläggning AB",
    org: "556568-6668",
    address: "Margretetorpsvägen 84",
    zip: "26092",
    city: "Förslöv",
    terms: 45,
    lateMean: 21,
    lateSd: 8,
    cadenceDays: [35, 55],
    amounts: [180_000, 450_000],
    jobs: ["Pålning, entreprenad", "Borrning vägbank", "Spontning, delfaktura"],
  },
];

const SUPPLIERS = [
  {
    number: "2001",
    name: "Atlas Borrteknik AB",
    org: "556039-2611",
    bankgiro: "5822-1102",
    address: "Industrivägen 12",
    zip: "70227",
    city: "Örebro",
    terms: 30,
    account: 4010,
    cadenceDays: [30, 45],
    amounts: [38_000, 96_000],
    items: ["Borrkronor och slitdelar", "Borrstål, leverans", "Reservdelar borrigg"],
  },
  {
    number: "2002",
    name: "Sandvik Stål AB",
    org: "556000-4308",
    bankgiro: "1234-5674",
    address: "Storgatan 2",
    zip: "81181",
    city: "Sandviken",
    terms: 30,
    account: 4010,
    cadenceDays: [40, 60],
    amounts: [42_000, 110_000],
    items: ["Stålrör, pålning", "Foderrör", "Svetsgods"],
  },
  {
    number: "2003",
    name: "Preem AB",
    org: "556072-6977",
    bankgiro: "4567-8901",
    address: "Warfvinges väg 45",
    zip: "11251",
    city: "Stockholm",
    terms: 20,
    account: 5611,
    cadenceDays: [28, 34],
    amounts: [46_000, 78_000],
    items: ["Diesel, maskinpark", "Drivmedel och olja"],
  },
  {
    number: "2004",
    name: "Ramirent AB",
    org: "556265-4808",
    bankgiro: "7788-9913",
    address: "Gårdsfogdevägen 18",
    zip: "16866",
    city: "Bromma",
    terms: 30,
    account: 5220,
    cadenceDays: [30, 32],
    amounts: [22_000, 38_000],
    items: ["Hyra maskinpark", "Hyra borrigg, månad"],
  },
  {
    number: "2005",
    name: "Länsförsäkringar Bergslagen",
    org: "578000-9956",
    bankgiro: "2233-4452",
    address: "Stora Torget 3",
    zip: "72215",
    city: "Västerås",
    terms: 30,
    account: 6310,
    cadenceDays: [90, 92],
    amounts: [19_500, 21_000],
    items: ["Maskinförsäkring, kvartal", "Företagsförsäkring"],
  },
];

/**
 * Same name, same org number, different bankgiro. This is what supplier-payment
 * fraud actually looks like in the books, and it is detectable from live data by
 * comparing the new invoice's payee against where earlier invoices were paid.
 */
const IMPOSTOR = {
  number: "2011",
  name: "Atlas Borrteknik AB",
  org: "556039-2611",
  bankgiro: "9934-2289",
  address: "Industrivägen 12",
  zip: "70227",
  city: "Örebro",
  terms: 14,
  account: 4010,
};

const SALES_ACCOUNT = 3001;
const CASH_ACCOUNT = "1930";

// ---------------------------------------------------------------- generation

function salesInvoices() {
  const out = [];
  for (const c of CUSTOMERS) {
    let cursor = shift(HISTORY_START, Math.floor(between(0, 25)));
    let n = 0;
    while (before(cursor, shift(TODAY, -3))) {
      const net = Math.round(between(c.amounts[0], c.amounts[1]) / 500) * 500;
      const issueDate = businessDay(cursor);
      const dueDate = businessDay(shift(issueDate, c.terms));
      const lateness = Math.round(normal(c.lateMean, c.lateSd));
      const settle = businessDay(shift(dueDate, Math.max(lateness, -c.terms + 2)));

      out.push({
        kind: "sales",
        customer: c,
        label: `${pick(c.jobs)} ${(n % 4) + 1}`,
        net,
        issueDate,
        dueDate,
        // Anything that would settle in the future is simply still outstanding,
        // so the open ledger falls out of each customer's own payment behaviour.
        paidDate: before(settle, TODAY) ? settle : null,
      });

      cursor = shift(cursor, Math.round(between(c.cadenceDays[0], c.cadenceDays[1])));
      n += 1;
    }
  }
  return out;
}

function supplierInvoices() {
  const out = [];
  for (const s of SUPPLIERS) {
    let cursor = shift(HISTORY_START, Math.floor(between(0, 20)));
    while (before(cursor, shift(TODAY, -3))) {
      const net = Math.round(between(s.amounts[0], s.amounts[1]) / 100) * 100;
      const issueDate = businessDay(cursor);
      const dueDate = businessDay(shift(issueDate, s.terms));
      // Nordborr pays its own suppliers a touch early; that is the discipline
      // that makes the liquidity question worth asking in the first place.
      const settle = businessDay(shift(dueDate, Math.round(normal(-2, 3))));

      out.push({
        kind: "supplier",
        supplier: s,
        reference: String(70_000 + Math.floor(rand() * 29_000)),
        label: pick(s.items),
        net,
        issueDate,
        dueDate,
        paidDate: before(settle, TODAY) ? settle : null,
      });

      cursor = shift(cursor, Math.round(between(s.cadenceDays[0], s.cadenceDays[1])));
    }
  }

  // The live fraud signal: a large, unpaid, short-dated invoice from a payee
  // that has never been used before, arriving right when the German order needs
  // material bought.
  out.push({
    kind: "supplier",
    supplier: IMPOSTOR,
    reference: "77301",
    label: "Borrkronor, expressleverans",
    net: 416_000,
    issueDate: businessDay(shift(TODAY, -4)),
    dueDate: businessDay(shift(TODAY, 10)),
    paidDate: null,
  });

  return out;
}

// ---------------------------------------------------------------- execution

async function cancelExisting() {
  for (const [listPath, itemPath, key, numberField] of [
    ["/3/invoices?limit=500", "/3/invoices", "Invoices", "DocumentNumber"],
    ["/3/supplierinvoices?limit=500", "/3/supplierinvoices", "SupplierInvoices", "GivenNumber"],
  ]) {
    const list = await fortnox("GET", listPath);
    const rows = list.body?.[key] ?? [];
    const live = rows.filter((r) => !r.Cancelled);
    if (!live.length) continue;
    process.stdout.write(`  cancelling ${live.length} existing ${key}… `);
    let done = 0;
    for (const row of live) {
      const res = await fortnox("PUT", `${itemPath}/${row[numberField]}/cancel`);
      if (res.ok) done += 1;
    }
    console.log(`${done}/${live.length}`);
  }
}

/**
 * A tenant only ships a few terms-of-payment codes, and assigning one that does
 * not exist fails the whole counterparty create.
 */
async function ensureTerms() {
  const wanted = [...new Set([...CUSTOMERS, ...SUPPLIERS, IMPOSTOR].map((p) => String(p.terms)))];
  const list = await fortnox("GET", "/3/termsofpayments");
  const have = new Set((list.body?.TermsOfPayments ?? []).map((t) => t.Code));
  const missing = wanted.filter((c) => !have.has(c));
  if (!missing.length) {
    console.log(`  all ${wanted.length} terms codes present`);
    return;
  }
  for (const code of missing) {
    const res = await fortnox("POST", "/3/termsofpayments", {
      TermsOfPayment: { Code: code, Description: `${code} dagar` },
    });
    console.log(`  ${res.ok ? "ok  " : "FAIL"} terms ${code}${res.ok ? "" : ` — ${fortnoxError(res)}`}`);
  }
}

async function ensureCounterparties() {
  const jobs = [
    ...CUSTOMERS.map((c) => ({
      path: "/3/customers",
      number: c.number,
      label: `customer ${c.number} ${c.name}`,
      payload: {
        Customer: {
          CustomerNumber: c.number,
          Name: c.name,
          OrganisationNumber: c.org,
          Address1: c.address,
          ZipCode: c.zip,
          City: c.city,
          CountryCode: c.country ?? "SE",
          Currency: "SEK",
          TermsOfPayment: String(c.terms),
          Type: "COMPANY",
        },
      },
    })),
    ...[...SUPPLIERS, IMPOSTOR].map((s) => ({
      path: "/3/suppliers",
      number: s.number,
      label: `supplier ${s.number} ${s.name} (${s.bankgiro})`,
      payload: {
        Supplier: {
          SupplierNumber: s.number,
          Name: s.name,
          OrganisationNumber: s.org,
          Address1: s.address,
          ZipCode: s.zip,
          City: s.city,
          CountryCode: "SE",
          Currency: "SEK",
          BG: s.bankgiro,
          TermsOfPayment: String(s.terms),
        },
      },
    })),
  ];

  for (const job of jobs.filter((j) => !ONLY || ONLY.includes(j.number))) {
    let res = await fortnox("POST", job.path, job.payload);
    if (res.status === 400) {
      const id = job.payload.Customer?.CustomerNumber ?? job.payload.Supplier?.SupplierNumber;
      res = await fortnox("PUT", `${job.path}/${id}`, job.payload);
    }
    console.log(`  ${res.ok ? "ok  " : "FAIL"} ${job.label}${res.ok ? "" : ` — ${fortnoxError(res)}`}`);
  }
}

async function createSales(spec) {
  const res = await fortnox("POST", "/3/invoices", {
    Invoice: {
      CustomerNumber: spec.customer.number,
      InvoiceDate: spec.issueDate,
      DueDate: spec.dueDate,
      Currency: "SEK",
      VATIncluded: false,
      Remarks: spec.label,
      InvoiceRows: [
        {
          AccountNumber: SALES_ACCOUNT,
          Description: spec.label,
          DeliveredQuantity: 1,
          Price: spec.net,
        },
      ],
    },
  });
  if (!res.ok) return { error: fortnoxError(res) };
  const inv = res.body.Invoice;
  return { number: inv.DocumentNumber, total: inv.Total };
}

async function createSupplier(spec) {
  const vat = Math.round(spec.net * 0.25);
  const res = await fortnox("POST", "/3/supplierinvoices", {
    SupplierInvoice: {
      SupplierNumber: spec.supplier.number,
      InvoiceNumber: spec.reference,
      InvoiceDate: spec.issueDate,
      DueDate: spec.dueDate,
      Currency: "SEK",
      Total: spec.net + vat,
      VAT: vat,
      SupplierInvoiceRows: [
        { Account: spec.supplier.account, Debit: spec.net, TransactionInformation: spec.label },
      ],
    },
  });
  if (!res.ok) return { error: fortnoxError(res) };
  const inv = res.body.SupplierInvoice;
  return { number: inv.GivenNumber, total: inv.Total };
}

async function seedOne(spec) {
  const created = spec.kind === "sales" ? await createSales(spec) : await createSupplier(spec);
  if (created.error) return { spec, error: `create: ${created.error}` };

  const endpoint = spec.kind === "sales" ? "/3/invoices" : "/3/supplierinvoices";
  const booked = await fortnox("PUT", `${endpoint}/${created.number}/bookkeep`);
  if (!booked.ok) return { spec, error: `bookkeep: ${fortnoxError(booked)}` };

  if (!spec.paidDate) return { spec, number: created.number, total: created.total, open: true };

  const unified = spec.kind === "sales" ? "salesinvoices" : "supplierinvoices";
  const paid = await api("POST", `/${unified}/${created.number}/payments`, {
    receivedDate: spec.paidDate,
    paidDate: spec.paidDate,
    amount: created.total,
    documentCurrencyCode: { currencyId: "SEK" },
    accountingAccount: { accountingAccountId: CASH_ACCOUNT },
  });
  if (!paid.ok) return { spec, number: created.number, error: `payment: ${fortnoxError(paid)}` };

  return { spec, number: created.number, total: created.total, open: false };
}

/** Booking each payment is what actually clears the invoice balance. */
async function bookPayments() {
  for (const [listPath, key, itemPath] of [
    ["/3/invoicepayments?limit=500", "InvoicePayments", "/3/invoicepayments"],
    ["/3/supplierinvoicepayments?limit=500", "SupplierInvoicePayments", "/3/supplierinvoicepayments"],
  ]) {
    const list = await fortnox("GET", listPath);
    const rows = (list.body?.[key] ?? []).filter((p) => !p.Booked);
    if (!rows.length) continue;
    process.stdout.write(`  booking ${rows.length} ${key}… `);
    let done = 0;
    await pool(rows, 3, async (p) => {
      const res = await fortnox("PUT", `${itemPath}/${p.Number}/bookkeep`);
      if (res.ok) done += 1;
    });
    console.log(`${done}/${rows.length}`);
  }
}

// ---------------------------------------------------------------- entry point

async function main() {
  console.log(`Seeding Nordborr AB into consent ${CONSENT_ID}`);
  console.log(`Today ${TODAY}, history from ${HISTORY_START}\n`);

  console.log("Naming the company");
  const named = await fortnox("PUT", "/3/settings/company", {
    CompanySettings: { Name: "Nordborr AB", City: "Västerås", CountryCode: "SE" },
  });
  console.log(`  ${named.ok ? "ok" : `skipped — ${fortnoxError(named)}`}\n`);

  if (KEEP) {
    console.log("Keeping existing invoices (--keep)");
  } else {
    console.log("Clearing previous seed");
    await cancelExisting();
  }

  console.log("\nPayment terms");
  await ensureTerms();

  console.log("\nCounterparties");
  await ensureCounterparties();

  const generated = [...salesInvoices(), ...supplierInvoices()];
  const specs = ONLY
    ? generated.filter((s) => ONLY.includes((s.customer ?? s.supplier).number))
    : generated;
  if (ONLY) console.log(`\nRestricted to ${ONLY.join(", ")} — ${specs.length} of ${generated.length} invoices`);
  const sales = specs.filter((s) => s.kind === "sales");
  const supplier = specs.filter((s) => s.kind === "supplier");
  console.log(
    `\nInvoices to write: ${sales.length} sales, ${supplier.length} supplier ` +
      `(${specs.filter((s) => !s.paidDate).length} left open)`,
  );

  let done = 0;
  const results = await pool(specs, 3, async (spec) => {
    const out = await seedOne(spec);
    done += 1;
    if (done % 10 === 0) process.stdout.write(`  ${done}/${specs.length}\n`);
    return out;
  });

  const failed = results.filter((r) => r.error);
  console.log(`  ${results.length - failed.length}/${results.length} written`);
  for (const f of failed.slice(0, 12)) {
    const who = f.spec.customer?.name ?? f.spec.supplier?.name;
    console.log(`  FAIL ${f.spec.kind} ${who} ${f.spec.issueDate} — ${f.error}`);
  }

  console.log("\nBooking payments");
  await bookPayments();

  console.log("\nReading back through unified API.1");
  for (const ep of ["salesinvoices", "supplierinvoices", "salesinvoices/payments", "supplierinvoices/payments"]) {
    const res = await api("GET", `/${ep}?pageSize=1`);
    console.log(`  ${ep.padEnd(28)} ${res.body?.meta?.totalResources ?? "?"}`);
  }

  console.log("\nDone.");
}

await main();
