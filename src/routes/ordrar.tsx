import { createFileRoute, Link } from "@tanstack/react-router";
import { Paperclip, Plus } from "lucide-react";
import { useEffect } from "react";
import { ProviderBar } from "@/components/providers";
import { TopNav } from "@/components/top-nav";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getFinancials } from "@/lib/data/financials";
import { fmtDay } from "@/lib/capacity";
import { availableBalance, toFlows } from "@/lib/data";
import { TODAY, setLedger } from "@/lib/engine";
import type { VerdictId } from "@/lib/order";
import { useOrders } from "@/lib/orders-store";
import { feedHealthFrom } from "@/lib/sources";
import { cn, formatSek } from "@/lib/utils";

export const Route = createFileRoute("/ordrar")({
  head: () => ({ meta: [{ title: "Sikt — Mina ordrar" }] }),
  loader: async () => ({ financials: await getFinancials() }),
  component: OrdersPage,
});

const BADGE: Record<VerdictId, { word: string; cls: string }> = {
  yes: { word: "Höll", cls: "text-clear border-clear/35" },
  tight: { word: "Tunt", cls: "text-watch border-watch/35" },
  no: { word: "Trotsad", cls: "text-storm border-storm/35" },
};

function OrdersPage() {
  const { financials } = Route.useLoaderData();

  // Samma reskontra som beslutssidan, satt före render — annars visar topbaren
  // demons saldo när den här sidan är den första man laddar.
  setLedger({
    cash: availableBalance(financials.balances),
    flows: toFlows(financials, TODAY, 12),
  });

  const orders = useOrders((s) => s.orders);
  const lastId = useOrders((s) => s.lastId);
  const clearHighlight = useOrders((s) => s.clearHighlight);

  // Highlighten är en välkomst, inte ett permanent tillstånd.
  useEffect(() => {
    if (!lastId) return;
    const t = window.setTimeout(clearHighlight, 6000);
    return () => window.clearTimeout(t);
  }, [lastId, clearHighlight]);

  const total = orders.reduce((s, o) => s + o.amount, 0);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <TopNav current="/ordrar" health={feedHealthFrom(financials)} />

        <main className="mx-auto max-w-6xl px-5 py-8 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Mina ordrar</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {orders.length} ordrar · {formatSek(total, true)} i orderstock
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-medium text-primary-foreground transition-transform duration-150 hover:translate-y-px"
            >
              <Plus className="size-4" aria-hidden="true" />
              Ny order
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="mt-8 rounded-lg border border-dashed border-line-strong px-6 py-12 text-center">
              <p className="text-[15px] font-medium text-fg">Blankt papper.</p>
              <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted-foreground">
                Inga ordrar ligger. Pröva en och se om kassan håller innan ni tackar ja.
              </p>
              <Link
                to="/"
                className="mt-4 inline-block rounded-md bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground"
              >
                Pröva en order
              </Link>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
              <div className="hidden grid-cols-[8rem_1fr_7rem_7rem_6rem_5rem] gap-4 border-b border-border px-4 py-2.5 font-mono text-[10px] tracking-[0.14em] text-subtle uppercase md:grid">
                <span>Referens</span>
                <span>Kund</span>
                <span className="text-right">Ordervärde</span>
                <span className="text-right">Material</span>
                <span>Betalas</span>
                <span className="text-right">Utfall</span>
              </div>

              <ul className="divide-y divide-border">
                {orders.map((o) => {
                  const fresh = o.id === lastId;
                  const badge = BADGE[o.verdict];
                  return (
                    <li
                      key={o.id}
                      className={cn(
                        "relative px-4 py-3 transition-colors duration-500",
                        fresh && "bg-clear/[0.07]",
                      )}
                    >
                      {fresh ? (
                        <span
                          className="absolute inset-y-0 left-0 w-0.5 bg-clear"
                          aria-hidden="true"
                        />
                      ) : null}

                      <div className="grid gap-x-4 gap-y-1 md:grid-cols-[8rem_1fr_7rem_7rem_6rem_5rem] md:items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] text-fg">{o.ref}</span>
                          {fresh ? (
                            <span className="rounded-full bg-clear px-1.5 py-px font-mono text-[9px] tracking-wide text-white uppercase">
                              ny
                            </span>
                          ) : null}
                        </div>

                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-[14px] text-fg">{o.customer}</span>
                          {o.attachment ? (
                            <Paperclip
                              className="size-3 shrink-0 text-subtle"
                              aria-label={`Bilaga: ${o.attachment}`}
                            />
                          ) : null}
                        </div>

                        <span className="font-mono text-[13px] tabular text-fg md:text-right">
                          {formatSek(o.amount, true)}
                        </span>
                        <span className="font-mono text-[13px] tabular text-storm md:text-right">
                          −{formatSek(o.materialCost, true)}
                        </span>
                        <span className="font-mono text-[12px] text-muted">
                          {fmtDay(o.materialDate)}
                        </span>

                        <span className="md:text-right">
                          <span
                            className={cn(
                              "inline-block rounded border px-1.5 py-px font-mono text-[10px] tracking-wide uppercase",
                              badge.cls,
                            )}
                          >
                            {badge.word}
                          </span>
                        </span>
                      </div>

                      {!o.followedAdvice && o.verdict !== "yes" ? (
                        <p className="mt-1.5 text-[11px] text-subtle">
                          Lagd mot rådet — kassan bottnade på {formatSek(o.trough, true)}.
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <ProviderBar className="mt-10 border-t border-border pt-6" health={feedHealthFrom(financials)} />
        </main>
      </div>
    </TooltipProvider>
  );
}
