import { Link } from "@tanstack/react-router";
import { CalendarClock, FileText, Landmark, Lock, PieChart, Receipt } from "lucide-react";
import type { ComponentType } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DATA_MODE, MODE_LABEL } from "@/lib/profile";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  to?: string;
  /** Ytor en färdig produkt har, men som den här demon inte löser. */
  locked?: boolean;
};

const ITEMS: NavItem[] = [
  { label: "Orderbeslut", icon: CalendarClock, to: "/" },
  { label: "Orderutrymme", icon: PieChart, to: "/utrymme" },
  { label: "Leverantörsfakturor", icon: Receipt, locked: true },
  { label: "Kundfakturor", icon: FileText, locked: true },
  { label: "Betalningar", icon: Landmark, locked: true },
];

export function DashboardNav({ current }: { current: string }) {
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
      <p className="mb-1 hidden px-1 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase lg:block">
        Arbetsyta
      </p>
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.to === current;

        if (item.locked) {
          return (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <span
                  aria-disabled="true"
                  className="flex shrink-0 cursor-not-allowed items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-subtle/70 select-none"
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">{item.label}</span>
                  <Lock className="size-3 shrink-0 lg:ml-auto" aria-hidden="true" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Ingår inte i demon. Vi löser en fråga: kan ordern läggas?
              </TooltipContent>
            </Tooltip>
          );
        }

        return (
          <Link
            key={item.label}
            to={item.to}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DataModeBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex cursor-help items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]",
            DATA_MODE === "live"
              ? "border-clear/40 text-clear"
              : "border-line-strong text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              DATA_MODE === "live" ? "bg-clear" : "bg-subtle",
            )}
          />
          {MODE_LABEL[DATA_MODE]}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[18rem]">
        Saldo och fakturor är modellerade på riktig svarsform. Anropen mot Open Payments och
        Zwapgrid går skarpt — men konto och fakturor är låsta tills BankID signerats.
      </TooltipContent>
    </Tooltip>
  );
}
