import { ArrowRight } from "lucide-react";
import { Cite } from "@/components/cite";
import { SourceIcon } from "@/components/source-mark";
import type { CiteId } from "@/lib/citations";
import { cn } from "@/lib/utils";

type Pairing = {
  /** Vad banken vet. */
  bank: string;
  /** Vad böckerna vet. */
  books: string;
  /** Vad som blir synligt först när de läggs bredvid varandra. */
  result: string;
  /** Vilket av hackathonets problem det träffar. */
  tag: string;
  tone: "storm" | "clear" | "watch";
  cites: CiteId[];
};

const PAIRS: Pairing[] = [
  {
    bank: "4 betalningar till bankgiro 5051-9071",
    books: "Ny faktura pekar på 5822-1104",
    result: "Leverantören har bytt konto. Betalningen hålls.",
    tag: "Fakturabedrägeri",
    tone: "storm",
    cites: ["op-tx-atlas", "zg-sinv-atlas"],
  },
  {
    bank: "140 000 kr in, avsändarfält tomt",
    books: "Obetald faktura, Abetong AB, 140 000 kr",
    result: "Namnet fylls i. Luckan sägs högt, inte tyst.",
    tag: "Datafragmentering",
    tone: "clear",
    cites: ["op-tx-nameless", "zg-cinv-abetong"],
  },
  {
    bank: "3 inbetalningar, faktiska datum",
    books: "Samma 3 fakturor, förfallodatum",
    result: "Kunden betalar 23 dagar sent. Varje gång.",
    tag: "Betalmönster",
    tone: "watch",
    cites: ["op-tx-muller", "zg-cinv-muller"],
  },
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
  return (
    <section className={cn("rounded-lg border border-border bg-card px-4 py-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[15px] font-medium text-fg">Ingen av källorna kunde svara ensam</h2>
        <p className="text-[12px] text-subtle">3 fynd ur korsningen</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 border-b border-border pb-2">
        <div className="flex items-center gap-1.5">
          <SourceIcon id="bank" className="size-3.5 shrink-0 text-fg" />
          <span className="text-[12px] font-medium text-fg">Open Payments</span>
          <span className="truncate text-[11px] text-subtle">vad ni har</span>
        </div>
        <div className="flex items-center gap-1.5">
          <SourceIcon id="boks" className="size-3.5 shrink-0 text-fg" />
          <span className="text-[12px] font-medium text-fg">Zwapgrid</span>
          <span className="truncate text-[11px] text-subtle">vad ni är skyldiga</span>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {PAIRS.map((p) => (
          <li key={p.tag} className="py-3">
            <div className="grid grid-cols-2 gap-3">
              <p className="text-[12px] leading-snug text-muted">{p.bank}</p>
              <p className="text-[12px] leading-snug text-muted">{p.books}</p>
            </div>
            <div className="mt-2 flex items-start gap-2">
              <ArrowRight className="mt-0.5 size-3 shrink-0 text-subtle" aria-hidden="true" />
              <p className="min-w-0 flex-1 text-[13px] leading-snug font-medium text-fg">
                {p.result}
                <Cite ids={p.cites} />
              </p>
              <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] tracking-wide text-subtle uppercase">
                <span className={cn("size-1.5 rounded-full", DOT[p.tone])} />
                {p.tag}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
