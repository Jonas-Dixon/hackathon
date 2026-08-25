import { useState } from "react";
import { useT } from "@/lib/lang";
import { BUILD, versionDetail, versionLabel } from "@/lib/version";

/**
 * Vilket bygge skärmen visar. Diskret i hörnet tills någon klickar — då fälls
 * gren, commit och byggtid ut, så två personer kan jämföra och se om de tittar
 * på samma kod.
 *
 * z-40 lägger den under onboarding-overlayen (z-50), så introt förblir rent.
 */
export function BuildBadge() {
  const [open, setOpen] = useState(false);
  const t = useT();

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      title={versionDetail()}
      aria-label={t.build.label(versionDetail())}
      className="fixed bottom-3 left-3 z-40 rounded-full border border-line-strong/60 bg-card/85 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-subtle uppercase opacity-60 backdrop-blur transition-all hover:border-fg/40 hover:text-fg hover:opacity-100"
    >
      {open ? versionDetail() : `build ${versionLabel()}`}
      {BUILD.dirty && !open ? <span className="sr-only"> ({t.build.uncommitted})</span> : null}
    </button>
  );
}
