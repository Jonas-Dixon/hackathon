import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { CapacityTimeline } from "@/components/capacity-limits";
import { CashCalendar } from "@/components/cash-calendar";
import { CrossBoard } from "@/components/cross-board";
import { DayTip } from "@/components/day-tip";
import { AnswerStep, AskStep, PlacedStep } from "@/components/decision";
import { TopNav } from "@/components/top-nav";
import { useDecision } from "@/lib/use-decision";
import { LiveStrip } from "@/components/live-strip";
import { Onboarding } from "@/components/onboarding";
import { SourceLedger } from "@/components/cite";
import { DataFeedsCompact } from "@/components/source-mark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fmtDay } from "@/lib/capacity";
import { CITATIONS, citationFactsFrom, setCitationFacts, type CiteId } from "@/lib/citations";
import { availableBalance, toFlows } from "@/lib/data";
import { getFinancials } from "@/lib/data/financials";
import { TODAY, setLedger, type DayPoint } from "@/lib/engine";
import { getLiveSnapshot } from "@/lib/live";
import { feedHealthFrom } from "@/lib/sources";
import { cn, formatSek, iso } from "@/lib/utils";

const ALL_CITES = Object.keys(CITATIONS) as CiteId[];

export const Route = createFileRoute("/")({
  loader: async () => {
    const [live, financials] = await Promise.all([getLiveSnapshot(), getFinancials()]);
    return { live, financials };
  },
  component: DecisionPage,
});

function DecisionPage() {
  const { live, financials } = Route.useLoaderData();

  // Reskontran innan något projiceras — även vid rendering på servern, för
  // annars svarar första sidvisningen på demoflödet.
  setLedger({
    cash: availableBalance(financials.balances),
    flows: toFlows(financials, TODAY, 12),
  });
  setCitationFacts(citationFactsFrom(financials));

  const d = useDecision();

  return (
    <TooltipProvider>
      <Onboarding />
      <div className="min-h-screen bg-background text-foreground">
        <TopNav current="/" onReset={d.reset} health={feedHealthFrom(financials)} />

        {d.step === "detail" && d.verdict ? (
          <Detail live={live} verdictDays={d.verdict.days} onBack={() => d.setStep("answer")} />
        ) : (
          <div className="flex min-h-[calc(100vh-61px)] items-start px-5 py-12 md:px-8">
            {d.placed && d.verdict ? (
              <PlacedStep
                draft={d.draft}
                verdict={d.verdict}
                onReset={d.reset}
                onDetail={() => d.setStep("detail")}
              />
            ) : d.step === "ask" ? (
              <AskStep
                draft={d.draft}
                setDraft={d.setDraft}
                onSubmit={() => d.setStep("answer")}
              />
            ) : d.verdict ? (
              <AnswerStep
                verdict={d.verdict}
                draft={d.draft}
                onBack={() => d.setStep("ask")}
                onDetail={() => d.setStep("detail")}
                onPlace={d.place}
              />
            ) : null}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

/** Steg tre: allt som ligger bakom svaret, för den som vill granska. */
function Detail({
  live,
  verdictDays,
  onBack,
}: {
  live: Parameters<typeof LiveStrip>[0]["live"];
  verdictDays: DayPoint[];
  onBack: () => void;
}) {
  const [hover, setHover] = useState<DayPoint | null>(null);
  const days = useMemo(() => verdictDays.slice(0, 84), [verdictDays]);
  const selected = hover ?? days.find((x) => x.date === iso(TODAY)) ?? days[0] ?? null;
  const marks: Record<string, string> = { [iso(TODAY)]: "idag" };
  const trough = useMemo(
    () => days.reduce((m, p) => (p.endCash < m.endCash ? p : m), days[0]),
    [days],
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Tillbaka till svaret
      </button>

      <h1 className="mt-6 text-xl font-semibold tracking-tight">Beslutsunderlag</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Prognosen med ordern inräknad. Lägst {formatSek(trough.endCash, true)} den{" "}
        {fmtDay(trough.date)}.
      </p>

      <section className="mt-6 rounded-lg border border-border bg-card px-4 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[15px] font-medium">Kassan, 12 veckor framåt</h2>
          <DataFeedsCompact />
        </div>
        <div className="mt-3">
          <CapacityTimeline
            days={days.map((x) => ({
              date: x.date,
              endCash: x.endCash,
              risk: x.risk,
              fixed: x.outflows.find((f) => f.certainty === "fast")?.label ?? null,
            }))}
            ceilingDate={trough.endCash < 80_000 ? trough.date : null}
          />
        </div>
      </section>

      <section className="mt-4 grid items-start gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader className="flex-row items-baseline justify-between">
            <div>
              <CardTitle>Kassakalender</CardTitle>
              <CardDescription>Prickens form visar hur säker dagens post är.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <CashCalendar
              days={days}
              onHover={setHover}
              activeDate={selected?.date}
              markDates={marks}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="hidden md:block">
            <DayTip day={selected} />
          </div>
          <CrossBoard scenarioId="german" />
        </div>
      </section>

      <details className="group mt-4 rounded-lg border border-border bg-card px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-fg transition-colors hover:text-muted [&::-webkit-details-marker]:hidden">
          <ChevronRight
            className={cn("size-4 transition-transform duration-200 group-open:rotate-90")}
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

      <details className="group mt-4 rounded-lg border border-border bg-card px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-fg transition-colors hover:text-muted [&::-webkit-details-marker]:hidden">
          <ChevronRight
            className="size-4 transition-transform duration-200 group-open:rotate-90"
            aria-hidden="true"
          />
          Live anrop
          <span className="ml-1 font-mono text-[11px] font-normal text-subtle">
            svaren nycklarna faktiskt gav
          </span>
        </summary>
        <div className="mt-4">
          <LiveStrip live={live} />
        </div>
      </details>
    </div>
  );
}
