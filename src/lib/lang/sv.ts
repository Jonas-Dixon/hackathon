/**
 * Språkpaketet, med svenskan som original.
 *
 * Allt som är text åt en människa bor här. Siffror och datum gör det inte:
 * `formatSek` och `fmtDay` formaterar likadant på båda språken, för ett belopp
 * i kronor och ett svenskt förfallodatum är samma sak oavsett vem som läser.
 *
 * Funktionerna tar färdigformaterade strängar, aldrig råa tal. Det håller
 * paketet fritt från importer — annars hade `capacity.ts` och paketet
 * importerat varandra.
 *
 * `en.ts` är typad som `Pack`, så en glömd nyckel är ett kompileringsfel och
 * inte en svensk mening mitt i den engelska sidan.
 */
export const sv = {
  meta: {
    htmlLang: "sv",
    /** Språket knappen byter till — det är det man vill läsa, inte det man ser. */
    switchLabel: "EN",
    switchTip: "Byt till engelska",
  },

  common: {
    sources: "Källor",
    calls: (n: number) => `${n} anrop`,
    today: "idag",
    live: "Live",
    missing: "Saknas",
    exclVat: "excl. moms",
    net: (days: number) => `Netto ${days} dagar`,
  },

  nav: {
    newOrder: "Nytt orderbeslut",
    myOrders: "Mina ordrar",
    demo: "Demo",
    resetTip: "Nollställ demon — tömmer dina ordrar och börjar om på blankt papper.",
  },

  providers: {
    builtOn: "Byggd på",
    bankRole: "Saldo och transaktioner",
    bankOk: "Saldo hämtat från banken.",
    bankOff: "Ingen data från banken.",
    booksRole: "Fakturor och förfallodatum",
    booksOk: "Fakturor hämtade från bokföringen.",
    booksOff: "Ingen data från bokföringen.",
  },

  onboarding: {
    skip: "Hoppa över",
    dialogLabel: "Introduktion",
    slides: [
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
    ],
  },

  ask: {
    title: "Kan ni ta ordern?",
    lede: "Banken vet vad ni har. Böckerna vet vad ni är skyldiga. Två fält, så räknar vi ihop dem.",
    amount: "Ordervärde",
    amountAria: "Ordervärde i kronor",
    materialDate: "Materialet betalas",
    materialDateAria: "Datum då materialet betalas",
    cta: "Ge mig svaret",
    prefillCustomer: "Kund",
    prefillMaterial: "Material",
    prefillTerms: "Netto",
    prefillBuyer: "Beställare",
    prefilled: "Ifyllt åt er.",
  },

  answer: {
    back: "Ändra ordern",
    kicker: (amount: string, date: string) => `${amount} · material ${date}`,
    word: { yes: "Ja.", tight: "Knappt.", no: "Nej." },
    materialOut: "Material ut",
    lowest: "Lägst",
    customerPays: "Kunden betalar",
    placeInstead: (date: string) => `Lägg den ${date} i stället.`,
    blocker: (label: string, amount: string, date: string) =>
      `${label} på ${amount} den ${date} är det som tar kassan dit.`,
    baselineHole: (cash: string, date: string, blocker: string | null) =>
      `Oavsett ordern: kontot går till ${cash} den ${date}${
        blocker ? `, när ${blocker} förfaller` : ""
      }. Inget orderdatum lagar det.`,
    baselineBlocker: (label: string, amount: string) => `${label} på ${amount}`,
    place: (date: string) => `Lägg ordern ${date}`,
    showEvidence: "Visa beslutsunderlag",
    placeAnyway: (date: string) => `Lägg ändå ${date}`,
  },

  placed: {
    title: "Ordern är lagd.",
    lede: (amount: string, customer: string, materialDate: string, payDate: string) =>
      `${amount} till ${customer}. Materialet betalas ${materialDate}, pengarna väntas ${payDate}.`,
    buyer: "Beställare",
    customer: "Kund",
    amount: "Ordervärde",
    material: "Material",
    terms: "Villkor",
    expectedPayment: "Väntad betalning",
    account: "Konto",
    held: "Betalningen skickas inte skarpt — den ligger i läge held tills någon signerat med BankID.",
    toOrders: "Stäng och visa mina ordrar",
    evidence: "Beslutsunderlag",
    again: "Pröva en till",
  },

  brief: {
    title: "Vad ordern är",
    customer: "Kund",
    material: "Material",
    margin: "Täckningsbidrag",
    payment: "Betalning in",
    materialSub: (pct: number, date: string) => `${pct} % · betalas ${date}`,
    marginSub: (pct: number) => `${pct} % av ordervärdet`,
    paymentSub: (days: number, date: string) => `netto ${days} d, väntas ${date}`,
    attach: "Bifoga orderbekräftelse",
    attachTip: "I skarpt läge läses fakturarader och förfallodatum ur PDF:en.",
    demoNotice: "Demo — filen läses inte",
  },

  levers: {
    title: "Vad skulle göra det till ett ja?",
    none: "Ingen enskild ändring räcker. Så här långt kommer var och en.",
    one: "En sak räcker. Resten gör det bara mindre tight.",
    some: (works: number, total: number) => `${works} av ${total} räcker var för sig.`,
    notEnough: "Räcker inte",
    footnote:
      "Siffrorna är samma projektion som ovan, omräknad med en sak ändrad i taget. Vi föreslår — ni förhandlar.",
    trough: "botten",

    deposit: "Förskott",
    terms: "Kortare villkor",
    material: "Kredit på materialet",
    receivable: "Ring en kund",
    payable: "Skjut en faktura",

    depositAsk: (customer: string, pct: string, amount: string) =>
      `Be ${customer} om ${pct} förskott — ${amount} vid beställning.`,
    depositEffect: (date: string) => `Pengarna finns när materialet ska betalas ${date}.`,
    depositLabel: (customer: string) => `Förskott, ${customer}`,
    depositBasis: (pct: string) => `${pct} av ordervärdet, betalas vid beställning`,

    termsAsk: (days: number, to: string, from: string) =>
      `Förhandla ner betalningen ${days} dagar — ${to} i stället för ${from}.`,
    termsEffect: (date: string) => `Betalningen hinner in före botten den ${date}.`,

    materialAsk: (days: number, date: string) =>
      `Be leverantören om ${days} dagars kredit — betala materialet ${date}.`,
    materialEffect: (date: string) => `Ordern ligger kvar ${date}, bara utbetalningen flyttas.`,

    receivableAsk: (label: string, days: number, amount: string, date: string) =>
      `Tidigarelägg ${label} med ${days} dagar — ${amount} den ${date}.`,
    receivableEffect: (due: string, trough: string) =>
      `Förfaller ${due}, alltså efter botten den ${trough}.`,

    payableAsk: (days: number, label: string, amount: string) =>
      `Be om ${days} dagars anstånd på ${label} — ${amount}.`,
    payableEffect: "Flyttar en utbetalning förbi botten.",

    noLift: (date: string) =>
      `Rör inte botten. Hålet ligger ${date}, innan några nya pengar hinner in.`,
    partialLift: (lift: string, gap: string) =>
      `Lyfter botten ${lift}, men ${gap} fattas fortfarande.`,
  },

  curve: {
    holds: "Håller",
    breaks: "Brister",
    placedOn: (date: string) => `Lagd ${date}`,
    youChose: "det ni valde",
    theOrder: "ordern",
    sameLater: "samma order, senare",
    lowestPrefix: "lägst ",
    aria: (label: string, amount: string) => `${label}: lägsta kassa ${amount}`,
  },

  detail: {
    back: "Tillbaka till svaret",
    title: "Beslutsunderlag",
    lede: (amount: string, date: string) =>
      `Prognosen med ordern inräknad. Lägst ${amount} den ${date}.`,
    curve: "Kassan, 12 veckor framåt",
    calendar: "Kassakalender",
    calendarSub: "Prickens form visar hur säker dagens post är.",
    liveCalls: "Live anrop",
    liveCallsHint: "svaren nycklarna faktiskt gav",
  },

  triangulation: {
    title: "Ingen av källorna kunde svara ensam",
    count: (n: number) => `${n} fynd ur korsningen`,
    bankRole: "vad ni har",
    booksRole: "vad ni är skyldiga",
    pairs: [
      {
        bank: "4 betalningar till bankgiro 5051-9071",
        books: "Ny faktura pekar på 5822-1104",
        result: "Leverantören har bytt konto. Betalningen hålls.",
        tag: "Fakturabedrägeri",
      },
      {
        bank: "140 000 kr in, avsändarfält tomt",
        books: "Obetald faktura, Abetong AB, 140 000 kr",
        result: "Namnet fylls i. Luckan sägs högt, inte tyst.",
        tag: "Datafragmentering",
      },
      {
        bank: "3 inbetalningar, faktiska datum",
        books: "Samma 3 fakturor, förfallodatum",
        result: "Kunden betalar 23 dagar sent. Varje gång.",
        tag: "Betalmönster",
      },
    ],
  },

  cross: {
    title: "Fynd",
    desc: (n: number) => `Bankens transaktioner mot bokföringens fakturor. ${n} saker att veta.`,
    mark: { storm: "Stoppa", watch: "Justerat", clear: "Löst", gap: "Lucka" },

    ibanTitle: "Leverantören har bytt konto",
    ibanClaim1: (times: number, giro: string) =>
      `Atlas Copco har fått ${times} betalningar från er, alla till bankgiro ${giro}.`,
    ibanClaim2: (amount: string, giro: string) =>
      `Den nya fakturan på ${amount} pekar på ${giro}.`,
    ibanClaim3: "Samma leverantör, nytt konto, ingen förvarning.",
    ibanAction: "Betalningen hålls tillbaka tills någon ringt Atlas och bekräftat.",

    lateTitle: "Müller betalar sent varje gång",
    lateClaim1: (count: number, avg: number) =>
      `${count} tidigare fakturor är betalda i snitt ${avg} dagar efter förfallodatum.`,
    lateClaim2: (total: number) =>
      `Ordern är skriven på 60 dagar, så vi räknar med ${total} i stället.`,
    lateAction:
      "Prognosen använder det senare datumet. Inget antagande om tyska bolag — tre matchade betalningar.",

    namelessTitle: "Namnlös inbetalning identifierad",
    namelessClaim1: (amount: string) =>
      `${amount} kommer in utan avsändarnamn — banken lämnar fältet tomt.`,
    namelessClaim2: (party: string, extra: string) =>
      `Beloppet matchar en obetald faktura från ${party}${extra}.`,
    namelessMore: (n: number) => ` +${n} till`,
    namelessAction:
      "Vi fyller luckan från böckerna och säger att vi gjort det, i stället för att bara visa ett belopp.",

    lagTitle: "Böckerna släpar fyra dagar",
    lagClaim1: "Banken svarar i realtid.",
    lagClaim2:
      "Bokföringen synkades senast 16 november, så lön och färska leverantörsfakturor kan saknas.",
    lagAction:
      "Svaret blir sämre, inte blankt: när böckerna tystnar räknar vi vidare på bankens siffror.",
  },

  capacity: {
    pageTitle: "Sikt — Orderutrymme",
    heading: "Orderutrymme",
    ifOneMore: "Om ni tar en order till",
    holdsWholePeriod: "Håller hela perioden",
    belowZero: "Under noll",
    thin: "Tunt",
    method: "Så räknar vi",
    methodLine: (cushion: string, cash: string) =>
      `Utrymmet är allt över kudden på ${cushion} k. Vi projicerar saldot dag för dag i 12 veckor — bankens saldo, fakturornas förfallodatum justerade efter hur motparten brukar betala, och ordern där dess utgifter faktiskt landar. Taket är första dagen kassan dyker under kudden. Startsaldo ${cash} kr.`,
    methodCertainty:
      "Varje post är märkt efter hur säker den är. Fast betyder avtalat belopp och datum. Förutsägbar betyder faktura med förfallodatum, justerad efter hur motparten brukar betala. Antagande betyder att vi räknar med pengarna men att det inte finns någon faktura ännu.",
    methodAi:
      "AI:n är sidekick. Den läser mönster och säger vad den ser. Den fattar inte beslutet.",

    headline: {
      manyLeft: (n: number) => `Ja — ${n} jobb till får plats`,
      oneLeft: "Ja — ett jobb till får plats",
      noneLeft: "Ja, men inget mer",
      ceiling: (date: string) => `Nej — utrymmet tar slut ${date}`,
    },
    subOk: (trough: string, date: string) =>
      `Kassan håller sig över kudden hela perioden. Lägst ${trough} den ${date}.`,
    subUnder: (date: string, amount: string) =>
      `Kassan går under noll den ${date}, som lägst −${amount}.`,
    subThin: (date: string) => `Kassan dyker under kudden den ${date} och stannar tunn.`,

    headroom: (amount: string) => `${amount} utrymme`,
    shortfall: (amount: string) => `${amount} saknas`,
    cardTitle: "Utrymme",
    ceilingAt: (date: string) => `Taket ${date}`,
    jobsLeft: (n: number) => `${n} jobb till`,
    leftAfterDay: "Utrymme kvar efter dagen",
  },

  day: {
    certainty: { fast: "Fast", forutsagbar: "Förutsägbar", antagande: "Antagande" },
    certaintyTip: {
      fast: "Avtalad post. Datum och belopp är kända i förväg.",
      forutsagbar:
        "Faktura med förfallodatum, justerad efter hur motparten brukar betala.",
      antagande: "Ingen faktura ännu. Vi räknar med den, men den kan utebli.",
    },
    certaintyEvent: (word: string) => `${word} händelse`,
    risk: {
      clear: "Täckt",
      watch: "Tunn marginal",
      storm: "Under noll",
      gap: "Lucka i data",
    },
    empty: "Välj en dag. Varje post visar hur säker den är.",
    leftAfter: "kvar efteråt",
    netto: "Netto",
    nothingBooked: "Inget bokat den här dagen.",
    nothingBookedShort: "Inget bokat",
    belowZero: "Kassan under noll",
    prevWeek: "Föregående vecka",
    nextWeek: "Nästa vecka",
  },

  orders: {
    pageTitle: "Sikt — Mina ordrar",
    heading: "Mina ordrar",
    summary: (n: number, total: string) => `${n} ordrar · ${total} i orderstock`,
    newOrder: "Ny order",
    emptyTitle: "Blankt papper.",
    emptyBody: "Inga ordrar ligger. Pröva en och se om kassan håller innan ni tackar ja.",
    emptyCta: "Pröva en order",
    ref: "Referens",
    customer: "Kund",
    amount: "Ordervärde",
    material: "Material",
    paid: "Betalas",
    outcome: "Utfall",
    fresh: "ny",
    attachment: (name: string) => `Bilaga: ${name}`,
    badge: { yes: "Höll", tight: "Tunt", no: "Trotsad" },
    againstAdvice: (trough: string) => `Lagd mot rådet — kassan bottnade på ${trough}.`,
  },

  liveStrip: {
    title: "Live anrop",
    lede: "Svaren som nycklarna faktiskt gav. Tomt fält = låst steg.",
    fetchedAt: (time: string) => `hämtad ${time}`,
    noContact: "Ingen kontakt",
    locked: "låst",
    consent: "consent",
    empty: "tom",
  },

  verdict: {
    yes: "Ja — lägg ordern",
    tight: "Ja, men det blir tunt",
    noEarliest: (date: string) => `Nej — men lägg den ${date}`,
    noNever: "Nej — den ryms inte i år",
    reasonYes: (trough: string, date: string) =>
      `Kassan bottnar på ${trough} den ${date}, kvar över kudden hela vägen.`,
    reasonTight: (trough: string, date: string) =>
      `Kassan går ner till ${trough} den ${date}. En sen kund och det brister.`,
    reasonNo: (material: string, trough: string, date: string, pay: string) =>
      `Materialet på ${material} tar kassan till ${trough} den ${date}. Kunden betalar först ${pay}.`,
  },

  flow: {
    orderMaterial: (customer: string) => `Material, ${customer}`,
    orderPayment: (customer: string) => `Betalning, ${customer}`,
    orderMaterialBasis: (pct: number) =>
      `${pct} % av ordervärdet, betalas innan leverans`,
    orderPaymentBasis: (term: number, late: number) =>
      `Netto ${term} dagar plus ${late} dagar som historiken visar`,

    plannedMaterial: "Material, tänkt order",
    plannedPayment: "Betalning, tänkt order",
    plannedDeposit: "Förskott, tänkt order",
    plannedMaterialBasis: (pct: string) => `${pct} av ordervärdet, som på tidigare ordrar`,
    plannedDepositBasis: (pct: string) => `${pct} av ordervärdet vid beställning`,

    invoiceIn: (party: string) => `Betalning, ${party}`,
    invoiceOut: (party: string) => `Faktura, ${party}`,
    invoiceInLate: (due: string, party: string, days: number) =>
      `Förfaller ${due}, men ${party} betalar i snitt ${days} dagar sent`,
    invoiceInOnTime: (due: string) => `Förfaller ${due}, betalas normalt i tid`,
    invoiceOutBasis: (id: string, due: string) => `Leverantörsfaktura ${id}, förfaller ${due}`,
    recurringBasis: (day: number) => `Återkommande post, dras den ${day}:e varje månad`,

    /** Namnen på de återkommande posterna. Källan kan heta vad som helst — vi
     *  visar kategorin, så raden läses på läsarens språk. */
    recurring: {
      payroll: "Lön",
      tax: "Skattekonto, arbetsgivaravgift",
      rent: "Hyra maskinpark",
      utility: "El och verkstad",
      insurance: "Försäkring maskiner",
    },
  },

  scenario: {
    german: "Tysk order",
    service: "Servicejobb",
    none: "Ingen ny order",
    germanBlurb: "Müller Tiefbau, 840 k. Material måste köpas nu. De betalar om 60 dagar.",
    serviceBlurb: "Befintlig kund. 95 k. Lite material, betalt inom 14 dagar.",
    noneBlurb: "Bara det som redan ligger. Lön, material, inbetalningar.",
  },

  feeds: {
    bank: {
      short: "Bank",
      role: "AIS + PIS · Danske ORGA",
      statusLabel: "Live",
      synced: "2 min sedan",
      tip: "accountinformation + paymentinitiation + bankgiroinformation. Saldo (interimAvailable), transaktioner, swedish-giro. Live just nu.",
    },
    boks: {
      short: "Böcker",
      role: "Fakturor, lön, leverantör",
      statusLabel: "Släpar",
      synced: "4 dagar sedan",
      tip: "Bokföringen, via Zwapgrid. Fakturor och lön. Senast för 4 dagar sen — därför 61%.",
    },
    order: {
      name: "Ordern",
      short: "Order",
      role: "Scenario, inte live",
      statusLabel: "Scenario",
      synced: "inmatad nu",
      tip: "Ordern du testar. Inte från banken eller böckerna.",
    },
  },

  mode: { demo: "Demodata", live: "Skarp data" },

  profile: {
    materialShareWire: "Medianandel material på tidigare ordrar i bokföringen",
    materialLeadWire: "Snittid från orderdatum till förfallen materialfaktura",
    paymentTermWire: "Villkor på kundens senaste fakturor",
    customerLateWire: "Snitt av dueDate mot paidDate på tre betalda fakturor",
  },

  citeStatus: { live: "Live", lag: "Släpar", locked: "Låst", model: "Modell" },

  cite: {
    "op-balance": {
      field: "balances[0].balanceAmount · interimAvailable",
      value: "418 400 SEK",
      note: "Saldot vi räknar från. Tillgängligt, inte bokfört — betalningar på väg ut är redan avdragna.",
    },
    "op-aspsp": {
      field: "aspsps.length",
      value: "111 banker",
      note: "Anropet gick igenom skarpt mot sandboxen. Det är beviset på att nyckeln lever.",
    },
    "op-tx-atlas": {
      field: "booked[] · creditorAccount.bankgiro",
      value: "4 betalningar → 5051-9071",
      note: "Fyra tidigare utbetalningar till Atlas Copco, alla till samma bankgiro.",
    },
    "op-tx-muller": {
      field: "booked[] · bookingDate",
      value: "3 inbetalningar från Müller",
      note: "Datumen pengarna faktiskt landade. Matchas mot förfallodatum i böckerna.",
    },
    "op-tx-nameless": {
      field: "booked[].creditorName",
      value: "null",
      note: "PSD2 kräver inte ifyllt namn. Banken vet beloppet men inte vem — luckan fylls från böckerna.",
    },
    "op-accounts-locked": {
      field: "consentStatus",
      value: "received — väntar SCA",
      note: "Saldo och transaktioner är låsta tills någon signerar med BankID. Siffrorna i demon är därför modellerade på riktig svarsform.",
    },
    "op-pis-held": {
      field: "transactionStatus",
      value: "held",
      note: "Betalningen skickas inte förrän kontot stämmer mot betalhistoriken.",
    },
    "zg-consent": {
      field: "data[0].status · data[0].source",
      value: "CREATED · null",
      note: "Samtycket finns men bokföringssystemet är inte kopplat än, så fakturaanropen ger 403.",
    },
    "zg-sinv-atlas": {
      field: "SINV-ATLAS-NEW · dueDate, amount, bankgiro",
      value: "2 dec · 520 000 SEK · 5822-1104",
      note: "Leverantörsfakturan för materialet. Bankgirot skiljer sig från de fyra tidigare betalningarna.",
    },
    "zg-cinv-muller": {
      field: "3 fakturor · dueDate mot paidDate",
      value: "snitt 23 dagar sent",
      note: "Tre betalda Müller-fakturor. Skillnaden mellan förfallodatum och betaldatum är mätt, inte gissad.",
    },
    "zg-cinv-abetong": {
      field: "CINV-ABETONG · party, amount",
      value: "Abetong AB · 140 000 SEK",
      note: "Ger namnet till den namnlösa inbetalningen i banken.",
    },
    "zg-lag": {
      field: "data[0].createdOn",
      value: "senast synkad 16 nov",
      note: "Böckerna släpar fyra dagar. Lön och färska leverantörsfakturor kan saknas.",
    },
    "model-payroll": {
      call: "Modell · återkommande poster",
      field: "lön den 25:e · 187 200 SEK",
      value: "3 månader framåt",
      note: "Avtalad post med känt datum och belopp. Rullas framåt tills böckerna säger annat.",
    },
    "model-order": {
      call: "Modell · ordern du testar",
      field: "orderAmount, materialCost, betaldatum",
      value: "inmatad i scenariot",
      note: "Kommer varken från banken eller böckerna. Det är hypotesen vi räknar på.",
    },
    noBank: "Banken svarade inte. Siffran är angiven, inte hämtad — därför räknas den som en lucka.",
    balanceFrom: (account: string, date: string) =>
      `Saldot vi räknar från, hämtat ur ${account} den ${date}.`,
    accountsField: "accounts.length · valt konto",
    accountsValue: (n: number, id: string) => `${n} konton · ${id}`,
    accountsNote: (account: string) =>
      `Samtycket räcker för att läsa konton. Vi räknar på företagskontot ${account}.`,
  },

  build: {
    unknown: "okänd",
    unknownTime: "okänd tid",
    uncommitted: "ocommittat",
    built: "byggd",
    label: (detail: string) => `Byggversion ${detail}`,
  },
};

export type Pack = typeof sv;
