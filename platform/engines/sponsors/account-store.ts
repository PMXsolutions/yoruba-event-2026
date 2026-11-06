import "server-only";

import { connection } from "next/server";
import { getDatabaseEnvPresence } from "@/lib/db/connection";
import { errorMessage } from "@/lib/db/connectivity";
import { dbExec, dbOne } from "@/lib/db/query";
import { asIso } from "@/lib/db/values";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import {
  resolvePublicSponsorshipAccount,
  type PublicSponsorshipAccount,
  type SponsorshipAccount,
  type SponsorshipAccountInput,
} from "@/platform/engines/sponsors/account";

type AccountRow = {
  account_name: string;
  bsb: string;
  account_number: string;
  bank_name: string | null;
  instructions: string | null;
  visible: boolean | number;
  updated_at: string | Date | null;
};

function asBool(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const text = value.trim().toLowerCase();
    return text === "1" || text === "true";
  }
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) {
    return value.length > 0 && value[0] !== 0;
  }
  return false;
}

function mapRow(row: AccountRow): SponsorshipAccount {
  return {
    accountName: row.account_name,
    bsb: row.bsb,
    accountNumber: row.account_number,
    bankName: row.bank_name,
    instructions: row.instructions,
    visible: asBool(row.visible),
    updatedAt: asIso(row.updated_at),
  };
}

function missingTable(message: string): boolean {
  return /Invalid object name ['"]?sponsorship_accounts/i.test(message);
}

async function readAccount(eventSlug: string): Promise<SponsorshipAccount | null> {
  const row = await dbOne<AccountRow>(
    `SELECT account_name, bsb, account_number, bank_name, instructions, visible, updated_at
     FROM sponsorship_accounts WHERE event_slug = @slug`,
    { slug: eventSlug },
  );
  return row ? mapRow(row) : null;
}

/**
 * Public sponsorship page. The association account is shown when nothing is
 * saved yet, or when the database cannot be read. A committee member can
 * replace those details, or hide them, from the sponsor dashboard.
 */
export async function fetchPublicSponsorshipAccount(): Promise<PublicSponsorshipAccount | null> {
  await connection();
  if (!getDatabaseEnvPresence().ready) return resolvePublicSponsorshipAccount(null);
  try {
    const account = await readAccount(getActiveEventConfig().slug);
    return resolvePublicSponsorshipAccount(account);
  } catch (error) {
    console.warn("[sponsors] Receiving account is unavailable:", errorMessage(error));
    return resolvePublicSponsorshipAccount(null);
  }
}

export async function fetchSponsorshipAccount(): Promise<
  { ok: true; account: SponsorshipAccount | null } | { ok: false; message: string }
> {
  if (!getDatabaseEnvPresence().ready) return { ok: false, message: "Database is not configured." };
  try {
    return { ok: true, account: await readAccount(getActiveEventConfig().slug) };
  } catch (error) {
    const message = errorMessage(error);
    if (missingTable(message)) {
      return {
        ok: false,
        message: "The sponsorship account table is not in this database yet. Run the sponsorship account SQL.",
      };
    }
    console.error("[sponsors] Receiving account query failed:", message);
    return { ok: false, message: "Unable to load the receiving account." };
  }
}

export async function saveSponsorshipAccount(
  input: SponsorshipAccountInput,
  actorId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!getDatabaseEnvPresence().ready) return { ok: false, error: "Database is not configured." };
  const slug = getActiveEventConfig().slug;
  const params = {
    slug,
    accountName: input.accountName,
    bsb: input.bsb,
    accountNumber: input.accountNumber,
    bankName: input.bankName,
    instructions: input.instructions,
    visible: input.visible,
    actorId,
  };

  try {
    const updated = await dbExec(
      `UPDATE sponsorship_accounts
       SET account_name = @accountName,
           bsb = @bsb,
           account_number = @accountNumber,
           bank_name = @bankName,
           instructions = @instructions,
           visible = @visible,
           updated_at = SYSDATETIMEOFFSET(),
           updated_by = @actorId
       WHERE event_slug = @slug`,
      params,
    );
    if (updated === 0) {
      await dbExec(
        `INSERT INTO sponsorship_accounts (
           event_slug, account_name, bsb, account_number, bank_name, instructions, visible, updated_by
         ) VALUES (
           @slug, @accountName, @bsb, @accountNumber, @bankName, @instructions, @visible, @actorId
         )`,
        params,
      );
    }
    return { ok: true };
  } catch (error) {
    const message = errorMessage(error);
    console.error("[sponsors] Receiving account save failed:", message);
    if (missingTable(message)) {
      return { ok: false, error: "Run the sponsorship account SQL before saving these details." };
    }
    return { ok: false, error: "The receiving account could not be saved." };
  }
}
