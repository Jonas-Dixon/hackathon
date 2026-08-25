import type { CeilingRow } from "@/lib/solver";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatSek } from "@/lib/utils";

/**
 * Taket, innan någon har frågat. Poängen är inte den enskilda siffran utan
 * jämförelsen mellan raderna — den visar vad som faktiskt begränsar bolaget.
 */
export function OrderCeiling({ rows, insight }: { rows: CeilingRow[]; insight: string }) {
  const best = Math.max(...rows.map((r) => r.maxOrder), 1);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle>Största order ni kan ta idag</CardTitle>
          <CardDescription>Utan att kassan dyker under kudden på 12 veckor.</CardDescription>
        </div>
        <Badge variant="clear">Tak</Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div key={row.id}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[13px] text-muted">
                {row.label}
                <span className="ml-1.5 text-subtle">{row.detail}</span>
              </p>
              <p
                className={cn(
                  "whitespace-nowrap text-[20px] font-semibold tabular tracking-tight",
                  row.maxOrder === 0 ? "text-storm" : "text-fg",
                )}
              >
                {row.maxOrder === 0 ? "—" : formatSek(row.maxOrder, true)}
              </p>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn("h-full rounded-full", row.depositPct > 0 ? "bg-clear" : "bg-fg/40")}
                style={{ width: `${Math.round((row.maxOrder / best) * 100)}%` }}
              />
            </div>
          </div>
        ))}

        <p className="border-t border-border pt-3 text-[12px] leading-relaxed text-muted">
          {insight}
        </p>
      </CardContent>
    </Card>
  );
}
