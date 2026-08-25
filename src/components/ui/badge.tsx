import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Variant = "default" | "secondary" | "outline" | "clear" | "watch" | "storm";

const styles: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  outline: "border border-border text-muted-foreground",
  clear: "bg-clear/15 text-clear",
  watch: "bg-watch/15 text-watch",
  storm: "bg-storm/15 text-storm",
};

export function Badge({
  className,
  variant = "outline",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
