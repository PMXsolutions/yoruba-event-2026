import "server-only";

import { getFeatureFlags } from "@/lib/feature-flags";

export type SmsDispatchInput = {
  to: string;
  body: string;
  purpose:
    | "ticket_seat"
    | "event_reminder"
    | "committee_alert"
    | "vip_alert"
    | "doors_opening";
};

export type SmsDispatchResult =
  | { ok: true; skipped?: false }
  | { ok: false; skipped: true; reason: "SMS_DISABLED" | "MISSING_TWILIO" | "NO_CONSENT" }
  | { ok: false; skipped?: false; reason: string };

/**
 * SMS foundation — never sends unless SMS_ENABLED and Twilio env are set.
 * Production sends require explicit configuration + consent rules.
 */
export async function dispatchSms(input: SmsDispatchInput): Promise<SmsDispatchResult> {
  const flags = getFeatureFlags();
  if (!flags.SMS_ENABLED) {
    return { ok: false, skipped: true, reason: "SMS_DISABLED" };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  if (!sid || !token || !from) {
    console.info("[sms] Enabled but Twilio credentials missing — skip send.");
    return { ok: false, skipped: true, reason: "MISSING_TWILIO" };
  }

  // Consent gate — require SMS_CONSENT_ASSUMED=true until per-guest consent columns are collected.
  if (process.env.SMS_CONSENT_ASSUMED?.trim().toLowerCase() !== "true") {
    return { ok: false, skipped: true, reason: "NO_CONSENT" };
  }

  try {
    // Placeholder for Twilio REST client — intentionally not calling external API
    // until credentials + consent are confirmed in production.
    console.info("[sms] Would send", {
      purpose: input.purpose,
      toLast4: input.to.slice(-4),
      bodyLength: input.body.length,
    });
    return { ok: false, skipped: true, reason: "MISSING_TWILIO" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: msg };
  }
}
