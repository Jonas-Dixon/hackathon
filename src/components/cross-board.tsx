import { Cite, SourceRow } from "@/components/cite";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScenarioId } from "@/lib/engine";
import { triangulate, type Finding } from "@/lib/cross";
import { useT } from "@/lib/lang";
import { cn } from "@/lib/utils";

const MARK: Record<Finding["tone"], { dot: string; text: string }> = {
  storm: { dot: "bg-storm", text: "text-storm" },
  watch: { dot: "bg-watch", text: "text-watch" },
  clear: { dot: "bg-clear", text: "text-clear" },
  gap: { dot: "bg-subtle", text: "text-muted" },
};

function FindingCard({ finding }: { finding: Finding }) {
  const t = useT();
  const mark = MARK[finding.tone];
  return (
    <article className="border-b border-border pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-medium text-fg">{finding.title}</h3>
        <span className={cn("flex shrink-0 items-center gap-1.5 font-mono text-[10px] tracking-wide uppercase", mark.text)}>
          <span className={cn("size-1.5 rounded-full", mark.dot)} />
          {t.cross.mark[finding.tone]}
        </span>
      </div>

      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        {finding.claim.map((c, i) => (
          <span key={c.text}>
            {i > 0 ? " " : ""}
            {c.text}
            {c.cites ? <Cite ids={c.cites} /> : null}
          </span>
        ))}
      </p>

      <p className="mt-2 border-l-2 border-line pl-2.5 text-[12px] leading-relaxed text-subtle">
        {finding.action}
      </p>

      <div className="mt-2.5">
        <SourceRow ids={finding.cites} />
      </div>
    </article>
  );
}

export function CrossBoard({ scenarioId }: { scenarioId: ScenarioId }) {
  const t = useT();
  const findings = triangulate(scenarioId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.cross.title}</CardTitle>
        <CardDescription>
          {t.cross.desc(findings.length)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {findings.map((f) => (
          <FindingCard key={f.id} finding={f} />
        ))}
      </CardContent>
    </Card>
  );
}
