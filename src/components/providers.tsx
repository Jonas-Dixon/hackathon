import { OpenPaymentsMark, ZwapgridMark } from "@/components/source-mark";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FEEDS } from "@/lib/sources";
import { cn } from "@/lib/utils";

const DOT: Record<string, string> = {
  live: "bg-clear",
  lag: "bg-watch",
  model: "bg-subtle",
};

/** De två källorna produkten står på. Ska synas, inte gömmas i en tooltip. */
export function ProviderBar({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const items = [
    {
      id: "bank" as const,
      Mark: OpenPaymentsMark,
      name: "Open Payments",
      role: "Saldo och transaktioner",
      href: "https://www.openpayments.io/",
      box: "h-3.5 w-[5.7ch]",
    },
    {
      id: "boks" as const,
      Mark: ZwapgridMark,
      name: "Zwapgrid",
      role: "Fakturor och förfallodatum",
      href: "https://www.zwapgrid.com/",
      box: "h-4 w-[2.6ch]",
    },
  ];

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        {items.map(({ id, Mark, name, href, box }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-fg transition-opacity hover:opacity-70"
                aria-label={name}
              >
                <span className={cn("relative", DOT[FEEDS[id].status])}>
                  <span
                    className={cn(
                      "absolute -top-0.5 -right-1 size-1.5 rounded-full",
                      DOT[FEEDS[id].status],
                    )}
                  />
                </span>
                <Mark className={cn(box, "shrink-0")} />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium text-foreground">{name}</p>
              <p className="mt-0.5 text-muted-foreground">{FEEDS[id].tip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-3", className)}>
      <p className="font-mono text-[10px] tracking-[0.2em] text-subtle uppercase">Byggd på</p>
      {items.map(({ id, Mark, name, role, href, box }) => {
        const feed = FEEDS[id];
        return (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-2.5"
          >
            <Mark className={cn(box, "shrink-0 text-fg transition-opacity group-hover:opacity-70")} />
            <span className="leading-tight">
              <span className="flex items-center gap-1.5">
                <span className="text-[13px] font-medium text-fg">{name}</span>
                <span className={cn("size-1.5 rounded-full", DOT[feed.status])} />
                <span className="font-mono text-[10px] text-subtle">{feed.statusLabel}</span>
              </span>
              <span className="block text-[11px] text-muted-foreground">{role}</span>
            </span>
          </a>
        );
      })}
    </div>
  );
}
