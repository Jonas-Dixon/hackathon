import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import ClickSpark from "@/components/bits/ClickSpark";
import SpotlightCard from "@/components/bits/SpotlightCard";
import { CapacityMini } from "@/components/capacity-limits";
import { CashCalendar } from "@/components/cash-calendar";
import { CashChart } from "@/components/cash-chart";
import { CrossBoard } from "@/components/cross-board";
import { DayTip } from "@/components/day-tip";
import { KpiRow } from "@/components/kpi-row";
import { LiveStrip } from "@/components/live-strip";
import { MissionStrip } from "@/components/mission-strip";
import { Sidekick } from "@/components/sidekick";
import { DataFeeds, DataFeedsCompact } from "@/components/source-mark";
import { VerdictPanel } from "@/components/verdict-panel";
import { YearWheel } from "@/components/year-wheel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  COMPANY,
  SCENARIOS,
  TODAY,
  decide,
  project,
  sidekickNotes,
  type DayPoint,
  type ScenarioId,
} from "@/lib/engine";
import { capacitySnapshot } from "@/lib/capacity";
import { getLiveSnapshot } from "@/lib/live";
import { formatSek, iso } from "@/lib/utils";

export const Route = createFileRoute("/")({
  loader: () => getLiveSnapshot(),
  component: Home,
});

function Home() {
  const live = Route.useLoaderData();
  const [scenarioId, setScenarioId] = useState<ScenarioId>("german");
  const [takeOrder, setTakeOrder] = useState(true);
  const [hover, setHover] = useState<DayPoint | null>(null);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;
  const accept = takeOrder && scenario.orderAmount > 0;
  const days = useMemo(() => project(scenario, accept), [scenario, accept]);
  const verdict = useMemo(() => decide(scenario, accept), [scenario, accept]);
  const notes = useMemo(() => sidekickNotes(scenario, verdict), [scenario, verdict]);
  const capacity = useMemo(() => capacitySnapshot(), []);
  const selected = hover ?? days.find((d) => d.date === iso(TODAY)) ?? days[0] ?? null;

  const marks: Record<string, string> = {};
  if (accept) {
    marks[scenario.materialDate] = "köp";
    marks[scenario.startDate] = "start";
    marks[scenario.payDate] = "in";
  }
  marks[iso(TODAY)] = "idag";

  return (
    <TooltipProvider>
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="flex flex-col border-b border-border bg-card lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <div>
            <p className="font-mono text-[11px] tracking-[0.28em] text-subtle uppercase">Sikt</p>
            <p className="mt-1 text-lg font-medium leading-none tracking-tight">Kan du ta ordern?</p>
          </div>
          <p className="hidden text-xs text-muted-foreground lg:mt-6 lg:block">
            {COMPANY.name}
            <br />
            {COMPANY.city} · {COMPANY.people} pers
          </p>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:flex-col lg:px-3">
          {SCENARIOS.map((s) => {
            const on = s.id === scenarioId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setScenarioId(s.id);
                  setTakeOrder(s.orderAmount > 0);
                }}
                className={`rounded-md px-3 py-2 text-left text-sm transition-colors duration-150 ${
                  on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </nav>
        {scenario.orderAmount > 0 ? (
          <div className="px-4 pb-5 lg:px-3">
            <button
              type="button"
              onClick={() => setTakeOrder((v) => !v)}
              className="w-full rounded-md border border-border px-3 py-2 text-left text-sm text-muted-foreground hover:text-foreground"
            >
              {takeOrder ? "Med ordern" : "Utan ordern"}
            </button>
          </div>
        ) : null}
        <div className="px-4 pb-4 lg:px-3 lg:pb-3">
          <p className="mb-2 hidden px-1 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase lg:block">
            Utrymme
          </p>
          <CapacityMini row={capacity.horizon[0]} />
        </div>
        <div className="hidden lg:block">
          <DataFeeds />
        </div>
      </aside>

      <main className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{scenario.name}</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{scenario.blurb}</p>
          </div>
          <div className="flex items-center gap-2">
            <DataFeedsCompact />
            <span className="font-mono text-sm tabular text-muted-foreground">
              {formatSek(COMPANY.cash, true)}
            </span>
          </div>
        </header>

        <div className="space-y-4 p-4 md:p-6">
          <MissionStrip />
          <LiveStrip live={live} />
          <KpiRow days={days} verdict={verdict} orderAmount={accept ? scenario.orderAmount : 0} />

          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <ClickSpark
              sparkColor="#161615"
              sparkCount={10}
              sparkRadius={22}
              sparkSize={8}
              duration={380}
              className="min-h-0"
            >
              <SpotlightCard
                className="flex h-full min-h-0 flex-col overflow-visible rounded-lg border border-border bg-card py-5 shadow-[0_1px_0_rgb(22_22_21/0.04),0_10px_28px_rgb(22_22_21/0.04)]"
                spotlightColor="rgba(22, 22, 21, 0.08)"
              >
                <div className="px-4">
                  <VerdictPanel verdict={verdict} scenario={scenario} takeOrder={accept} />
                </div>
              </SpotlightCard>
            </ClickSpark>
            <Card className="hidden items-center py-5 lg:flex">
              <CardHeader className="w-full flex-row items-center justify-between">
                <CardTitle className="text-base">Årshjul</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="watch">Vinter stilla</Badge>
                  <Badge variant="storm">Kassa</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex w-full flex-col items-center">
                <YearWheel
                  days={days}
                  onHover={setHover}
                  activeDate={selected?.date}
                  markDates={marks}
                />
                <p className="mt-1 max-w-[260px] text-center text-xs text-muted-foreground">
                  Innerst årstid för borrning. Ytterst kassan där vi har data. Resten är lucka.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <Card>
              <CardHeader className="flex-row items-baseline justify-between">
                <div>
                  <CardTitle>Kassakalender</CardTitle>
                  <CardDescription className="md:hidden">Tryck en dag. Bara dagar som rör kassan.</CardDescription>
                  <CardDescription className="hidden md:block">Varje dag ett kort. Hovra — inga tabeller.</CardDescription>
                </div>
                <Badge>6 veckor</Badge>
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
              <CrossBoard scenarioId={scenarioId} />
              <CrossBoard scenarioId={scenarioId} />
              <Card className="hidden gap-2 py-3 md:flex">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base">Kassa, 8 veckor</CardTitle>
                  <DataFeedsCompact />
                </CardHeader>
                <CardContent>
                  <CashChart days={days} />
                </CardContent>
              </Card>
              <Sidekick notes={notes} />
            </div>
          </section>
        </div>
      </main>
    </div>
    </TooltipProvider>
  );
}
