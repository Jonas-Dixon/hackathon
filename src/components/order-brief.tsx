import { FileText, Paperclip, Upload } from "lucide-react";
import { useState } from "react";
import { SourceIcon } from "@/components/source-mark";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fmtDay } from "@/lib/capacity";
import type { Judgement, OrderDraft } from "@/lib/order";
import { ORDER_TEMPLATE } from "@/lib/profile";
import { cn, formatSek } from "@/lib/utils";

/**
 * Vad ordern faktiskt är. Utan den här rutan står man med ett belopp och ett
 * datum och vet inte vad man håller på att tacka ja till.
 */
export function OrderBrief({
  draft,
  verdict,
  className,
}: {
  draft: OrderDraft;
  verdict: Judgement;
  className?: string;
}) {
  const t = ORDER_TEMPLATE;
  const [file, setFile] = useState<string | null>(null);
  const [notice, setNotice] = useState(false);

  const margin = draft.amount - verdict.materialCost;
  const marginPct = draft.amount ? Math.round((margin / draft.amount) * 100) : 0;

  const rows: Array<{ k: string; v: string; sub?: string; source?: "bank" | "boks" | "order" }> = [
    { k: "Kund", v: t.customer.value, sub: t.customerCountry, source: "boks" },
    {
      k: "Material",
      v: formatSek(verdict.materialCost),
      sub: `${Math.round(t.materialShare.value * 100)} % · betalas ${fmtDay(draft.orderDate)}`,
      source: "boks",
    },
    {
      k: "Täckningsbidrag",
      v: formatSek(margin),
      sub: `${marginPct} % av ordervärdet`,
      source: "order",
    },
    {
      k: "Betalning in",
      v: formatSek(draft.amount),
      sub: `netto ${t.paymentTermDays.value} d, väntas ${fmtDay(verdict.paymentDate)}`,
      source: "bank",
    },
  ];

  function pickFile() {
    setNotice(true);
    setFile("order-muller-tiefbau.pdf");
    window.setTimeout(() => setNotice(false), 2600);
  }

  return (
    <section className={cn("rounded-lg border border-border bg-card px-4 py-3.5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-2 text-[14px] font-medium text-fg">
          <FileText className="size-3.5 text-subtle" aria-hidden="true" />
          Vad ordern är
        </h2>
        <p className="font-mono text-[11px] tabular text-subtle">
          {formatSek(draft.amount)} exkl. moms
        </p>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.k} className="min-w-0">
            <dt className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-subtle uppercase">
              {r.source ? <SourceIcon id={r.source} className="size-3 shrink-0" /> : null}
              {r.k}
            </dt>
            <dd className="mt-0.5 truncate text-[14px] font-medium text-fg">{r.v}</dd>
            {r.sub ? <dd className="truncate text-[11px] text-muted-foreground">{r.sub}</dd> : null}
          </div>
        ))}
      </dl>

      <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {file ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] text-muted">
            <Paperclip className="size-3 shrink-0 text-subtle" aria-hidden="true" />
            {file}
          </span>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={pickFile}
                className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-line-strong px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-fg/40 hover:text-fg"
              >
                <Upload className="size-3 shrink-0" aria-hidden="true" />
                Bifoga orderbekräftelse
              </button>
            </TooltipTrigger>
            <TooltipContent>
              I skarpt läge läses fakturarader och förfallodatum ur PDF:en.
            </TooltipContent>
          </Tooltip>
        )}

        {notice ? (
          <span className="rounded-md bg-secondary px-2.5 py-1.5 font-mono text-[10px] tracking-wide text-muted uppercase">
            Demo — filen läses inte
          </span>
        ) : null}
      </div>
    </section>
  );
}
