import type { Pack } from "./sv";

/** Engelskan. Typad som `Pack`, så en glömd nyckel blir ett kompileringsfel. */
export const en: Pack = {
  meta: {
    htmlLang: "en",
    switchLabel: "SV",
    switchTip: "Switch to Swedish",
  },

  common: {
    sources: "Sources",
    calls: (n) => `${n} calls`,
    today: "today",
    live: "Live",
    missing: "Missing",
    exclVat: "excl. VAT",
    net: (days) => `Net ${days} days`,
  },

  nav: {
    newOrder: "New order decision",
    myOrders: "My orders",
    demo: "Demo",
    resetTip: "Reset the demo — clears your orders and starts from a blank page.",
  },

  providers: {
    builtOn: "Built on",
    bankRole: "Balance and transactions",
    bankOk: "Balance fetched from the bank.",
    bankOff: "No data from the bank.",
    booksRole: "Invoices and due dates",
    booksOk: "Invoices fetched from the books.",
    booksOff: "No data from the books.",
  },

  onboarding: {
    skip: "Skip",
    dialogLabel: "Introduction",
    slides: [
      {
        kicker: "01 — The problem",
        headline: "The balance lies.",
        body: "It knows nothing about payroll on the 25th. Or about the customer who always pays 23 days late. Yet that is the number you order material on.",
        cta: "And then?",
      },
      {
        kicker: "02 — Sikt",
        headline: "Yes. No.\nOr a date.",
        body: "The bank knows what you have. The books know what you owe. We let them talk — and answer the question you actually asked.",
        cta: "Show me",
      },
    ],
  },

  ask: {
    title: "Can you take the order?",
    lede: "The bank knows what you have. The books know what you owe. Two fields, and we add them up.",
    amount: "Order value",
    amountAria: "Order value in kronor",
    materialDate: "Material is paid",
    materialDateAria: "Date the material is paid",
    cta: "Give me the answer",
    prefillCustomer: "Customer",
    prefillMaterial: "Material",
    prefillTerms: "Net",
    prefillBuyer: "Buyer",
    prefilled: "Filled in for you.",
  },

  answer: {
    back: "Change the order",
    kicker: (amount, date) => `${amount} · material ${date}`,
    word: { yes: "Yes.", tight: "Barely.", no: "No." },
    materialOut: "Material out",
    lowest: "Lowest",
    customerPays: "Customer pays",
    placeInstead: (date) => `Place it ${date} instead.`,
    blocker: (label, amount, date) =>
      `${label} of ${amount} on ${date} is what takes the cash down there.`,
    baselineHole: (cash, date, blocker) =>
      `Order or no order: the account drops to ${cash} on ${date}${
        blocker ? `, when ${blocker} falls due` : ""
      }. No order date fixes that.`,
    baselineBlocker: (label, amount) => `${label} of ${amount}`,
    place: (date) => `Place the order ${date}`,
    showEvidence: "Show the evidence",
    placeAnyway: (date) => `Place it anyway ${date}`,
  },

  placed: {
    title: "The order is placed.",
    lede: (amount, customer, materialDate, payDate) =>
      `${amount} to ${customer}. Material is paid ${materialDate}, the money is expected ${payDate}.`,
    buyer: "Buyer",
    customer: "Customer",
    amount: "Order value",
    material: "Material",
    terms: "Terms",
    expectedPayment: "Expected payment",
    account: "Account",
    held: "The payment is not sent for real — it sits in held until someone signs with BankID.",
    toOrders: "Close and show my orders",
    evidence: "Evidence",
    again: "Try another",
  },

  brief: {
    title: "What the order is",
    customer: "Customer",
    material: "Material",
    margin: "Contribution margin",
    payment: "Payment in",
    materialSub: (pct, date) => `${pct} % · paid ${date}`,
    marginSub: (pct) => `${pct} % of the order value`,
    paymentSub: (days, date) => `net ${days} d, expected ${date}`,
    attach: "Attach order confirmation",
    attachTip: "In live mode, invoice lines and due dates are read out of the PDF.",
    demoNotice: "Demo — the file is not read",
  },

  levers: {
    title: "What would make it a yes?",
    none: "No single change is enough. This is how far each one gets.",
    one: "One thing is enough. The rest just make it less tight.",
    some: (works, total) => `${works} of ${total} are enough on their own.`,
    notEnough: "Not enough",
    footnote:
      "The numbers are the same projection as above, recomputed with one thing changed at a time. We suggest — you negotiate.",
    trough: "trough",

    deposit: "Deposit",
    terms: "Shorter terms",
    material: "Credit on the material",
    receivable: "Call a customer",
    payable: "Delay an invoice",

    depositAsk: (customer, pct, amount) =>
      `Ask ${customer} for a ${pct} deposit — ${amount} on ordering.`,
    depositEffect: (date) => `The money is there when the material is due ${date}.`,
    depositLabel: (customer) => `Deposit, ${customer}`,
    depositBasis: (pct) => `${pct} of the order value, paid on ordering`,

    termsAsk: (days, to, from) =>
      `Negotiate the payment ${days} days earlier — ${to} instead of ${from}.`,
    termsEffect: (date) => `The payment lands before the trough on ${date}.`,

    materialAsk: (days, date) =>
      `Ask the supplier for ${days} days of credit — pay the material ${date}.`,
    materialEffect: (date) => `The order stays on ${date}, only the payment moves.`,

    receivableAsk: (label, days, amount, date) =>
      `Pull ${label} forward by ${days} days — ${amount} on ${date}.`,
    receivableEffect: (due, trough) => `Falls due ${due}, that is after the trough on ${trough}.`,

    payableAsk: (days, label, amount) =>
      `Ask for ${days} days of grace on ${label} — ${amount}.`,
    payableEffect: "Moves one payment past the trough.",

    noLift: (date) => `Does not touch the trough. The hole is ${date}, before any new money lands.`,
    partialLift: (lift, gap) => `Lifts the trough by ${lift}, but ${gap} is still missing.`,
  },

  curve: {
    holds: "Holds",
    breaks: "Breaks",
    placedOn: (date) => `Placed ${date}`,
    youChose: "what you chose",
    theOrder: "the order",
    sameLater: "same order, later",
    lowestPrefix: "lowest ",
    aria: (label, amount) => `${label}: lowest cash ${amount}`,
  },

  detail: {
    back: "Back to the answer",
    title: "Evidence",
    lede: (amount, date) => `The forecast with the order included. Lowest ${amount} on ${date}.`,
    curve: "Cash, 12 weeks ahead",
    calendar: "Cash calendar",
    calendarSub: "The shape of the dot shows how certain the day's entry is.",
    liveCalls: "Live calls",
    liveCallsHint: "the answers the keys actually gave",
  },

  triangulation: {
    title: "Neither source could answer alone",
    count: (n) => `${n} findings from the crossing`,
    bankRole: "what you have",
    booksRole: "what you owe",
    pairs: [
      {
        bank: "4 payments to bankgiro 5051-9071",
        books: "New invoice points to 5822-1104",
        result: "The supplier has changed account. The payment is held.",
        tag: "Invoice fraud",
      },
      {
        bank: "140 000 kr in, sender field empty",
        books: "Unpaid invoice, Abetong AB, 140 000 kr",
        result: "The name is filled in. The gap is said out loud, not hidden.",
        tag: "Data fragmentation",
      },
      {
        bank: "3 incoming payments, actual dates",
        books: "The same 3 invoices, due dates",
        result: "The customer pays 23 days late. Every time.",
        tag: "Payment pattern",
      },
    ],
  },

  cross: {
    title: "Findings",
    desc: (n) => `The bank's transactions against the books' invoices. ${n} things to know.`,
    mark: { storm: "Hold", watch: "Adjusted", clear: "Resolved", gap: "Gap" },

    ibanTitle: "The supplier has changed account",
    ibanClaim1: (times, giro) =>
      `Atlas Copco has received ${times} payments from you, all to bankgiro ${giro}.`,
    ibanClaim2: (amount, giro) => `The new invoice of ${amount} points to ${giro}.`,
    ibanClaim3: "Same supplier, new account, no warning.",
    ibanAction: "The payment is held until someone has called Atlas and confirmed.",

    lateTitle: "Müller pays late every time",
    lateClaim1: (count, avg) =>
      `${count} earlier invoices were paid on average ${avg} days after the due date.`,
    lateClaim2: (total) => `The order is written on 60 days, so we count on ${total} instead.`,
    lateAction:
      "The forecast uses the later date. No assumption about German firms — three matched payments.",

    namelessTitle: "Nameless payment identified",
    namelessClaim1: (amount) => `${amount} comes in with no sender name — the bank leaves the field empty.`,
    namelessClaim2: (party, extra) => `The amount matches an unpaid invoice from ${party}${extra}.`,
    namelessMore: (n) => ` +${n} more`,
    namelessAction:
      "We fill the gap from the books and say that we did, instead of just showing an amount.",

    lagTitle: "The books lag four days",
    lagClaim1: "The bank answers in real time.",
    lagClaim2:
      "The books were last synced on 16 November, so payroll and fresh supplier invoices may be missing.",
    lagAction:
      "The answer gets worse, not blank: when the books go quiet we keep counting on the bank's numbers.",
  },

  capacity: {
    pageTitle: "Sikt — Order headroom",
    heading: "Order headroom",
    ifOneMore: "If you take one more order",
    holdsWholePeriod: "Holds the whole period",
    belowZero: "Below zero",
    thin: "Thin",
    method: "How we count",
    methodLine: (cushion, cash) =>
      `The headroom is everything above the ${cushion} k cushion. We project the balance day by day for 12 weeks — the bank's balance, the invoices' due dates adjusted for how the counterparty actually pays, and the order where its costs actually land. The ceiling is the first day cash dips below the cushion. Opening balance ${cash} kr.`,
    methodCertainty:
      "Every entry is marked by how certain it is. Fixed means an agreed amount and date. Predictable means an invoice with a due date, adjusted for how the counterparty usually pays. Assumption means we count on the money but there is no invoice yet.",
    methodAi:
      "The AI is a sidekick. It reads patterns and says what it sees. It does not make the decision.",

    headline: {
      manyLeft: (n) => `Yes — ${n} more jobs fit`,
      oneLeft: "Yes — one more job fits",
      noneLeft: "Yes, but nothing more",
      ceiling: (date) => `No — the headroom runs out ${date}`,
    },
    subOk: (trough, date) =>
      `Cash stays above the cushion the whole period. Lowest ${trough} on ${date}.`,
    subUnder: (date, amount) => `Cash goes below zero on ${date}, at the lowest −${amount}.`,
    subThin: (date) => `Cash dips below the cushion on ${date} and stays thin.`,

    headroom: (amount) => `${amount} headroom`,
    shortfall: (amount) => `${amount} missing`,
    cardTitle: "Headroom",
    ceilingAt: (date) => `Ceiling ${date}`,
    jobsLeft: (n) => `${n} more jobs`,
    leftAfterDay: "Headroom left after the day",
  },

  day: {
    certainty: { fast: "Fixed", forutsagbar: "Predictable", antagande: "Assumption" },
    certaintyTip: {
      fast: "Agreed entry. Date and amount are known in advance.",
      forutsagbar: "Invoice with a due date, adjusted for how the counterparty usually pays.",
      antagande: "No invoice yet. We count on it, but it may not come.",
    },
    certaintyEvent: (word) => `${word} event`,
    risk: {
      clear: "Covered",
      watch: "Thin margin",
      storm: "Below zero",
      gap: "Gap in the data",
    },
    empty: "Pick a day. Every entry shows how certain it is.",
    leftAfter: "left after",
    netto: "Net",
    nothingBooked: "Nothing booked on this day.",
    nothingBookedShort: "Nothing booked",
    belowZero: "Cash below zero",
    prevWeek: "Previous week",
    nextWeek: "Next week",
  },

  orders: {
    pageTitle: "Sikt — My orders",
    heading: "My orders",
    summary: (n, total) => `${n} orders · ${total} in order book`,
    newOrder: "New order",
    emptyTitle: "Blank page.",
    emptyBody: "No orders on the books. Try one and see if the cash holds before you say yes.",
    emptyCta: "Try an order",
    ref: "Reference",
    customer: "Customer",
    amount: "Order value",
    material: "Material",
    paid: "Paid",
    outcome: "Outcome",
    fresh: "new",
    attachment: (name) => `Attachment: ${name}`,
    badge: { yes: "Held", tight: "Thin", no: "Overridden" },
    againstAdvice: (trough) => `Placed against the advice — cash bottomed at ${trough}.`,
  },

  liveStrip: {
    title: "Live calls",
    lede: "The answers the keys actually gave. Empty field = locked step.",
    fetchedAt: (time) => `fetched ${time}`,
    noContact: "No contact",
    locked: "locked",
    consent: "consent",
    empty: "empty",
  },

  verdict: {
    yes: "Yes — place the order",
    tight: "Yes, but it gets thin",
    noEarliest: (date) => `No — but place it ${date}`,
    noNever: "No — it does not fit this year",
    reasonYes: (trough, date) =>
      `Cash bottoms at ${trough} on ${date}, above the cushion the whole way.`,
    reasonTight: (trough, date) =>
      `Cash drops to ${trough} on ${date}. One late customer and it breaks.`,
    reasonNo: (material, trough, date, pay) =>
      `The material of ${material} takes cash to ${trough} on ${date}. The customer does not pay until ${pay}.`,
  },

  flow: {
    orderMaterial: (customer) => `Material, ${customer}`,
    orderPayment: (customer) => `Payment, ${customer}`,
    orderMaterialBasis: (pct) => `${pct} % of the order value, paid before delivery`,
    orderPaymentBasis: (term, late) =>
      `Net ${term} days plus the ${late} days the history shows`,

    plannedMaterial: "Material, hypothetical order",
    plannedPayment: "Payment, hypothetical order",
    plannedDeposit: "Deposit, hypothetical order",
    plannedMaterialBasis: (pct) => `${pct} of the order value, as on earlier orders`,
    plannedDepositBasis: (pct) => `${pct} of the order value on ordering`,

    invoiceIn: (party) => `Payment, ${party}`,
    invoiceOut: (party) => `Invoice, ${party}`,
    invoiceInLate: (due, party, days) =>
      `Falls due ${due}, but ${party} pays on average ${days} days late`,
    invoiceInOnTime: (due) => `Falls due ${due}, normally paid on time`,
    invoiceOutBasis: (id, due) => `Supplier invoice ${id}, falls due ${due}`,
    recurringBasis: (day) => `Recurring entry, drawn on the ${day}th every month`,

    recurring: {
      payroll: "Payroll",
      tax: "Tax account, employer contributions",
      rent: "Machine park rent",
      utility: "Power and workshop",
      insurance: "Machine insurance",
    },
  },

  scenario: {
    german: "German order",
    service: "Service job",
    none: "No new order",
    germanBlurb: "Müller Tiefbau, 840 k. Material must be bought now. They pay in 60 days.",
    serviceBlurb: "Existing customer. 95 k. Little material, paid within 14 days.",
    noneBlurb: "Only what is already on the books. Payroll, material, incoming payments.",
  },

  feeds: {
    bank: {
      short: "Bank",
      role: "AIS + PIS · Danske ORGA",
      statusLabel: "Live",
      synced: "2 min ago",
      tip: "accountinformation + paymentinitiation + bankgiroinformation. Balance (interimAvailable), transactions, swedish-giro. Live right now.",
    },
    boks: {
      short: "Books",
      role: "Invoices, payroll, suppliers",
      statusLabel: "Lagging",
      synced: "4 days ago",
      tip: "The books, via Zwapgrid. Invoices and payroll. Last synced 4 days ago — hence 61%.",
    },
    order: {
      name: "The order",
      short: "Order",
      role: "Scenario, not live",
      statusLabel: "Scenario",
      synced: "entered now",
      tip: "The order you are testing. Not from the bank or the books.",
    },
  },

  mode: { demo: "Demo data", live: "Live data" },

  profile: {
    materialShareWire: "Median material share on earlier orders in the books",
    materialLeadWire: "Average time from order date to material invoice due date",
    paymentTermWire: "Terms on the customer's latest invoices",
    customerLateWire: "Average of dueDate against paidDate on three paid invoices",
  },

  citeStatus: { live: "Live", lag: "Lagging", locked: "Locked", model: "Model" },

  cite: {
    "op-balance": {
      field: "balances[0].balanceAmount · interimAvailable",
      value: "418 400 SEK",
      note: "The balance we count from. Available, not booked — payments on their way out are already deducted.",
    },
    "op-aspsp": {
      field: "aspsps.length",
      value: "111 banks",
      note: "The call went through live against the sandbox. That is the proof the key is alive.",
    },
    "op-tx-atlas": {
      field: "booked[] · creditorAccount.bankgiro",
      value: "4 payments → 5051-9071",
      note: "Four earlier payments to Atlas Copco, all to the same bankgiro.",
    },
    "op-tx-muller": {
      field: "booked[] · bookingDate",
      value: "3 incoming payments from Müller",
      note: "The dates the money actually landed. Matched against due dates in the books.",
    },
    "op-tx-nameless": {
      field: "booked[].creditorName",
      value: "null",
      note: "PSD2 does not require a filled-in name. The bank knows the amount but not who — the gap is filled from the books.",
    },
    "op-accounts-locked": {
      field: "consentStatus",
      value: "received — awaiting SCA",
      note: "Balance and transactions are locked until someone signs with BankID. The numbers in the demo are therefore modelled on the real response shape.",
    },
    "op-pis-held": {
      field: "transactionStatus",
      value: "held",
      note: "The payment is not sent until the account matches the payment history.",
    },
    "zg-consent": {
      field: "data[0].status · data[0].source",
      value: "CREATED · null",
      note: "The consent exists but the accounting system is not connected yet, so the invoice calls return 403.",
    },
    "zg-sinv-atlas": {
      field: "SINV-ATLAS-NEW · dueDate, amount, bankgiro",
      value: "2 dec · 520 000 SEK · 5822-1104",
      note: "The supplier invoice for the material. The bankgiro differs from the four earlier payments.",
    },
    "zg-cinv-muller": {
      field: "3 invoices · dueDate against paidDate",
      value: "23 days late on average",
      note: "Three paid Müller invoices. The difference between due date and paid date is measured, not guessed.",
    },
    "zg-cinv-abetong": {
      field: "CINV-ABETONG · party, amount",
      value: "Abetong AB · 140 000 SEK",
      note: "Gives the name to the nameless incoming payment in the bank.",
    },
    "zg-lag": {
      field: "data[0].createdOn",
      value: "last synced 16 nov",
      note: "The books lag four days. Payroll and fresh supplier invoices may be missing.",
    },
    "model-payroll": {
      call: "Model · recurring entries",
      field: "payroll on the 25th · 187 200 SEK",
      value: "3 months ahead",
      note: "Agreed entry with a known date and amount. Rolled forward until the books say otherwise.",
    },
    "model-order": {
      call: "Model · the order you are testing",
      field: "orderAmount, materialCost, payment date",
      value: "entered in the scenario",
      note: "Comes from neither the bank nor the books. It is the hypothesis we count on.",
    },
    noBank: "The bank did not answer. The number is stated, not fetched — so it counts as a gap.",
    balanceFrom: (account, date) =>
      `The balance we count from, taken from ${account} on ${date}.`,
    accountsField: "accounts.length · chosen account",
    accountsValue: (n, id) => `${n} accounts · ${id}`,
    accountsNote: (account) =>
      `The consent is enough to read accounts. We count on the company account ${account}.`,
  },

  build: {
    unknown: "unknown",
    unknownTime: "unknown time",
    uncommitted: "uncommitted",
    built: "built",
    label: (detail) => `Build version ${detail}`,
  },
};
