/** Berlin Group NextGen as exposed by Open Payments (docs.openpayments.io). */

export const OP_SCOPES = [
  "corporate",
  "accountinformation",
  "paymentinitiation",
  "bankgiroinformation",
] as const;

export const ASPSP = {
  name: "Danske Bank",
  bic: "DABASESX",
  country: "SE",
};

export const ACCOUNT = {
  resourceId: "acc-nordborr-drift",
  iban: "SE4512000000012810127741",
  currency: "SEK",
  usage: "ORGA" as const,
  cashAccountType: "CACC",
  product: "Business Account",
  name: "Drift",
  status: "enabled" as const,
};

export const BALANCE = {
  balanceType: "interimAvailable" as const,
  balanceAmount: { amount: "418400.00", currency: "SEK" },
};

export const ATLAS_GIRO_OLD = "5051-9071";
export const ATLAS_GIRO_NEW = "5822-1104";

export type PisDraft = {
  product: "swedish-giro";
  giroType: "BANKGIRO";
  debtorIban: string;
  creditorName: string;
  creditorGiro: string;
  amount: string;
  currency: "SEK";
  remittance: string;
  transactionStatus: "held" | "RJCT";
  reason: string;
};

export function atlasPayment(blocked: boolean): PisDraft {
  return {
    product: "swedish-giro",
    giroType: "BANKGIRO",
    debtorIban: ACCOUNT.iban,
    creditorName: "Atlas Copco",
    creditorGiro: ATLAS_GIRO_NEW,
    amount: "520000.00",
    currency: "SEK",
    remittance: "SINV-ATLAS-NEW",
    transactionStatus: blocked ? "held" : "RJCT",
    reason: blocked
      ? "creditorAccount (BANKGIRO 5822-1104) ≠ 4 booked payments to 5051-9071"
      : "not initiated",
  };
}
