import { ArrowRight, Check } from "lucide-react";
import { fmtDay } from "@/lib/capacity";
import { useT } from "@/lib/lang";
import type { Lever } from "@/lib/solver";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatSek } from "@/lib/utils";

/**
 * "Nej" är inte ett svar man kan göra något med. Det här är raden efter:
 * den minsta ändringen som skulle vända det — och, lika viktigt, vilka
 * ändringar som inte räcker.
 */
export function LeverPanel({ levers }: { levers: Lever[] }) {
  const t = useT();
  if (levers.length === 0) return null;

  const works = levers.filter((l) => l.solves);
  const falls = levers.filter((l) => !l.solves);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.levers.title}</CardTitle>
        <CardDescription>
          {works.length === 0
            ? t.levers.none
            : works.length === 1
              ? t.levers.one
              : t.levers.some(works.length, levers.length)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {works.map((l) => (
          <LeverRow key={l.id} lever={l} />
        ))}

        {falls.length > 0 ? (
          <div className="space-y-3 border-t border-border pt-3">
            <p className="font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">
              {t.levers.notEnough}
            </p>
            {falls.map((l) => (
              <LeverRow key={l.id} lever={l} />
            ))}
          </div>
        ) : null}

        <p className="border-t border-border pt-3 text-[12px] leading-relaxed text-subtle">
          {t.levers.footnote}
        </p>
      </CardContent>
    </Card>
  );
}

function LeverRow({ lever }: { lever: Lever }) {
  const t = useT();
  return (
    <article className={cn("flex gap-2.5", !lever.solves && "opacity-70")}>
      <span
        className={cn(
          "mt-1 flex size-4 shrink-0 items-center justify-center rounded-full",
          lever.solves ? "bg-clear/15 text-clear" : "bg-secondary text-subtle",
        )}
        aria-hidden="true"
      >
        {lever.solves ? <Check className="size-2.5" /> : <ArrowRight className="size-2.5" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h3 className="text-[14px] font-medium text-fg">{lever.title}</h3>
          <span
            className={cn(
              "font-mono text-[11px] tabular",
              lever.trough < 0 ? "text-storm" : lever.solves ? "text-clear" : "text-watch",
            )}
          >
            {t.levers.trough} {formatSek(lever.trough, true)} · {fmtDay(lever.troughDate)}
          </span>
        </div>
        <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{lever.ask}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-subtle">{lever.effect}</p>
      </div>
    </article>
  );
}
