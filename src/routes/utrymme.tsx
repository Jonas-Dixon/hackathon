import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { CapacityNotice, CapacityTimeline } from "@/components/capacity-limits";
import { SourceLedger } from "@/components/cite";
import { TooltipProvider } from "@/components/ui/tooltip";
import { baselineCapacity, capacityFor, fmtDay, methodLine } from "@/lib/capacity";
import { CITATIONS, type CiteId } from "@/lib/citations";
import { COMPANY, SCENARIOS } from "@/lib/engine";
import { cn, formatSek } from "@/lib/utils";

const ALL_CITES = Object.keys(CITATIONS) as CiteId[];

export const Route = createFileRoute("/utrymme")({
  head: () => ({
    meta: [{ title: "Sikt — Orderutrymme" }],
  }),
  component: CapacityPage,
});

function CapacityPage() {
  const baseline = useMemo(() => baselineCapacity(), []);
  const withOrders = useMemo(
    () =>
      SCENARIOS.filter((s) => s.orderAmount > 0).map((s) => ({
        scenario: s,
        summary: capacityFor(s, true),
      })),
    [],
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
            <h1 className="text-[17px] font-semibold tracking-tight">Orderutrymme</h1>
            <p className="text-[15px] text-muted-foreground">{COMPANY.name}</p>
          </header>

          <CapacityNotice summary={baseline} href="/utrymme" />

          <section className="mt-10">
            <h2 className="text-[15px] font-semibold tracking-tight">Om ni tar en order till</h2>
            <div className="mt-3 space-y-5">
              {withOrders.map(({ scenario, summary }) => (
                <article key={scenario.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p className="text-[14px] font-medium text-fg">
                      {scenario.name}
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
                        ? `${summary.under ? "Under noll" : "Tunt"} ${fmtDay(summary.ceilingDate)}`
                        : "Håller hela perioden"}
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
              Källor
              <span className="ml-1 font-mono text-[11px] font-normal text-subtle">
                {ALL_CITES.length} anrop
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
              Så räknar vi
            </summary>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">{methodLine()}</p>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
              Varje post är märkt efter hur säker den är. Fast betyder avtalat belopp och datum.
              Förutsägbar betyder faktura med förfallodatum, justerad efter hur motparten brukar
              betala. Antagande betyder att vi räknar med pengarna men att det inte finns någon
              faktura ännu.
            </p>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-subtle">
              AI:n är sidekick. Den läser mönster och säger vad den ser. Den fattar inte beslutet.
            </p>
          </details>
        </div>
      </div>
    </TooltipProvider>
  );
}
