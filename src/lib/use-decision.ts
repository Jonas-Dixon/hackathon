import { useMemo, useState } from "react";
import { defaultDraft, judge, type OrderDraft } from "./order";

export type Step = "ask" | "answer" | "detail";

/** Håller ihop draft, domslut och vilket steg som visas. */
export function useDecision() {
  const [draft, setDraft] = useState<OrderDraft>(() => defaultDraft());
  const [step, setStep] = useState<Step>("ask");
  const [placed, setPlaced] = useState(false);
  const verdict = useMemo(() => judge(draft), [draft]);

  return {
    draft,
    setDraft,
    step,
    setStep,
    placed,
    verdict,
    reset: () => {
      setPlaced(false);
      setStep("ask");
    },
    place: (date: string) => {
      setDraft({ ...draft, orderDate: date });
      setPlaced(true);
    },
  };
}
