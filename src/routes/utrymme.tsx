import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import {
  CapacityCallout,
  CapacityFooter,
  CapacityRowView,
} from "@/components/capacity-limits";
import { DataFeedsCompact } from "@/components/source-mark";
import { TooltipProvider } from "@/components/ui/tooltip";
import { capacityMethodLine, capacitySnapshot, fmtDay } from "@/lib/capacity";
import { COMPANY } from "@/lib/engine";
import { formatSek } from "@/lib/utils";

export const Route = createFileRoute("/utrymme")({
  head: () => ({
    meta: [{ title: "Sikt — Orderutrymme" }],
  }),
  component: CapacityPage,
});

function CapacityPage() {
  const snap = useMemo(() => capacitySnapshot(), []);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-3xl px-5 py-8 md:px-6 md:py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Sikt
          </Link>

          <header className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-[17px] font-semibold tracking-tight">Orderutrymme</h1>
            <p className="text-[15px] text-muted-foreground">
              {COMPANY.name} · kudde {formatSek(snap.cushion, true)}
            </p>
          </header>

          <section className="mt-4">
            <CapacityRowView row={snap.period} />
          </section>

          <section className="mt-10">
            <h2 className="text-[17px] font-semibold tracking-tight">Kommande 12 veckor</h2>

            {snap.boost ? (
              <div className="mt-5">
                <CapacityCallout
                  amount={snap.boost.amount}
                  date={fmtDay(snap.boost.date)}
                  label={snap.boost.label}
                />
              </div>
            ) : null}

            <a
              href="#metod"
              className="mt-5 inline-block text-[14px] text-fg underline underline-offset-4 decoration-line-strong transition-colors hover:decoration-fg"
            >
              Läs mer om hur utrymmet räknas
            </a>

            <div className="mt-2 space-y-1">
              {snap.horizon.map((row) => (
                <CapacityRowView key={row.id} row={row} />
              ))}
            </div>
          </section>

          <div className="mt-10">
            <CapacityFooter />
          </div>

          <section id="metod" className="mt-14 border-t border-border pt-8">
            <h2 className="font-mono text-[11px] tracking-[0.24em] text-subtle uppercase">
              Så räknas det
            </h2>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
              {capacityMethodLine()}
            </p>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
              Projektionen är dag för dag, 84 dagar framåt: saldot från banken, fakturorna
              från bokföringen, ordern där dess utgifter faktiskt landar. Estimatet för
              när taket nås är den första dagen kassan går under kudden.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <DataFeedsCompact />
              <p className="text-[13px] text-subtle">AI:n är sidekick. Den fattar inte beslutet.</p>
            </div>
          </section>
        </div>
      </div>
    </TooltipProvider>
  );
}
