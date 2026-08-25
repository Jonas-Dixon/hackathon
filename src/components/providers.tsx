import { OpenPaymentsMark, ZwapgridMark } from "@/components/source-mark";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useT } from "@/lib/lang";
import type { FeedHealth } from "@/lib/sources";
import { cn } from "@/lib/utils";

/** De två källorna produkten står på. Ska synas, inte gömmas i en tooltip. */
export function ProviderBar({
  className,
  compact = false,
  health,
}: {
  className?: string;
  compact?: boolean;
  health?: FeedHealth;
}) {
  const t = useT();
  const items = [
    {
      id: "bank" as const,
      Mark: OpenPaymentsMark,
      name: "Open Payments",
      role: t.providers.bankRole,
      href: "https://www.openpayments.io/",
      box: "h-3.5 w-[5.7ch]",
      ok: health?.bank ?? false,
      tipOk: t.providers.bankOk,
      tipOff: t.providers.bankOff,
    },
    {
      id: "boks" as const,
      Mark: ZwapgridMark,
      name: "Zwapgrid",
      role: t.providers.booksRole,
      href: "https://www.zwapgrid.com/",
      box: "h-4 w-[2.6ch]",
      ok: health?.boks ?? false,
      tipOk: t.providers.booksOk,
      tipOff: t.providers.booksOff,
    },
  ];

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        {items.map(({ id, Mark, name, href, box, ok, tipOk, tipOff }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-fg transition-opacity hover:opacity-70"
                aria-label={name}
              >
                <span
                  className={cn("size-1.5 shrink-0 rounded-full", ok ? "bg-clear" : "bg-subtle")}
                />
                <Mark className={cn(box, "shrink-0")} />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium text-foreground">{name}</p>
              <p className="mt-0.5 text-muted-foreground">{ok ? tipOk : tipOff}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-3", className)}>
      <p className="font-mono text-[10px] tracking-[0.2em] text-subtle uppercase">{t.providers.builtOn}</p>
      {items.map(({ id, Mark, name, role, href, box, ok }) => (
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
              <span className={cn("size-1.5 rounded-full", ok ? "bg-clear" : "bg-subtle")} />
              <span className="font-mono text-[10px] text-subtle">{ok ? t.common.live : t.common.missing}</span>
            </span>
            <span className="block text-[11px] text-muted-foreground">{role}</span>
          </span>
        </a>
      ))}
    </div>
  );
}
