import { createServerFn } from "@tanstack/react-start";
import type { FinancialSnapshot } from "./contracts.ts";

/**
 * Underlaget, hämtat på servern.
 *
 * Den skarpa källan bär en API-nyckel och kan därför inte ligga i `SOURCES` i
 * index.ts — den listan importeras av klienten. Nyckeln stannar bakom den här
 * serverfunktionen; klienten får bara det färdiga snapshotet.
 *
 * Går hämtningen inte igenom faller vi tillbaka på demokällan i stället för att
 * visa en tom sida, och `mode` i svaret säger vilket av dem du tittar på.
 */
export const getFinancials = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { zwapgridSource } = await import("./zwapgrid-source.server");
    return (await zwapgridSource.load()) as FinancialSnapshot;
  } catch (err) {
    console.error("[financials] live source failed, falling back to demo:", err);
    const { demoSource } = await import("./demo-source");
    return (await demoSource.load()) as FinancialSnapshot;
  }
});
