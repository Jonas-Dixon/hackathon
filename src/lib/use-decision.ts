import { useMemo, useState } from "react";
import { defaultDraft, judge, type OrderDraft } from "./order";
import { useOrders } from "./orders-store";
import { ORDER_TEMPLATE } from "./profile";

export type Step = "ask" | "answer" | "detail";

/** Håller ihop draft, domslut, steg — och skriver den lagda ordern till listan. */
export function useDecision() {
  const [draft, setDraft] = useState<OrderDraft>(() => defaultDraft());
  const [step, setStep] = useState<Step>("ask");
  const [placed, setPlaced] = useState(false);
  const verdict = useMemo(() => judge(draft), [draft]);
  const addOrder = useOrders((s) => s.add);

  return {
    draft,
    setDraft,
    step,
    setStep,
    placed,
    verdict,
    reset: () => {
      setPlaced(false);
      setDraft(defaultDraft());
      setStep("ask");
    },
    place: (date: string) => {
      const next = { ...draft, orderDate: date };
      const final = judge(next);
      setDraft(next);
      setPlaced(true);
      addOrder({
        amount: next.amount,
        materialDate: date,
        materialCost: final.materialCost,
        paymentDate: final.paymentDate,
        customer: ORDER_TEMPLATE.customer.value,
        verdict: final.verdict,
        trough: final.trough,
        followedAdvice: verdict.earliest ? date === verdict.earliest : true,
        attachment: null,
      });
    },
  };
}
