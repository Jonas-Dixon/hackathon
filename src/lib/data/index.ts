import type { FinancialSnapshot, FinancialSource } from "./contracts.ts";
import { demoSource } from "./demo-source.ts";

/**
 * Enda stället som avgör var siffrorna kommer ifrån.
 *
 * Att koppla in skarp data: skriv en modul som uppfyller `FinancialSource`,
 * importera den här och lägg den i SOURCES före demokällan. Inget i UI:t eller
 * motorn behöver ändras — de känner bara till `FinancialSnapshot`.
 *
 *   const liveSource: FinancialSource = {
 *     id: "open-payments+zwapgrid",
 *     load: async () => { ... hämta, mappa till contracts.ts, returnera ... },
 *   };
 *
 * Mockdata läggs enklast som en JSON-fil i contracts-form och läses av en källa
 * som bara gör `await import("./fixtures/nordborr.json")`.
 */
const SOURCES: FinancialSource[] = [demoSource];

export function activeSource(): FinancialSource {
  return SOURCES[0];
}

export async function loadFinancials(): Promise<FinancialSnapshot> {
  return activeSource().load();
}

export type { FinancialSnapshot, FinancialSource } from "./contracts.ts";
export {
  accountMismatches,
  availableBalance,
  namelessMatches,
  paymentHabit,
  toFlows,
} from "./adapter.ts";
