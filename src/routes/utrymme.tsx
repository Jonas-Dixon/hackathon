import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { CapacityNotice, CapacityTimeline } from "@/components/capacity-limits";
import { SourceLedger } from "@/components/cite";
import { TooltipProvider } from "@/components/ui/tooltip";
import { baselineCapacity, capacityFor, fmtDay, methodLine } from "@/lib/capacity";
import { CITATIONS, citationFactsFrom, setCitationFacts, type CiteId } from "@/lib/citations";
import { availableBalance, toFlows } from "@/lib/data";
import { getFinancials } from "@/lib/data/financials";
import { COMPANY, SCENARIOS, scenarioName, TODAY, setLedger } from "@/lib/engine";
import { LangToggle } from "@/components/lang-toggle";
import { useLang, useT } from "@/lib/lang";
import { cn, formatSek } from "@/lib/utils";

const ALL_CITES = Object.keys(CITATIONS) as CiteId[];

export const Route = createFileRoute("/utrymme")({
  head: () => ({ meta: [{ title: "Sikt" }] }),
  loader: () => getFinancials(),
  component: CapacityPage,
});

function CapacityPage() {
  const financials = Route.useLoaderData();
  const t = useT();
  const lang = useLang();
  setLedger({
    cash: availableBalance(financials.balances),
    flows: toFlows(financials, TODAY, 12),
  });
  setCitationFacts(citationFactsFrom(financials));

  // eslint-disable-next-line react-hooks/exhaustive-deps -- rubrikerna räknas fram ur språkpaketet
  const baseline = useMemo(() => baselineCapacity(), [lang]);
  const withOrders = useMemo(
    () =>
      SCENARIOS.filter((s) => s.orderAmount > 0).map((s) => ({
        scenario: s,
        summary: capacityFor(s, true),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- samma sak här
    [lang],
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-2xl px-5 py-8 md:px-6 md:py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Sikt
          </Link>

          <header className="mt-8 mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-[17px] font-semibold tracking-tight">{t.capacity.heading}</h1>
            <p className="text-[15px] text-muted-foreground">{COMPANY.name}</p>
            <LangToggle className="ml-auto" />
          </header>

          <CapacityNotice summary={baseline} href="/utrymme" />

          <section className="mt-10">
            <h2 className="text-[15px] font-semibold tracking-tight">{t.capacity.ifOneMore}</h2>
            <div className="mt-3 space-y-5">
              {withOrders.map(({ scenario, summary }) => (
                <article key={scenario.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p className="text-[14px] font-medium text-fg">
                      {scenarioName(scenario.id)}
                      <span className="ml-2 font-mono text-[12px] text-subtle">
                        {formatSek(scenario.orderAmount, true)}
                      </span>
                    </p>
                    <p
                      className={cn(
                        "text-[13px]",
                        summary.ok
                          ? "text-muted"
                          : summary.under
                            ? "text-storm"
                            : "text-watch",
                      )}
                    >
                      {summary.ceilingDate
                        ? `${summary.under ? t.capacity.belowZero : t.capacity.thin} ${fmtDay(summary.ceilingDate)}`
                        : t.capacity.holdsWholePeriod}
                    </p>
                  </div>
                  <div className="mt-2">
                    <CapacityTimeline days={summary.days} ceilingDate={summary.ceilingDate} />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <details className="group mt-10 border-t border-border pt-5">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[15px] font-semibold tracking-tight transition-colors hover:text-muted [&::-webkit-details-marker]:hidden">
              <ChevronRight
                className="size-4 transition-transform duration-200 group-open:rotate-90"
                aria-hidden="true"
              />
              {t.common.sources}
              <span className="ml-1 font-mono text-[11px] font-normal text-subtle">
                {t.common.calls(ALL_CITES.length)}
              </span>
            </summary>
            <div className="mt-3">
              <SourceLedger ids={ALL_CITES} />
            </div>
          </details>

          <details className="group mt-4 border-t border-border pt-5">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[15px] font-semibold tracking-tight transition-colors hover:text-muted [&::-webkit-details-marker]:hidden">
              <ChevronRight
                className="size-4 transition-transform duration-200 group-open:rotate-90"
                aria-hidden="true"
              />
              {t.capacity.method}
            </summary>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">{methodLine()}</p>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
              {t.capacity.methodCertainty}
            </p>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-subtle">
              {t.capacity.methodAi}
            </p>
          </details>
        </div>
      </div>
    </TooltipProvider>
  );
}
