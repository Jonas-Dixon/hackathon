import { useEffect, useState } from "react";
import Magnet from "@/components/bits/Magnet";
import { SourceChip } from "@/components/source-mark";
import { COMPANY, type Scenario, type Verdict } from "@/lib/engine";
import type { SourceId } from "@/lib/sources";
import { cn, formatSek } from "@/lib/utils";

const TONE: Record<Verdict["id"], string> = {
  yes: "text-clear border-clear/40",
  no: "text-storm border-storm/45",
  maybe: "text-watch border-watch/40",
  gap: "text-gap border-line-strong",
};

type Face = {
  k: string;
  n: number;
  source?: SourceId;
  hint?: string;
};

export function VerdictPanel({
  verdict,
  scenario,
  takeOrder,
}: {
  verdict: Verdict;
  scenario: Scenario;
  takeOrder: boolean;
}) {
  const [phase, setPhase] = useState<"ask" | "wait" | "done">("ask");

  useEffect(() => {
    setPhase("ask");
  }, [scenario.id, takeOrder]);

  const ordered = takeOrder && scenario.orderAmount > 0;
  const pairs: { left: Face; right: Face; kind: "cost" | "in" | "floor" }[] = ordered
    ? [
        {
          left: { k: "Order", n: scenario.orderAmount, source: "order", hint: "in, sen" },
          right: { k: "Kassa nu", n: COMPANY.cash, source: "bank", hint: "på kontot" },
          kind: "in",
        },
        {
          left: { k: "Material nu", n: scenario.materialCost, source: "boks", hint: scenario.materialDate },
          right: { k: "Kassa då", n: verdict.haveOnSpendDay, source: "bank", hint: "ni har när det ska betalas" },
          kind: "cost",
        },
      ]
    : [
        {
          left: { k: "Lägsta kassa", n: verdict.trough, source: "bank", hint: verdict.troughDate },
          right: { k: "Noll", n: 0, hint: "motpolen" },
          kind: "floor",
        },
      ];

  const question = ordered ? "Kan ni ta den här ordern?" : "Klarar kassan sig utan ny order?";

  function stamp() {
    if (phase !== "ask") return;
    setPhase("wait");
    window.setTimeout(() => setPhase("done"), 420);
  }

  return (
    <div className="flex h-full flex-col gap-5">
      <div>
        <p className="font-mono text-[11px] tracking-[0.22em] text-subtle uppercase">
          Stor order — ja eller nej
        </p>
        <p className="mt-2 max-w-md text-lg leading-snug text-fg">{question}</p>
      </div>

      {phase === "done" ? (
        <div className="order-2 md:order-3">
          <Magnet padding={48} magnetStrength={8} wrapperClassName="inline-block">
            <div
              className={`verdict-stamp inline-block rounded-md border-[1.5px] px-5 py-3 font-display text-4xl leading-none tracking-tight md:text-6xl ${TONE[verdict.id]}`}
            >
              {verdict.word}
            </div>
          </Magnet>
          <p className="mt-3 max-w-md text-[15px] leading-snug text-fg">{verdict.line}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            {verdict.why.map((w) => (
              <li key={w} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-fog/50" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <button
          type="button"
          onClick={stamp}
          disabled={phase === "wait"}
          className="stamp-btn order-2 w-full rounded-md bg-primary px-4 py-3.5 font-mono text-[13px] tracking-[0.16em] text-primary-foreground uppercase transition-transform duration-150 hover:translate-y-px active:translate-y-0 disabled:opacity-60 md:order-3"
        >
          {phase === "wait" ? "Stämplar…" : "Räkna ut svaret"}
        </button>
      )}

      <div className="order-3 space-y-3 md:order-2">
        {pairs.map((p) => (
          <FoldPair key={p.left.k} left={p.left} right={p.right} kind={p.kind} />
        ))}
      </div>
    </div>
  );
}

function FoldPair({
  left,
  right,
  kind,
}: {
  left: Face;
  right: Face;
  kind: "cost" | "in" | "floor";
}) {
  const delta = foldDelta(kind, left.n, right.n);

  return (
    <div className="fold-pair">
      <FoldFace face={left} side="left" />
      <FoldFace face={right} side="right" />
      <div className="fold-crease" aria-hidden="true" />
      <p
        className={cn(
          "fold-delta font-mono text-[10px] tracking-wide uppercase",
          delta.ok ? "text-clear" : "text-storm",
        )}
      >
        {delta.t}
      </p>
    </div>
  );
}

function foldDelta(kind: "cost" | "in" | "floor", left: number, right: number) {
  if (kind === "cost") {
    const gap = right - left;
    return gap >= 0
      ? { t: "räcker", ok: true }
      : { t: `saknas ${formatSek(Math.abs(gap), true)}`, ok: false };
  }
  if (kind === "in") {
    const ratio = left / Math.max(Math.abs(right), 1);
    return ratio > 1.2
      ? { t: `${ratio.toFixed(1).replace(".", ",")}× kassan`, ok: false }
      : { t: "i paritet", ok: true };
  }
  return left < 0 ? { t: "under noll", ok: false } : { t: "över noll", ok: true };
}

function FoldFace({ face, side }: { face: Face; side: "left" | "right" }) {
  return (
    <div className={cn("fold-face", side === "left" ? "fold-left" : "fold-right")}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] tracking-wider text-subtle uppercase">{face.k}</span>
        {face.source ? <SourceChip id={face.source} showName={false} /> : null}
      </div>
      <p className="mt-1 whitespace-nowrap text-[22px] font-semibold tabular tracking-tight">{formatSek(face.n, true)}</p>
      {face.hint ? <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{face.hint}</p> : null}
    </div>
  );
}
