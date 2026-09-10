import "server-only";

import { logActivity } from "@/lib/activity/log";
import { getFeatureFlags } from "@/platform/core/flags";
import type { EventConfig } from "@/platform/core/types/event";
import {
  updateRsvpEmailDelivery,
  updateRsvpSmsDelivery,
} from "@/platform/engines/notifications/delivery";
import { getEmailEnvPresence } from "@/platform/engines/notifications/email/env-status";
import { sendRsvpConfirmationEmail } from "@/platform/engines/notifications/email/resend-client";
import { buildRsvpConfirmationSms } from "@/platform/engines/notifications/email/templates/rsvp-confirmation";
import {
  getSmsEnvPresence,
  sendSmsMessage,
} from "@/platform/engines/notifications/sms/twilio-client";
import type { RsvpRecord } from "@/platform/engines/rsvp/schema";

export type DispatchRsvpResult = {
  emailSent: boolean;
  smsSent: boolean;
  emailStatus: string;
  smsStatus: string;
};

export type DispatchRsvpOptions = {
  /** Defaults to both channels */
  channels?: ("email" | "sms")[];
};

/**
 * Notification Engine — dispatches post-registration communications.
 * Email/SMS failures are logged only; never block the primary RSVP flow.
 */
export async function dispatchRsvpNotifications(
  event: EventConfig,
  record: RsvpRecord,
  options: DispatchRsvpOptions = {},
): Promise<DispatchRsvpResult> {
  const flags = getFeatureFlags();
  const rsvpId = record.id;
  const channels = options.channels ?? ["email", "sms"];
  const doEmail = channels.includes("email");
  const doSms = channels.includes("sms");
  let emailSent = false;
  let smsSent = false;
  let emailStatus = "not_attempted";
  let smsStatus = "not_attempted";

  // Persist every branch; never send when tracking cannot be written.
  if (doEmail) {
    if (!rsvpId) throw new Error("Notification dispatch requires a persisted RSVP id");
    const emailEnv = getEmailEnvPresence();
    const status = !flags.emailConfirmationsEnabled ? "disabled"
      : !record.email_consent ? "consent_declined"
      : !emailEnv.ready ? "not_configured" : "pending";
    await updateRsvpEmailDelivery({ rsvpId, status });
    emailStatus = status;
    if (status === "pending") {
      await logActivity({ eventSlug: event.slug, action: "email.confirmation.attempt",
        entityType: "rsvp", entityId: rsvpId, metadata: { transport: emailEnv.transport } });
      let result;
      try {
        result = await sendRsvpConfirmationEmail({ event, record });
      } catch {
        result = { ok: false as const, reason: "SEND_FAILED" as const };
      }
      emailSent = result.ok;
      emailStatus = result.ok ? "sent" : result.reason === "NOT_CONFIGURED" ? "not_configured" : "failed";
      await updateRsvpEmailDelivery({ rsvpId, status: emailStatus as "sent" | "failed" | "not_configured",
        providerId: result.ok ? result.id : null });
    }
    await logActivity({ eventSlug: event.slug, action: `email.confirmation.${emailStatus}`,
      entityType: "rsvp", entityId: rsvpId, metadata: { transport: emailEnv.transport } });
  }

  // ── SMS ────────────────────────────────────────────────────────────
  if (doSms) {
  if (!flags.smsEnabled) {
    smsStatus = "disabled";
    if (rsvpId) await updateRsvpSmsDelivery({ rsvpId, status: "disabled" });
    await logActivity({
      eventSlug: event.slug,
      action: "sms.confirmation.disabled",
      entityType: "rsvp",
      entityId: rsvpId,
      metadata: {},
    });
  } else if (!record.sms_consent) {
    smsStatus = "skipped";
    if (rsvpId) await updateRsvpSmsDelivery({ rsvpId, status: "skipped" });
    await logActivity({
      eventSlug: event.slug,
      action: "sms.confirmation.skipped",
      entityType: "rsvp",
      entityId: rsvpId,
      metadata: { reason: "no_sms_consent" },
    });
  } else if (!record.phone) {
    smsStatus = "skipped";
    if (rsvpId) await updateRsvpSmsDelivery({ rsvpId, status: "skipped" });
    await logActivity({
      eventSlug: event.slug,
      action: "sms.confirmation.skipped",
      entityType: "rsvp",
      entityId: rsvpId,
      metadata: { reason: "missing_phone" },
    });
  } else {
    const smsEnv = getSmsEnvPresence();
    if (!smsEnv.ready) {
      smsStatus = "not_configured";
      if (rsvpId) await updateRsvpSmsDelivery({ rsvpId, status: "not_configured" });
      await logActivity({
        eventSlug: event.slug,
        action: "sms.confirmation.not_configured",
        entityType: "rsvp",
        entityId: rsvpId,
        metadata: {},
      });
    } else {
      const body = buildRsvpConfirmationSms(event, record);
      const smsResult = await sendSmsMessage({
        to: record.phone,
        body,
        eventSlug: event.slug,
      });
      if (smsResult.ok) {
        smsSent = true;
        smsStatus = "sent";
        if (rsvpId) {
          await updateRsvpSmsDelivery({
            rsvpId,
            status: "sent",
            providerId: smsResult.sid ?? null,
          });
        }
        await logActivity({
          eventSlug: event.slug,
          action: "sms.confirmation.sent",
          entityType: "rsvp",
          entityId: rsvpId,
          metadata: { sid: smsResult.sid ?? null },
        });
      } else if (smsResult.reason === "NOT_CONFIGURED") {
        smsStatus = "not_configured";
        if (rsvpId) await updateRsvpSmsDelivery({ rsvpId, status: "not_configured" });
        await logActivity({
          eventSlug: event.slug,
          action: "sms.confirmation.not_configured",
          entityType: "rsvp",
          entityId: rsvpId,
          metadata: {},
        });
      } else {
        smsStatus = "failed";
        if (rsvpId) await updateRsvpSmsDelivery({ rsvpId, status: "failed" });
        console.warn("[notification-engine] RSVP saved but confirmation SMS failed.");
        await logActivity({
          eventSlug: event.slug,
          action: "sms.confirmation.failed",
          entityType: "rsvp",
          entityId: rsvpId,
          metadata: { reason: smsResult.reason },
        });
      }
    }
  }
  }

  return { emailSent, smsSent, emailStatus, smsStatus };
}
