import { Link } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { ProviderBar } from "@/components/providers";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { currentCash } from "@/lib/engine";
import { useOrders } from "@/lib/orders-store";
import { COMPANY_PROFILE } from "@/lib/profile";
import { cn, formatSek } from "@/lib/utils";

const LINKS = [
  { to: "/", label: "Nytt orderbeslut" },
  { to: "/ordrar", label: "Mina ordrar" },
];

export function TopNav({ current, onReset }: { current: string; onReset?: () => void }) {
  const resetDemo = useOrders((s) => s.resetDemo);
  const count = useOrders((s) => s.orders.length);
  const [spinning, setSpinning] = useState(false);

  function reset() {
    setSpinning(true);
    resetDemo();
    onReset?.();
    window.setTimeout(() => setSpinning(false), 600);
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3 md:px-8">
        <div className="flex items-baseline gap-3">
          <p className="font-mono text-[11px] tracking-[0.28em] text-subtle uppercase">Sikt</p>
          <p className="text-[13px] font-medium text-fg">{COMPANY_PROFILE.name.value}</p>
        </div>

        <nav className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = l.to === current;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                  active
                    ? "bg-secondary font-medium text-fg"
                    : "text-muted-foreground hover:text-fg",
                )}
              >
                {l.label}
                {l.to === "/ordrar" ? (
                  <span className="ml-1.5 font-mono text-[11px] text-subtle">{count}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <ProviderBar compact />
          {/* Samma saldo som projektionen räknar på — en siffra får inte säga
              en sak i topbaren och en annan i svaret. */}
          <span className="hidden font-mono text-[13px] tabular text-muted-foreground sm:inline">
            {formatSek(currentCash(), true)}
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1.5 rounded-full border border-dashed border-line-strong px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-subtle uppercase transition-colors hover:border-fg/40 hover:text-fg"
              >
                <RotateCcw
                  className={cn("size-3", spinning && "animate-[spin_600ms_linear_1]")}
                  aria-hidden="true"
                />
                Demo
              </button>
            </TooltipTrigger>
            <TooltipContent>
              Nollställ demon — tömmer dina ordrar och börjar om på blankt papper.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
