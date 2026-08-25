import { create } from "zustand";
import { persist } from "zustand/middleware";
import { en } from "./en";
import { sv, type Pack } from "./sv";

export type Lang = "sv" | "en";
export type { Pack };

const PACKS: Record<Lang, Pack> = { sv, en };

type LangState = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
};

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: "sv",
      setLang: (lang) => set({ lang }),
      toggle: () => set({ lang: get().lang === "sv" ? "en" : "sv" }),
    }),
    { name: "sikt.lang.v1" },
  ),
);

export function useLang(): Lang {
  return useLangStore((s) => s.lang);
}

/** Texterna, i en komponent. Byter språk och renderar om. */
export function useT(): Pack {
  return PACKS[useLangStore((s) => s.lang)];
}

/**
 * Texterna utanför React — motorn, lösaren, adaptern.
 *
 * De körs alltid under en render som redan läst `useLang()`, så språket är satt
 * innan de anropas. Samma idé som `setLedger` i engine.ts: ett bolag har ett
 * språk, och varje anropskedja slipper bära det vidare.
 */
export function strings(): Pack {
  return PACKS[useLangStore.getState().lang];
}
