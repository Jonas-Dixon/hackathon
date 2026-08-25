import { SourceIcon } from "@/components/source-mark";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cites, statusWord, type CiteId, type CiteStatus } from "@/lib/citations";
import { useT } from "@/lib/lang";
import { cn } from "@/lib/utils";

const DOT: Record<CiteStatus, string> = {
  live: "bg-clear",
  lag: "bg-watch",
  locked: "bg-storm",
  model: "bg-subtle",
};

/** Numrerad referens efter ett påstående. Hovra för att se exakt vad det bygger på. */
export function Cite({ ids }: { ids: CiteId[] }) {
  useT(); // texten bakom siffran byter språk med resten
  const list = cites(ids);
  return (
    <span className="ml-1 inline-flex gap-0.5 align-baseline">
      {list.map((c) => (
        <Tooltip key={c.id}>
          <TooltipTrigger asChild>
            <sup className="inline-grid size-[15px] cursor-help place-items-center rounded-[3px] bg-secondary font-mono text-[9px] leading-none text-muted transition-colors hover:bg-fg hover:text-primary-foreground">
              {c.num}
            </sup>
          </TooltipTrigger>
          <TooltipContent className="max-w-[19rem]">
            <span className="flex items-center gap-1.5">
              <span className={cn("size-1.5 shrink-0 rounded-full", DOT[c.status])} />
              <SourceIcon id={c.source} className="size-3 shrink-0" />
              <span className="font-mono text-[10px] tracking-wide text-subtle uppercase">
                {statusWord(c.status)}
              </span>
            </span>
            <span className="mt-1.5 block font-mono text-[10px] break-words text-muted">{c.call}</span>
            <span className="mt-1 block font-mono text-[10px] text-subtle">{c.field}</span>
            <span className="mt-1 block font-medium text-foreground">{c.value}</span>
            <span className="mt-1.5 block text-muted-foreground">{c.note}</span>
          </TooltipContent>
        </Tooltip>
      ))}
    </span>
  );
}

/** Full referenslista. Varje rad är ett anrop någon kan gå och verifiera själv. */
export function SourceLedger({ ids }: { ids: CiteId[] }) {
  useT();
  const list = cites(ids);
  return (
    <ol className="divide-y divide-border">
      {list.map((c) => (
        <li key={c.id} className="grid grid-cols-[1.6rem_1fr] gap-x-3 py-3">
          <span className="mt-0.5 grid size-[19px] place-items-center rounded-[4px] bg-secondary font-mono text-[10px] text-muted">
            {c.num}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <SourceIcon id={c.source} className="size-3.5 shrink-0 text-fg" />
              <span className="font-mono text-[11px] break-all text-muted">{c.call}</span>
              <span className="flex items-center gap-1 font-mono text-[10px] tracking-wide text-subtle uppercase">
                <span className={cn("size-1.5 rounded-full", DOT[c.status])} />
                {statusWord(c.status)}
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-subtle">{c.field}</p>
            <p className="mt-1 text-[13px] font-medium text-fg">{c.value}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{c.note}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Källraden under ett svar — Perplexity-mönstret: påståendet först, källorna staplade under. */
export function SourceRow({ ids, label }: { ids: CiteId[]; label?: string }) {
  const t = useT();
  const list = cites(ids);
  const heading = label ?? t.common.sources;
  if (!list.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">{heading}</span>
      {list.map((c) => (
        <Tooltip key={c.id}>
          <TooltipTrigger asChild>
            <span className="inline-flex cursor-help items-center gap-1 rounded-full border border-border bg-background py-0.5 pr-2 pl-1.5 text-[11px] text-muted-foreground transition-colors hover:border-line-strong hover:text-fg">
              <span className={cn("size-1.5 rounded-full", DOT[c.status])} />
              <SourceIcon id={c.source} className="size-3" />
              <span className="font-mono text-[10px]">{c.num}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[19rem]">
            <span className="block font-mono text-[10px] break-words text-muted">{c.call}</span>
            <span className="mt-1 block font-medium text-foreground">{c.value}</span>
            <span className="mt-1 block text-muted-foreground">{c.note}</span>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
