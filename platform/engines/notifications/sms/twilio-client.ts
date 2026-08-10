import "server-only";

import {
  getSmsEnvPresence,
  type SmsEnvPresence,
  type SmsMessage,
} from "@/platform/engines/notifications/sms/twilio-stub";

export type SendSmsResult =
  | { ok: true; sid?: string }
  | {
      ok: false;
      reason: "NOT_CONFIGURED" | "DISABLED" | "SEND_FAILED" | "MISSING_PHONE";
      message: string;
    };

export { getSmsEnvPresence };
export type { SmsEnvPresence, SmsMessage };

/**
 * Twilio REST SMS client — activates when credentials + SMS_ENABLED are set.
 * Never throws; callers must treat failures as non-fatal.
 */
export async function sendSmsMessage(message: SmsMessage): Promise<SendSmsResult> {
  const env = getSmsEnvPresence();
  if (!env.ready) {
    console.info("[notification-engine] SMS skipped — Twilio not configured.");
    return { ok: false, reason: "NOT_CONFIGURED", message: "Twilio not configured" };
  }

  const to = message.to.trim();
  if (!to) {
    return { ok: false, reason: "MISSING_PHONE", message: "No phone number" };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN!.trim();
  const from = process.env.TWILIO_FROM_NUMBER!.trim();
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  try {
    const body = new URLSearchParams({
      To: to,
      From: from,
      Body: message.body,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[notification-engine] Twilio API error:", res.status, text.slice(0, 200));
      return { ok: false, reason: "SEND_FAILED", message: `Twilio HTTP ${res.status}` };
    }

    const data = (await res.json()) as { sid?: string };
    console.info("[notification-engine] SMS sent:", data.sid ?? "ok");
    return { ok: true, sid: data.sid };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[notification-engine] SMS send failed:", msg);
    return { ok: false, reason: "SEND_FAILED", message: "SMS delivery failed" };
  }
}
