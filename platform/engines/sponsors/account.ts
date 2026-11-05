/** Receiving account for sponsorship payments and donations. Pure validation only. */

export type SponsorshipAccountInput = {
  accountName: string;
  bsb: string;
  accountNumber: string;
  bankName: string | null;
  instructions: string | null;
  visible: boolean;
};

export type SponsorshipAccount = SponsorshipAccountInput & {
  updatedAt: string | null;
};

export type PublicSponsorshipAccount = {
  accountName: string;
  bsbDisplay: string;
  bsbDigits: string;
  accountNumber: string;
  bankName: string | null;
  instructions: string | null;
};

export const DEFAULT_SPONSORSHIP_INSTRUCTIONS =
  "Transfer sponsorship payments and donations to this account. Use your name or organisation as the payment reference.";

export function normalizeBsb(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 6) return null;
  return digits;
}

export function formatBsb(digits: string): string {
  const normalized = normalizeBsb(digits);
  if (!normalized) return digits.trim();
  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
}

export function normalizeAccountNumber(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 6 || digits.length > 10) return null;
  return digits;
}

export function toPublicSponsorshipAccount(account: SponsorshipAccount): PublicSponsorshipAccount {
  return {
    accountName: account.accountName,
    bsbDisplay: formatBsb(account.bsb),
    bsbDigits: account.bsb,
    accountNumber: account.accountNumber,
    bankName: account.bankName,
    instructions: account.instructions,
  };
}

export function parseSponsorshipAccountInput(
  raw: unknown,
): { ok: true; value: SponsorshipAccountInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Account details are incomplete." };
  const body = raw as Record<string, unknown>;

  const accountName = typeof body.accountName === "string" ? body.accountName.trim() : "";
  if (accountName.length < 2 || accountName.length > 200) {
    return { ok: false, error: "Account name is required." };
  }

  const bsb = normalizeBsb(typeof body.bsb === "string" ? body.bsb : "");
  if (!bsb) return { ok: false, error: "BSB must be 6 digits." };

  const accountNumber = normalizeAccountNumber(
    typeof body.accountNumber === "string" ? body.accountNumber : "",
  );
  if (!accountNumber) return { ok: false, error: "Account number must be 6 to 10 digits." };

  const bankNameRaw = typeof body.bankName === "string" ? body.bankName.trim() : "";
  if (bankNameRaw.length > 120) return { ok: false, error: "Bank name is too long." };

  const instructionsRaw = typeof body.instructions === "string" ? body.instructions.trim() : "";
  if (instructionsRaw.length > 500) return { ok: false, error: "Instructions must be 500 characters or fewer." };

  return {
    ok: true,
    value: {
      accountName,
      bsb,
      accountNumber,
      bankName: bankNameRaw || null,
      instructions: instructionsRaw || null,
      visible: body.visible !== false,
    },
  };
}
