import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSek(n: number, compact = false) {
  const abs = Math.abs(n);
  if (compact && abs >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString("sv-SE", { maximumFractionDigits: 1 })} mnkr`;
  }
  if (compact && abs >= 10_000) {
    return `${Math.round(n / 1000).toLocaleString("sv-SE")} k`;
  }
  return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr";
}

export function iso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseIso(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
