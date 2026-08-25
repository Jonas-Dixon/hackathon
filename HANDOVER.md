# Handover — Sikt (Embedded Finance Build Day)

För **Claude Code**. Läs detta innan du rör koden. Bygg inte om Bokio. Rör inte auth/db.

**Event:** Embedded Finance Build Day, tis 25 aug 2026, 09.30–16.  
**Byggare:** UX/UI, missar presentationen ~16. Appen ska bära sig själv (demo + 3 slides).  
**Produktnamn:** Sikt. En fråga: **kan du ta den här ordern?**

---

## 1. Vad det är (och inte är)

Likviditetsbeslut för ett litet bygg/borr-bolag med **ofullständig data**.

Inte: bokföring, dashboard, nudge att “dela mer data”, Accounted.se, Bokio.

En vy. Ja / nej / vänta. Visuellt (årshjul, kassakalender, fold-par), inte wall of text.

Scenario som vann: tysk order (Müller Tiefbau 840 k). Material 520 k måste köpas nu. Betalning om 60 dagar. Bolaget har 418 k. Svar: **nej, kassan tar slut 2 dec**.

AI är **sidekick, aldrig action**. Clippy, inte CFO. Får aldrig trycka ja/nej.

---

## 2. Stack

- TanStack Start + Vite 8 + React + Tailwind 4 + shadcn/ui
- `npm run dev` → `0.0.0.0:8080` (live preview)
- Auth **OFF**. Database **OFF**. Rör inte `src/lib/auth`, `src/lib/db`.
- Inga nya abstraktioner. Ändra befintliga filer.

---

## 3. Nycklar — använd bara server-side

**Aldrig `VITE_`-prefix. Aldrig i klientbundle.**

### Open Payments sandbox

```
CLIENT_ID      aabc04df-b82c-44e9-abec-d039ad9587dd
CLIENT_SECRET  bq0NfFhaWMUneL-sX8Fmw5DYVGjCEhXPS0itmjJZp20
AUTH           https://auth.sandbox.openbankingplatform.com
API            https://api.sandbox.openbankingplatform.com
```

Token:

```
POST {AUTH}/connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
client_id=…
client_secret=…
scope=aspspinformation accountinformation corporate
```

Måste ha `private` **eller** `corporate` i scope, annars `invalid_scope`.

### Zwapgrid API.1

```
API_KEY     Rf4/okTP9HkI5b5WWrpQXhOPyuxGb6BebiOYAuLRi3McNOzcAbVJ0wbtsYNYZqDR_hoAmx+Kd7jotyav7nYbDUIVEdamqN1LAFzYoBD6DDdk=_mGWDfWbpLb91Y2TNrc8w4A==
BASE        https://apione.zwapgrid.com
CONSENT_ID  60141c3c-7821-41d0-86d6-a5842ea721e3   # Nordborr AB, Fortnox-tenant
```

Varje anrop:

```
x-api-key: {API_KEY}
x-correlation-id: {uuid}     # krävs, 400 utan
```

Paths (prefixet `/consents` resp `/accounting` är **inte** optional):

```
GET  {BASE}/consents/api/v1/consents
GET  {BASE}/consents/api/v1/consents/{id}
POST {BASE}/consents/api/v1/consents            body: { "name": "…" }  → 201 + Location
POST {BASE}/consents/api/v1/consents/{id}/otc   onboarding one-time code
GET  {BASE}/accounting/api/v1/consents/{id}/supplierinvoices
GET  {BASE}/accounting/api/v1/consents/{id}/salesinvoices
GET  {BASE}/accounting/api/v1/consents/{id}/companyinformation
GET  {BASE}/accounting/api/v1/consents/{id}/suppliers
```

Status: `0 CREATED` · `1 ACCEPTED` · `2 REVOKED` · `3 INACTIVE`.

### shadcn/ui Blocks premium

```
sk_live_lC-7tsIAfKZk5qMlR5012x636Az5EdXv
https://www.shadcnblocks.com/blocks
```

### `.env` (workspace-root)

