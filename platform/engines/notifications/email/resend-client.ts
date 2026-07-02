import "server-only";

import { getEmailEnvPresence } from "@/platform/engines/notifications/email/env-status";
import {
  buildRsvpConfirmationEmail,
  type RsvpConfirmationEmailParams,
} from "@/platform/engines/notifications/email/templates/rsvp-confirmation";

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; reason: "NOT_CONFIGURED" | "SEND_FAILED"; message: string };

/**
 * Resend email client — activates when RESEND_API_KEY + RESEND_FROM_EMAIL are set.
 * Never throws; RSVP submission must not depend on email delivery.
 */
export async function sendRsvpConfirmationEmail(
  params: RsvpConfirmationEmailParams,
): Promise<SendEmailResult> {
  const env = getEmailEnvPresence();
  if (!env.ready) {
    console.info("[notification-engine] Email skipped — Resend not configured.");
    return { ok: false, reason: "NOT_CONFIGURED", message: "Resend not configured" };
  }

  const { subject, html, text } = buildRsvpConfirmationEmail(params);
  const apiKey = process.env.RESEND_API_KEY!.trim();
  const from = process.env.RESEND_FROM_EMAIL!.trim();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.record.email],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[notification-engine] Resend API error:", res.status, body.slice(0, 200));
      return { ok: false, reason: "SEND_FAILED", message: `Resend HTTP ${res.status}` };
    }

    const data = (await res.json()) as { id?: string };
    console.info("[notification-engine] Confirmation email sent:", data.id ?? "ok");
    return { ok: true, id: data.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[notification-engine] Email send failed:", msg);
    return { ok: false, reason: "SEND_FAILED", message: msg };
  }
}
