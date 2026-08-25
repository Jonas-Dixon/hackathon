import { SourceChip } from "@/components/source-mark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScenarioId } from "@/lib/engine";
import { triangulate, type Finding } from "@/lib/cross";
import { ACCOUNT, ASPSP, BALANCE, OP_SCOPES, atlasPayment } from "@/lib/open-payments";
import { cn } from "@/lib/utils";

const TONE: Record<Finding["tone"], string> = {
  storm: "border-storm/40 bg-storm/5",
  watch: "border-watch/40 bg-watch/5",
  clear: "border-clear/35 bg-clear/5",
  gap: "border-border bg-background",
};

const TONE_WORD: Record<Finding["tone"], string> = {
  storm: "Stoppa",
  watch: "Sen",
  clear: "Fylld lucka",
  gap: "Släpar",
};

export function CrossBoard({ scenarioId }: { scenarioId: ScenarioId }) {
  const findings = triangulate(scenarioId);
  const blocked = findings.some((f) => f.id === "iban");
  const pis = atlasPayment(blocked);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Korsning</CardTitle>
            <CardDescription>
              AIS GET /psd2/aspspinformation — banker live. Transaktioner efter BankID.
            </CardDescription>
          </div>
          <div className="flex gap-1.5">
            <SourceChip id="bank" />
            <SourceChip id="boks" />
          </div>
        </div>
        <p className="mt-2 font-mono text-[10px] leading-relaxed text-subtle">
          {ASPSP.name} · {ACCOUNT.usage} · {BALANCE.balanceType} · {OP_SCOPES.join(" · ")}
        </p>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {findings.map((f) => (
          <article key={f.id} className={cn("rounded-md border px-3 py-2.5", TONE[f.tone])}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-fg">{f.title}</p>
              <span className="font-mono text-[10px] tracking-wide text-subtle uppercase">
                {TONE_WORD[f.tone]}
              </span>
            </div>
            <p className="mt-1 text-[13px] leading-snug text-muted">{f.line}</p>
            <p className="mt-1.5 text-[11px] leading-snug text-subtle">{f.detail}</p>
          </article>
        ))}

        {scenarioId === "german" ? (
          <article className="rounded-md border border-storm/40 bg-storm/5 px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-fg">PIS skickas inte</p>
              <span className="font-mono text-[10px] tracking-wide text-subtle uppercase">held</span>
            </div>
            <p className="mt-1 text-[13px] leading-snug text-muted">
              POST /v1/payments/{pis.product} · {pis.giroType} {pis.creditorGiro} · {Math.round(Number(pis.amount) / 1000)} k
            </p>
            <p className="mt-1.5 font-mono text-[11px] leading-snug text-subtle">{pis.reason}</p>
          </article>
        ) : null}
      </CardContent>
    </Card>
  );
}
