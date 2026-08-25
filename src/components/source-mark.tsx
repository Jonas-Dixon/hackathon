import ShinyText from "@/components/bits/ShinyText";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FEEDS, type SourceId } from "@/lib/sources";
import { cn } from "@/lib/utils";

function OpenPaymentsMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 21 20" className={className} aria-hidden="true">
      <path
        d="M4.68 8.37a3.68 3.68 0 1 0 0-7.37 3.68 3.68 0 0 0 0 7.37Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M16.16 19a3.68 3.68 0 1 0 0-7.37 3.68 3.68 0 0 0 0 7.37Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M19.21 1.63h-6.1v6.11h6.1V1.63Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M8.37 15.32 2.37 11.74v7.16l6-3.58Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ZwapgridMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 28" className={className} aria-hidden="true">
      <path d="M10.46 8.45H0v5.42h10.46V8.45Z" fill="currentColor" />
      <path d="M12.53 17.93 17.46 13.03H10.45L0 23.43h7.01l5.52-5.5Z" fill="currentColor" />
      <path d="M17.46 22.68H7.01v5.42h10.45v-5.42Z" fill="currentColor" />
    </svg>
  );
}

export function SourceIcon({ id, className }: { id: SourceId; className?: string }) {
  if (id === "bank") return <OpenPaymentsMark className={className} />;
  if (id === "boks") return <ZwapgridMark className={className} />;
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <rect x="2" y="3" width="12" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

const DOT: Record<string, string> = {
  live: "bg-clear",
  lag: "bg-watch",
  model: "bg-subtle",
};

export function SourceChip({
  id,
  showName = true,
}: {
  id: SourceId;
  showName?: boolean;
}) {
  const feed = FEEDS[id];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help items-center gap-1 rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", DOT[feed.status])} />
          <SourceIcon id={id} className="size-3.5" />
          {showName ? <span>{feed.short}</span> : null}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium text-foreground">{feed.name}</p>
        <p className="mt-0.5 text-muted-foreground">{feed.tip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function DataFeedsCompact() {
  return (
    <div className="flex items-center gap-1.5">
      <SourceChip id="bank" />
      <SourceChip id="boks" />
    </div>
  );
}

export function DataFeeds() {
  return (
    <div className="space-y-2 px-3 pb-5">
      <p className="px-1 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">Källor</p>
      {(["bank", "boks"] as const).map((id) => {
        const f = FEEDS[id];
        return (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <a
                href={f.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-left hover:bg-secondary"
              >
                <SourceIcon id={id} className="size-4 shrink-0 text-fg" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-fg">{f.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{f.role}</span>
                </span>
                <span className="text-right">
                  <span className="flex items-center justify-end gap-1 text-[11px] font-medium">
                    <span className={cn("size-1.5 rounded-full", DOT[f.status])} />
                    {f.status === "live" ? (
                      <ShinyText
                        text={f.statusLabel}
                        speed={2.4}
                        color="#1a7a4c"
                        shineColor="#f3f2ee"
                        className="text-[11px] font-medium"
                      />
                    ) : (
                      f.statusLabel
                    )}
                  </span>
                  <span className="block font-mono text-[10px] tabular text-subtle">
                    {Math.round(f.coverage * 100)}%
                  </span>
                </span>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{f.name}</p>
              <p className="mt-0.5 text-muted-foreground">{f.tip}</p>
              <p className="mt-1 font-mono text-[10px] text-subtle">Synkad {f.synced}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
