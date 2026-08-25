import assert from "node:assert/strict";
import { test } from "node:test";
import {
  accountMismatches,
  availableBalance,
  namelessMatches,
  paymentHabit,
  toFlows,
} from "./adapter.ts";
import { demoSource } from "./demo-source.ts";

const snapshot = await demoSource.load();

test("saldot tas från interimAvailable, inte bokfört", () => {
  assert.equal(availableBalance(snapshot.balances), 418_400);
});

test("betalmönster mäts på faktiskt betalda fakturor", () => {
  const days = paymentHabit(snapshot.invoices, "Müller Tiefbau GmbH");
  assert.ok(days > 20 && days < 30, `väntade ~23 dagar sent, fick ${days}`);
  assert.equal(paymentHabit(snapshot.invoices, "Finns Inte AB"), 0);
});

test("byte av leverantörskonto fångas", () => {
  const hits = accountMismatches(snapshot);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].party, "Atlas Copco");
  assert.equal(hits[0].timesPaid, 4);
  assert.notEqual(hits[0].paidTo, hits[0].invoiceSays);
});

test("namnlös inbetalning matchas mot obetald faktura", () => {
  const hits = namelessMatches(snapshot);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].matchedParty, "Abetong AB");
  assert.equal(hits[0].amount, 140_000);
});

test("kundfaktura flyttas till det datum kunden faktiskt betalar", () => {
  const flows = toFlows(snapshot, new Date(2026, 10, 20), 3);
  const abetong = flows.find((f) => f.label.includes("Abetong"));
  assert.ok(abetong, "Abetongs betalning saknas");
  // Förfaller 2026-12-04 och kunden har ingen sen historik, så datumet står kvar.
  assert.equal(abetong.date, "2026-12-04");
  assert.equal(abetong.kind, "in");
});

test("leverantörsfaktura flyttas inte — vi antar inte att vi själva betalar sent", () => {
  const flows = toFlows(snapshot, new Date(2026, 10, 20), 3);
  const atlas = flows.find((f) => f.label.includes("Atlas"));
  assert.ok(atlas);
  assert.equal(atlas.date, "2026-12-02");
  assert.equal(atlas.kind, "out");
});

test("återkommande poster rullas ut per månad och märks som fasta", () => {
  const flows = toFlows(snapshot, new Date(2026, 10, 20), 3);
  const payroll = flows.filter((f) => f.label === "Lön");
  assert.ok(payroll.length >= 2, `väntade flera lönekörningar, fick ${payroll.length}`);
  assert.ok(payroll.every((f) => f.certainty === "fast"));
});

test("luckor redovisas i stället för att tigas ihjäl", () => {
  assert.ok(snapshot.gaps.length > 0);
  assert.ok(snapshot.gaps.every((g) => g.reason && g.fallback));
});