Samma värden ligger i `.env`. **Vite exponerar inte non-`VITE_` till koden** — därför är sandbox-URL + nycklar **även hårdkodade som DEFAULTS** i `src/lib/live.server.ts`. Lita inte på `process.env` i Vite/Nitro. Tidigare bug: `Failed to parse URL from /connect/token` när basen blev tom sträng.

---

## 4. Vad API:erna faktiskt gav (2026-08-25)

### Open Payments — live

| Anrop | HTTP | Resultat |
|---|---|---|
| `POST /connect/token` | 200 | Bearer, ~3600 s |
| `GET /psd2/aspspinformation/v1/aspsps?country=SE` | 200 | **111 banker**. SEB `ESSESESS`, SHB `HANDSESS`, Swedbank `SWEDSESS`, Nordea `NDEASESS`, Danske `DABASESX` |
| `POST /psd2/consent/v1/consents` | 201 | `consentStatus: received`. SCA: Mobilt BankID. Kräver headers `X-Request-ID`, `X-BicFi`, `PSU-ID`, `PSU-Corporate-ID` |
| `GET /psd2/accountinformation/v1/accounts` | låst | Kräver `Consent-ID` + samma `PSU-Corporate-ID` + **valid** consent (BankID) |
| `POST /psd2/payments/swedish-giro` | inte anropad | PIS. Vi håller den `held` tills AIS × faktura |

Token-endpoint: `{AUTH}/connect/token`.  
AIS/ASPSP: `{API}/psd2/...`  
Fel path `/v1/aspsps` ger 401 `issuer (null) is invalid` — det är fel tjänst.

**Inga saldon. Inga transaktioner.** Sandbox-appen har inte gjort BankID. Klient-credentials räcker inte.

### Zwapgrid — nyckel live, böcker tomma

| Anrop | HTTP | Resultat |
|---|---|---|
| `GET /consents/api/v1/consents` | 200 | 1 rad |
| Consent Nordborr AB `e016cecd-f628-49e8-9902-7461277da8b6` | — | `status: 0 CREATED`, `source: null` |
| `GET .../supplierinvoices` | 403 | `"Consent not found"` = inte ACCEPTED |

**Inga fakturor, ingen company info** förrän någon kör Zwapgrid onboarding (Fortnox/Visma) mot consentet.

---

## 5. Mock vs live — blanda inte ihop

| Yta | Källa |
|---|---|
| Live-raden “Live anrop” | Riktiga API-svar (`getLiveSnapshot`) |
| Nordborr kassa 418 k, tysk order, kalender, fold, year-wheel | **Mock** i `src/lib/engine.ts` + `cross.ts` |
| DataFeeds “Live / 82%” | **Lögn i copy** — `src/lib/sources.ts` är inte kopplad till snapshot |
| IBAN-skifte Atlas, Müller sen betalare, namnlös tx | Mock-triangulering mot Berlin Group-form |

När du kopplar live data: ersätt `COMPANY.cash` / `BANK_TX` / invoices. Låt kalendern och `decide()` vara kvar.

---

## 6. Filkarta

```
src/routes/index.tsx          sida. loader: getLiveSnapshot()
src/lib/engine.ts             Nordborr, scenarion, project(), decide()
src/lib/cross.ts              triangulering AIS × Zwapgrid (mock)
src/lib/open-payments.ts      Berlin Group-former, PIS-draft Atlas
src/lib/live.ts               createServerFn + typer
src/lib/live.server.ts        server-only fetch. DEFAULTS här.
src/lib/sources.ts            FEEDS-copy (inkonsekvent mot live)
src/components/live-strip.tsx strukturerade API-rader
src/components/verdict-panel.tsx  fold-par + generera-knapp
src/components/cash-calendar.tsx  mobil: veckoremsa + eventlista + DayTip
src/components/year-wheel.tsx     polar årshjul, säsonger, lg+
src/components/sidekick.tsx       AI som hint, inte beslut
src/components/source-mark.tsx    OP/Zwapgrid-logga, uptime
src/components/bits/*             react-bits (TrueFocus, SpotlightCard, …)
src/styles.css                    ljus fintech-palett, fold-CSS
```

