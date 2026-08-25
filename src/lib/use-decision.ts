import { useMemo, useState } from "react";
import { useLang } from "./lang";
import { defaultDraft, judge, type OrderDraft } from "./order";
import { useOrders } from "./orders-store";
import { ORDER_TEMPLATE } from "./profile";

export type Step = "ask" | "answer" | "detail";

/** Håller ihop draft, domslut, steg — och skriver den lagda ordern till listan. */
export function useDecision() {
  const [draft, setDraft] = useState<OrderDraft>(() => defaultDraft());
  const [step, setStep] = useState<Step>("ask");
  const [placed, setPlaced] = useState(false);
  // Domen är text lika mycket som siffror — byter språket måste den räknas om.
  const lang = useLang();
  // Inte på frågesidan — earliestSafeDate skannar 120 projektioner och fryser klicket.
  const verdict = useMemo(() => {
    if (step === "ask" && !placed) return null;
    try {
      return judge(draft);
    } catch (err) {
      console.error("[sikt] judge failed", err);
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- judge() läser språket via strings()
  }, [draft, step, placed, lang]);
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
        followedAdvice: final.earliest ? date === final.earliest : true,
        attachment: null,
      });
    },
  };
}
