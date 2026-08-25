import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { CashCurve } from "@/components/cash-curve";
import { Cite } from "@/components/cite";
import { LeverPanel } from "@/components/lever-panel";
import { OrderBrief } from "@/components/order-brief";
import { Triangulation } from "@/components/triangulation";
import { SourceIcon } from "@/components/source-mark";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fmtDay } from "@/lib/capacity";
import type { Judgement, OrderDraft, VerdictId } from "@/lib/order";
import { COMPANY_PROFILE, ORDER_TEMPLATE, type Sourced } from "@/lib/profile";
import { levers } from "@/lib/solver";
import { cn, formatSek } from "@/lib/utils";

export type Step = "ask" | "answer" | "detail";

const WORD: Record<VerdictId, string> = {
  yes: "Ja.",
  tight: "Knappt.",
  no: "Nej.",
};

const TONE: Record<VerdictId, string> = {
  yes: "text-clear",
  tight: "text-watch",
  no: "text-storm",
};

function digits(s: string): number {
  const n = Number(s.replace(/\D/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function grouped(n: number): string {
  return n ? n.toLocaleString("sv-SE") : "";
}

/** Ett prefillat villkor. Syns, men står aldrig i vägen. */
function Prefill<T>({ label, field }: { label: string; field: Sourced<T> }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help items-center gap-1 text-[12px] text-subtle">
          <SourceIcon
            id={field.origin === "op" ? "bank" : field.origin === "zg" ? "boks" : "order"}
            className="size-3 shrink-0"
          />
          {label} <span className="text-muted">{String(field.value)}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[18rem]">
        <span className="block font-mono text-[10px] break-words text-muted">{field.wire}</span>
        <span className="mt-1 block text-muted-foreground">Ifyllt åt er.</span>
      </TooltipContent>
    </Tooltip>
  );
}

export function AskStep({
  draft,
  setDraft,
  onSubmit,
}: {
  draft: OrderDraft;
  setDraft: (d: OrderDraft) => void;
  onSubmit: () => void;
}) {
  const t = ORDER_TEMPLATE;
  return (
    <div className="onboard-in mx-auto w-full max-w-md">
      <h1 className="font-display text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.02] font-semibold tracking-[-0.02em]">
        Kan ni ta ordern?
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">
        Banken vet vad ni har. Böckerna vet vad ni är skyldiga. Två fält, så räknar vi ihop dem.
      </p>

      <div className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
            Ordervärde
          </span>
          <span className="flex items-baseline gap-2 border-b border-line-strong pb-1.5 focus-within:border-fg">
            <input
              autoFocus
              inputMode="numeric"
              value={grouped(draft.amount)}
              onChange={(e) => setDraft({ ...draft, amount: digits(e.target.value) })}
              placeholder="0"
              aria-label="Ordervärde i kronor"
              className="w-full min-w-0 bg-transparent text-[32px] font-semibold tabular tracking-tight outline-none"
            />
            <span className="shrink-0 text-[15px] text-subtle">kr</span>
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
            Materialet betalas
          </span>
          <input
            type="date"
            value={draft.orderDate}
            onChange={(e) => e.target.value && setDraft({ ...draft, orderDate: e.target.value })}
            aria-label="Datum då materialet betalas"
            className="w-full border-b border-line-strong bg-transparent pb-1.5 text-[19px] tabular outline-none focus:border-fg"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={draft.amount <= 0}
        className="mt-8 w-full rounded-md bg-primary px-6 py-4 font-mono text-[12px] tracking-[0.18em] text-primary-foreground uppercase transition-transform duration-150 hover:translate-y-px disabled:opacity-40"
      >
        Ge mig svaret
      </button>

      <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1.5">
        <Prefill label="Kund" field={t.customer} />
        <Prefill
          label="Material"
          field={{ ...t.materialShare, value: `${Math.round(t.materialShare.value * 100)} %` }}
        />
        <Prefill
          label="Netto"
          field={{ ...t.paymentTermDays, value: `${t.paymentTermDays.value} d` }}
        />
        <Prefill label="Beställare" field={COMPANY_PROFILE.orgNumber} />
      </div>
    </div>
  );
}

export function AnswerStep({
  verdict,
  draft,
  onBack,
  onDetail,
  onPlace,
}: {
  verdict: Judgement;
  draft: OrderDraft;
  onBack: () => void;
  onDetail: () => void;
  onPlace: (date: string) => void;
}) {
  const [fixes, setFixes] = useState<ReturnType<typeof levers>>([]);
  useEffect(() => {
    try {
      setFixes(levers(draft));
    } catch {
      setFixes([]);
    }
  }, [draft]);
  return (
    <div className="onboard-in mx-auto w-full max-w-2xl">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] text-subtle transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Ändra ordern
      </button>

      <p className="mt-8 font-mono text-[11px] tracking-[0.24em] text-subtle uppercase">
        {formatSek(draft.amount)} · material {fmtDay(draft.orderDate)}
      </p>

      {/* Hovra över svaret så tonar siffrorna bakom det in. */}
      <div className="group/verdict mt-2 inline-block">
        <h1
          className={cn(
            "cursor-default font-display text-[clamp(3.75rem,13vw,7.5rem)] leading-[0.9] font-semibold tracking-[-0.03em]",
            TONE[verdict.verdict],
          )}
        >
          {WORD[verdict.verdict]}
        </h1>

        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/verdict:grid-rows-[1fr] motion-reduce:grid-rows-[1fr]">
          <dl className="grid grid-cols-3 gap-x-5 overflow-hidden">
            {[
              ["Material ut", `−${formatSek(verdict.materialCost, true)}`, "text-storm"],
              [
                "Lägst",
                formatSek(verdict.trough, true),
                verdict.trough < 0 ? "text-storm" : "text-watch",
              ],
              ["Kunden betalar", fmtDay(verdict.paymentDate), "text-clear"],
            ].map(([k, v, tone]) => (
              <div key={k} className="pt-5">
                <dt className="font-mono text-[10px] tracking-[0.14em] text-subtle uppercase">
                  {k}
                </dt>
                <dd className={cn("mt-0.5 font-mono text-[13px] tabular", tone)}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {verdict.earliest ? (
        <p className="mt-4 text-[clamp(1.35rem,3.4vw,1.85rem)] leading-snug font-semibold tracking-tight text-fg">
          Lägg den {fmtDay(verdict.earliest)} i stället.
        </p>
      ) : null}

      <OrderBrief draft={draft} verdict={verdict} className="mt-6" />

      <div className="mt-5">
        <CashCurve verdict={verdict} />
      </div>

      <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted">
        {verdict.blocker
          ? `${verdict.blocker.label} på ${formatSek(verdict.blocker.amount, true)} den ${fmtDay(verdict.blocker.date)} är det som tar kassan dit.`
          : verdict.reason}
        <Cite ids={verdict.cites} />
      </p>

      {verdict.baselineHole ? (
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-storm">
          Oavsett ordern: kontot går till{" "}
          {formatSek(verdict.baselineHole.cash, true)} den{" "}
          {fmtDay(verdict.baselineHole.date)}
          {verdict.baselineHole.blocker
            ? `, när ${verdict.baselineHole.blocker.label} på ${formatSek(verdict.baselineHole.blocker.amount, true)} förfaller`
            : ""}
          . Inget orderdatum lagar det.
        </p>
      ) : null}

      <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          onClick={() => onPlace(verdict.earliest ?? draft.orderDate)}
          className="group/cta inline-flex items-center gap-2.5 rounded-lg bg-primary px-7 py-4 text-[16px] font-semibold tracking-tight text-primary-foreground shadow-[0_1px_0_rgb(22_22_21/0.2),0_8px_20px_rgb(22_22_21/0.16)] transition-transform duration-150 hover:translate-y-px active:translate-y-0.5"
        >
          Lägg ordern {fmtDay(verdict.earliest ?? draft.orderDate)}
          <ArrowRight
            className="size-4 transition-transform duration-200 group-hover/cta:translate-x-0.5"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          onClick={onDetail}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-5 py-4 text-[14px] font-medium text-fg transition-colors hover:bg-secondary"
        >
          Visa beslutsunderlag
          <ArrowDown className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {verdict.earliest ? (
        <button
          type="button"
          onClick={() => onPlace(draft.orderDate)}
          className="mt-3 text-[13px] text-subtle underline decoration-line-strong underline-offset-4 transition-colors hover:text-muted"
        >
          Lägg ändå {fmtDay(draft.orderDate)}
        </button>
      ) : null}

      {fixes.length > 0 ? (
        <div className="mt-8">
          <LeverPanel levers={fixes} />
        </div>
      ) : null}

      <Triangulation className="mt-8" />
    </div>
  );
}

export function PlacedStep({
  draft,
  verdict,
  onReset,
  onDetail,
}: {
  draft: OrderDraft;
  verdict: Judgement;
  onReset: () => void;
  onDetail: () => void;
}) {
  const t = ORDER_TEMPLATE;
  const rows: Array<[string, string]> = [
    ["Beställare", `${COMPANY_PROFILE.name.value} · ${COMPANY_PROFILE.orgNumber.value}`],
    ["Kund", `${t.customer.value} · ${t.customerCountry}`],
    ["Ordervärde", `${formatSek(draft.amount)} exkl. moms`],
    ["Material", `${formatSek(verdict.materialCost)} · ${fmtDay(draft.orderDate)}`],
    ["Villkor", `Netto ${t.paymentTermDays.value} dagar`],
    ["Väntad betalning", fmtDay(verdict.paymentDate)],
    ["Konto", `${COMPANY_PROFILE.bank.value} · ${COMPANY_PROFILE.bankgiro.value}`],
  ];

  return (
    <div className="onboard-in mx-auto w-full max-w-lg">
      <span className="grid size-9 place-items-center rounded-full bg-clear/12">
        <Check className="size-4.5 text-clear" aria-hidden="true" />
      </span>

      <h1 className="mt-5 font-display text-[clamp(2rem,6vw,3rem)] leading-[1.02] font-semibold tracking-[-0.02em]">
        Ordern är lagd.
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
        {formatSek(draft.amount)} till {t.customer.value}. Materialet betalas{" "}
        {fmtDay(draft.orderDate)}, pengarna väntas {fmtDay(verdict.paymentDate)}.
      </p>

      <dl className="mt-6">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-border py-2 text-[13px]">
            <dt className="text-subtle">{k}</dt>
            <dd className="text-right text-fg">{v}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-[12px] leading-relaxed text-subtle">
        Betalningen skickas inte skarpt — den ligger i läge held tills någon signerat med BankID.
        <Cite ids={["op-pis-held"]} />
      </p>

      <div className="mt-7 flex flex-wrap gap-2">
        <Link
          to="/ordrar"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-[14px] font-medium text-primary-foreground transition-transform duration-150 hover:translate-y-px"
        >
          Stäng och visa mina ordrar
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={onDetail}
          className="rounded-lg border border-line-strong px-6 py-3.5 text-[14px] font-medium text-fg transition-colors hover:bg-secondary"
        >
          Beslutsunderlag
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-4 py-3.5 text-[14px] text-muted transition-colors hover:text-fg"
        >
          Pröva en till
        </button>
      </div>
    </div>
  );
}

