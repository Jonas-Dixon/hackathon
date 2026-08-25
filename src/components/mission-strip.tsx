import BlurText from "@/components/bits/BlurText";
import TrueFocus from "@/components/bits/TrueFocus";

export function MissionStrip() {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card px-4 py-4 md:px-5">
      <p className="font-mono text-[11px] tracking-[0.22em] text-subtle uppercase">Uppdraget</p>
      <h2 className="mt-3 text-[1.5rem] font-semibold tracking-tight sm:hidden">Kan du ta ordern?</h2>
      <div className="mt-3 hidden sm:block">
      <TrueFocus
        sentence="Kan du ta ordern?"
        blurAmount={2.5}
        borderColor="#161615"
        glowColor="rgba(22,22,21,0.18)"
        animationDuration={0.45}
        pauseBetweenAnimations={1.15}
        className="justify-start gap-2.5 md:gap-3"
        wordClassName="relative cursor-pointer text-[1.65rem] font-semibold tracking-tight md:text-[2rem]"
      />
      </div>
      <BlurText
        text="Vi löser ja eller nej när kassan är knacklig — och fångar när leverantörens konto bytts. Banken live. Böckerna släpar. Stämpeln styr."
        delay={70}
        animateBy="words"
        direction="top"
        stepDuration={0.22}
        className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground"
      />
    </section>
  );
}
