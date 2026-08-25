import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLangStore, useT } from "@/lib/lang";
import { cn } from "@/lib/utils";

/** Knappen som byter språk. Visar språket den byter *till*, inte det du läser. */
export function LangToggle({ className }: { className?: string }) {
  const t = useT();
  const toggle = useLangStore((s) => s.toggle);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggle}
          aria-label={t.meta.switchTip}
          className={cn(
            "rounded-full border border-line-strong px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-subtle uppercase transition-colors hover:border-fg/40 hover:text-fg",
            className,
          )}
        >
          {t.meta.switchLabel}
        </button>
      </TooltipTrigger>
      <TooltipContent>{t.meta.switchTip}</TooltipContent>
    </Tooltip>
  );
}
