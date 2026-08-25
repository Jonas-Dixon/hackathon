import { ArrowRight } from "lucide-react";
import { Cite } from "@/components/cite";
import { SourceIcon } from "@/components/source-mark";
import type { CiteId } from "@/lib/citations";
import { useT } from "@/lib/lang";
import { cn } from "@/lib/utils";

type Pairing = {
  tone: "storm" | "clear" | "watch";
  cites: CiteId[];
};

/** Tonen och källorna hör till fyndet; orden hör till språkpaketet. */
const PAIRS: Pairing[] = [
  { tone: "storm", cites: ["op-tx-atlas", "zg-sinv-atlas"] },
  { tone: "clear", cites: ["op-tx-nameless", "zg-cinv-abetong"] },
  { tone: "watch", cites: ["op-tx-muller", "zg-cinv-muller"] },
];

const DOT: Record<Pairing["tone"], string> = {
  storm: "bg-storm",
  clear: "bg-clear",
  watch: "bg-watch",
};

/**
 * Poängen med hela produkten: banken vet vad ni har, böckerna vet vad ni är
 * skyldiga, och ingen av dem kan svara ensam. Fynden uppstår i korsningen.
 */
export function Triangulation({ className }: { className?: string }) {
  const t = useT();
  return (
    <section className={cn("rounded-lg border border-border bg-card px-4 py-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[15px] font-medium text-fg">{t.triangulation.title}</h2>
        <p className="text-[12px] text-subtle">{t.triangulation.count(PAIRS.length)}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 border-b border-border pb-2">
        <div className="flex items-center gap-1.5">
          <SourceIcon id="bank" className="size-3.5 shrink-0 text-fg" />
          <span className="text-[12px] font-medium text-fg">Open Payments</span>
          <span className="truncate text-[11px] text-subtle">{t.triangulation.bankRole}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <SourceIcon id="boks" className="size-3.5 shrink-0 text-fg" />
          <span className="text-[12px] font-medium text-fg">Zwapgrid</span>
          <span className="truncate text-[11px] text-subtle">{t.triangulation.booksRole}</span>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {PAIRS.map((p, i) => {
          const words = t.triangulation.pairs[i];
          return (
          <li key={words.tag} className="py-3">
            <div className="grid grid-cols-2 gap-3">
              <p className="text-[12px] leading-snug text-muted">{words.bank}</p>
              <p className="text-[12px] leading-snug text-muted">{words.books}</p>
            </div>
            <div className="mt-2 flex items-start gap-2">
              <ArrowRight className="mt-0.5 size-3 shrink-0 text-subtle" aria-hidden="true" />
              <p className="min-w-0 flex-1 text-[13px] leading-snug font-medium text-fg">
                {words.result}
                <Cite ids={p.cites} />
              </p>
              <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] tracking-wide text-subtle uppercase">
                <span className={cn("size-1.5 rounded-full", DOT[p.tone])} />
                {words.tag}
              </span>
            </div>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
