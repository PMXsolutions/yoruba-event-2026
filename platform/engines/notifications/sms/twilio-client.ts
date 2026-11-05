import "server-only";

import { normalizeSmsRecipient } from "@/platform/engines/notifications/sms/format";
import { sendDirectSms } from "@/platform/engines/notifications/sms/directsms-client";
import type { SendSmsResult } from "@/platform/engines/notifications/sms/result";
import type { ResolvedSmsSettings } from "@/platform/engines/notifications/sms/config";
import {
  getSmsEnvPresence,
  type SmsEnvPresence,
  type SmsMessage,
} from "@/platform/engines/notifications/sms/twilio-stub";

export type { SendSmsResult };
export { getSmsEnvPresence };
export type { SmsEnvPresence, SmsMessage };

async function sendTwilioMessage(settings: ResolvedSmsSettings, to: string, body: string): Promise<SendSmsResult> {
  const accountSid = settings.twilioAccountSid;
  const authToken = settings.twilioAuthToken;
  const from = settings.twilioFromNumber;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  try {
    const payload = new URLSearchParams({ To: to, From: from, Body: body });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload,
        signal: AbortSignal.timeout(15_000),
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[notification-engine] SMS send failed:", message.slice(0, 160));
    return { ok: false, reason: "SEND_FAILED", message: "SMS delivery failed" };
  }
}

/**
 * Send through the configured provider. Does not consult the enabled flag —
 * callers that represent user-facing sends must check that themselves.
 */
export async function deliverSms(
  settings: ResolvedSmsSettings,
  message: SmsMessage,
): Promise<SendSmsResult> {
  if (settings.credentialLocked) {
    return {
      ok: false,
      reason: "NOT_CONFIGURED",
      message: "Saved SMS password could not be read. Enter it again in Settings.",
    };
  }
  if (!settings.ready) {
    const label = settings.provider === "twilio" ? "Twilio" : "DirectSMS";
    return { ok: false, reason: "NOT_CONFIGURED", message: `${label} is not configured` };
  }

  const body = message.body.trim();
  if (!body) return { ok: false, reason: "SEND_FAILED", message: "Message is empty" };
  if (body.length > 480) return { ok: false, reason: "SEND_FAILED", message: "Message is too long" };

  const digits = normalizeSmsRecipient(message.to, settings.defaultCountryCode);
  if (!digits) return { ok: false, reason: "MISSING_PHONE", message: "Phone number could not be formatted" };

  if (settings.provider === "directsms") {
    const result = await sendDirectSms({
      apiUrl: settings.apiUrl,
      username: settings.username,
      password: settings.password,
      senderId: settings.senderId,
      messageType: settings.messageType,
      to: digits,
      message: body,
    });
    if (result.ok) console.info("[notification-engine] SMS sent:", result.sid ?? "ok");
    return result;
  }

  return sendTwilioMessage(settings, `+${digits}`, body);
}

/**
 * Active SMS send. Uses dashboard settings when they have been saved, and
 * otherwise the SMS_ENABLED flag plus Twilio or DirectSMS environment values.
 * Never throws; callers must treat failures as non-fatal.
 */
export async function sendSmsMessage(message: SmsMessage): Promise<SendSmsResult> {
  const { resolveSmsSettings } = await import("@/platform/engines/notifications/sms/settings-store");
  const settings = await resolveSmsSettings();
  if (!settings.enabled) {
    console.info("[notification-engine] SMS skipped — disabled.");
    return { ok: false, reason: "DISABLED", message: "SMS is disabled" };
  }
  return deliverSms(settings, message);
}