Kärn-API i motorn:

```
project(scenario, accept) → DayPoint[]
decide(scenario, accept)  → { canTake, floor, floorDate, reason }
triangulate(scenarioId)   → Finding[]
```

`TODAY` är låst till **2026-11-20** (scenariodatum, inte systemklocka).

---

## 7. Designkontrakt (rör inte slumpmässigt)

- Ljus fintech. Inte mörkt. Paper `#f3f2ee`, ink `#161615`.
- Typsnitt: IBM Plex Sans + Mono. Fraunces bara display.
- Risk: clear `#1a7a4c` · watch `#9a6700` · storm `#b42318`
- Mobil först. Kalender = veckoremsa + lista, inte 7-kolumnsgrid.
- Årshjul dold under `lg`.
- Hover räknas inte på mobil — tap sätter DayTip.
- Källor synliga: Open Payments / Zwapgrid, tooltip, grön/amber uptime.
- Verdict + kassa **foldar** mot varandra (delta-chip). Knapp genererar.
- react-bits bara där det lyfter uppdraget, inte dekoration överallt.
- Enkelt språk. “Stor order, ja eller nej.” Inte redovisningsord.

---

## 8. Inspiration PDF (problem statements)

Hackathon-briefen, 5 problem. Vi bygger **#5 “Can I take this order”** och nuddar #1 fragmentering + #3 fraud (IBAN-skifte) via triangulering.

Graceful degradation är poängen: ofullständig data ska ge ett beslut med osäkerhet, inte en tom dashboard.

---

## 9. Presentation (byggaren är inte där kl 16)

Antag 3 slides + länk till appen + ev. Loom.

1. Frågan. “Kan Nordborr ta Müller 840 k?”
2. Korsningen. Bank (Open Payments) × böcker (Zwapgrid). IBAN-skifte stoppar utbetalning.
3. Live anrop. Vad nycklarna faktiskt släppte igenom vs vad som är låst.

Ingen wall of text. Appen är demot.

---

## 10. Vad som saknas (gör detta, i ordning)

1. **BankID / SCA** på sandbox-PSU → AIS accounts + balances + transactions. Då kan `COMPANY.cash` bli live `interimAvailable`.
2. **Zwapgrid onboarding** (OTC) mot Fortnox/Visma → `source` sätts, status ACCEPTED, fakturor 200.
3. Ersätt mock `BANK_TX` / invoices med live, kör genom `triangulate()`.
4. Rätta `src/lib/sources.ts` så status speglar snapshot (idag ljuger “Live 82%”).
5. PIS swedish-giro: visa payload, skicka inte om IBAN-finding är storm.
6. Mobil QA på fold + kalender. TrueFocus göms på small.
7. Tre slides. Inte mer.

Gör inte: Lumera, avtalsgenerator, holistisk bankapp, auth, databas, Figma.

---

## 11. Fällor som redan bränt tid

- Vite ger inte non-`VITE_` env till koden. Hårdkoda DEFAULTS i `live.server.ts`.
- Node `fetch('/path')` = `TypeError: Failed to parse URL from /path`. Alltid absolut `https://`.
- Zwapgrid 404 om du skippar `/consents` i path. 400 utan `x-correlation-id`. 403 på accounting innan ACCEPTED.
- Open Payments `/v1/aspsps` är fel. Rätt: `/psd2/aspspinformation/v1/aspsps`.
- AIS accounts kräver samma `PSU-Corporate-ID` som när consent skapades.
- `createServerFn` + `import("./live.server")` — dra aldrig in `node:fs` i en komponent.

---

## 12. Discord-insikter som styrde scope

- Lumera = vendor lock-in försäkring, inte vårt problem idag.
- Intern avtalsgenerator redan tweakat i åratal.
- Pain: holistisk kundöversikt, men **ingen vill lämna data**.
- Därför: beslutsvy på den data som *finns*, med synlig lucka, inte “dela mer”.

Tysk-order-historien (borr/industri, tysk lean, order utan likviditet) är demots ryggrad.
