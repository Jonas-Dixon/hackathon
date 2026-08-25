import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "sikt.onboarded.v1";

type Slide = {
  kicker: string;
  headline: string;
  body: string;
  cta: string;
};

const SLIDES: Slide[] = [
  {
    kicker: "01 — Problemet",
    headline: "Saldot ljuger.",
    body: "Det vet inget om lönen på 25:e. Eller om kunden som alltid betalar 23 dagar sent. Ändå är det den siffran ni beställer material på.",
    cta: "Och sen?",
  },
  {
    kicker: "02 — Sikt",
    headline: "Ja. Nej.\nEller ett datum.",
    body: "Banken vet vad ni har. Böckerna vet vad ni är skyldiga. Vi låter dem prata — och svarar på frågan ni faktiskt ställde.",
    cta: "Visa mig",
  },
];

export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight" || e.key === "Enter") advance();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function finish() {
    setLeaving(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Privat läge — då får den komma tillbaka nästa gång.
    }
    window.setTimeout(() => setOpen(false), 320);
  }

  function advance() {
    if (step < SLIDES.length - 1) setStep((s) => s + 1);
    else finish();
  }

  if (!open) return null;
  const slide = SLIDES[step];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Introduktion"
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-bg transition-opacity duration-300",
        leaving ? "opacity-0" : "opacity-100",
      )}
    >
      <div className="flex items-center justify-between px-6 py-6 md:px-12">
        <p className="font-mono text-[11px] tracking-[0.28em] text-subtle uppercase">Sikt</p>
        <button
          type="button"
          onClick={finish}
          className="font-mono text-[11px] tracking-[0.16em] text-subtle uppercase transition-colors hover:text-fg"
        >
          Hoppa över
        </button>
      </div>

      <div className="flex flex-1 items-center px-6 md:px-12">
        <div key={step} className="onboard-in max-w-3xl">
          <p className="font-mono text-[11px] tracking-[0.28em] text-subtle uppercase">
            {slide.kicker}
          </p>
          <h1 className="mt-5 font-display text-[clamp(2.75rem,9vw,6.5rem)] leading-[0.94] font-semibold tracking-[-0.02em] whitespace-pre-line text-fg">
            {slide.headline}
          </h1>
          <p className="mt-7 max-w-lg text-[clamp(1rem,2.2vw,1.25rem)] leading-relaxed text-muted">
            {slide.body}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-6 px-6 pb-10 md:px-12 md:pb-14">
        <div className="flex gap-2" aria-hidden="true">
          {SLIDES.map((s, i) => (
            <span
              key={s.kicker}
              className={cn(
                "h-0.5 w-8 rounded-full transition-colors duration-300",
                i <= step ? "bg-fg" : "bg-line-strong",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={advance}
          className="rounded-md bg-primary px-6 py-3.5 font-mono text-[12px] tracking-[0.16em] text-primary-foreground uppercase transition-transform duration-150 hover:translate-y-px active:translate-y-0"
        >
          {slide.cta}
        </button>
      </div>
    </div>
  );
}
