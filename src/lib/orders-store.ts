import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { VerdictId } from "./order";

export type OrderStatus = "planerad" | "lagd";

export type PlacedOrder = {
  id: string;
  ref: string;
  amount: number;
  /** Datum materialet betalas — det som avgör om ordern håller. */
  materialDate: string;
  materialCost: number;
  paymentDate: string;
  customer: string;
  /** Vad motorn sa när ordern lades. */
  verdict: VerdictId;
  trough: number;
  /** Sattes den på det datum motorn föreslog, eller trotsades rådet? */
  followedAdvice: boolean;
  createdAt: string;
  /** Bifogad orderbekräftelse — i demon bara ett filnamn. */
  attachment: string | null;
};

/** Två ordrar som redan ligger, så listan aldrig är tom vid demostart. */
const SEED: PlacedOrder[] = [
  {
    id: "seed-1",
    ref: "NB-2026-041",
    amount: 95_000,
    materialDate: "2026-11-24",
    materialCost: 18_000,
    paymentDate: "2026-12-09",
    customer: "Mälarenergi AB",
    verdict: "yes",
    trough: 214_800,
    followedAdvice: true,
    createdAt: "2026-11-18T09:12:00",
    attachment: "malarenergi-servicejobb.pdf",
  },
  {
    id: "seed-2",
    ref: "NB-2026-040",
    amount: 62_000,
    materialDate: "2026-11-14",
    materialCost: 11_500,
    paymentDate: "2026-12-01",
    customer: "Villa Åkerby",
    verdict: "tight",
    trough: 71_200,
    followedAdvice: false,
    createdAt: "2026-11-10T14:38:00",
    attachment: null,
  },
];

let counter = 42;

export function nextRef(): string {
  counter += 1;
  return `NB-2026-${String(counter).padStart(3, "0")}`;
}

type OrdersState = {
  orders: PlacedOrder[];
  /** Ordern som just lades — highlightas i listan. */
  lastId: string | null;
  add: (o: Omit<PlacedOrder, "id" | "ref" | "createdAt">) => string;
  attach: (id: string, filename: string) => void;
  remove: (id: string) => void;
  clearHighlight: () => void;
  resetDemo: () => void;
};

export const useOrders = create<OrdersState>()(
  persist(
    (set) => ({
      orders: SEED,
      lastId: null,
      add: (o) => {
        const id = `o-${counter + 1}-${o.materialDate}`;
        const order: PlacedOrder = {
          ...o,
          id,
          ref: nextRef(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ orders: [order, ...s.orders], lastId: id }));
        return id;
      },
      attach: (id, filename) =>
        set((s) => ({
          orders: s.orders.map((x) => (x.id === id ? { ...x, attachment: filename } : x)),
        })),
      remove: (id) => set((s) => ({ orders: s.orders.filter((x) => x.id !== id) })),
      clearHighlight: () => set({ lastId: null }),
      resetDemo: () => {
        counter = 42;
        set({ orders: SEED, lastId: null });
      },
    }),
    { name: "sikt.orders.v1" },
  ),
);
