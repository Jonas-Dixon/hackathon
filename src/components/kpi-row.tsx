import CountUp from "@/components/bits/CountUp";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SourceChip } from "@/components/source-mark";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DayPoint, Verdict } from "@/lib/engine";
import { COMPANY } from "@/lib/engine";
import type { SourceId } from "@/lib/sources";
import { formatSek } from "@/lib/utils";

function Spark({ values, tone }: { values: number[]; tone: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 88;
  const h = 28;
  const d = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-[88px]" aria-hidden="true">
      <path d={d} fill="none" stroke={tone} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function KpiRow({
  days,
  verdict,
  orderAmount,
}: {
  days: DayPoint[];
  verdict: Verdict;
  orderAmount: number;
}) {
  const series = days.slice(0, 28).map((d) => d.endCash);
  const troughTone = verdict.trough < 0 ? "#b42318" : verdict.trough < 80000 ? "#9a6700" : "#1a7a4c";
  const troughDelta = Math.round(((verdict.trough - COMPANY.cash) / COMPANY.cash) * 100);

  const items = [
    {
      label: "Kassa nu",
      count: COMPANY.cash,
      suffix: " k",
      scale: 1000,
      hint: "Saldo från banken",
      spark: series,
      tone: "#161615",
      change: null as number | null,
      sources: ["bank"] as SourceId[],
    },
    {
      label: "Lägsta 6 v",
      count: verdict.trough,
      suffix: " k",
      scale: 1000,
      hint: verdict.troughDate,
      spark: series,
      tone: troughTone,
      change: troughDelta,
      sources: ["bank", "boks"] as SourceId[],
    },
    {
      label: "Ordern",
      count: orderAmount,
      suffix: " k",
      scale: 1000,
      hint: orderAmount ? "exkl. moms" : "ingen ny",
      spark: series,
      tone: "#161615",
      change: null,
      sources: ["order"] as SourceId[],
    },
    {
      label: "Datatäckning",
      count: Math.round(COMPANY.completeness * 100),
      suffix: "%",
      scale: 1,
      hint: "Bank live · böcker släpar",
      spark: [50, 55, 58, 62, 66, 71],
      tone: "#1a7a4c",
      change: null,
      sources: ["bank", "boks"] as SourceId[],
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="gap-2 py-3">
          <CardHeader className="flex flex-row items-start justify-between px-4 pb-0">
            <p className="text-[13px] font-medium text-muted-foreground">{item.label}</p>
            <Spark values={item.spark} tone={item.tone} />
          </CardHeader>
          <CardContent className="px-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="cursor-help whitespace-nowrap text-[24px] font-semibold leading-none tracking-tight tabular md:text-[28px]">
                  {item.label === "Ordern" && !item.count ? (
                    "—"
                  ) : (
                    <>
                      <CountUp
                        key={`${item.label}-${item.count}`}
                        to={Math.round(item.count / item.scale)}
                        duration={0.7}
                        className="tabular"
                      />
                      {item.suffix}
                    </>
                  )}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                Källa: {item.sources.map((s) => (s === "bank" ? "Open Payments" : s === "boks" ? "Zwapgrid" : "Ordern")).join(" + ")}
                {item.count ? ` · ${formatSek(item.count)}` : ""}
              </TooltipContent>
            </Tooltip>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[13px]">
              {item.sources.map((s) => (
                <SourceChip key={s} id={s} />
              ))}
              {item.change == null ? (
                <span className="text-muted-foreground">{item.hint}</span>
              ) : (
                <>
                  {item.change >= 0 ? (
                    <TrendingUp className="size-3.5 text-clear" />
                  ) : (
                    <TrendingDown className="size-3.5 text-storm" />
                  )}
                  <span className={item.change >= 0 ? "text-clear" : "text-storm"}>
                    {item.change > 0 ? "+" : ""}
                    {item.change}%
                  </span>
                  <span className="text-muted-foreground">{item.hint}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
