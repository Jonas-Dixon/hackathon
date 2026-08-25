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
 *
 * Zwapgrid-sandboxen delas med andra lag och har ett strikt rate limit. Utan
 * cache triggar varje sidladdning — inklusive Renders egna health checks mot
 * `/` — en ny sexdubbel förfrågan, vilket i praktiken garanterar 429:or. Ett
 * snapshot återanvänds därför i `TTL_MS`, och ett misslyckat liveförsök
 * pausas lika länge innan det försöks igen.
 */
const TTL_MS = 30_000;

let cached: { at: number; snapshot: FinancialSnapshot } | null = null;
let retryLiveAt = 0;

export const getFinancials = createServerFn({ method: "GET" }).handler(async () => {
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) return cached.snapshot;

  if (now >= retryLiveAt) {
    try {
      const { zwapgridSource } = await import("./zwapgrid-source.server");
      const snapshot = (await zwapgridSource.load()) as FinancialSnapshot;
      cached = { at: now, snapshot };
      return snapshot;
    } catch (err) {
      console.error("[financials] live source failed, falling back to demo:", err);
      retryLiveAt = now + TTL_MS;
    }
  }

  const { demoSource } = await import("./demo-source");
  const snapshot = (await demoSource.load()) as FinancialSnapshot;
  cached = { at: now, snapshot };
  return snapshot;
});
