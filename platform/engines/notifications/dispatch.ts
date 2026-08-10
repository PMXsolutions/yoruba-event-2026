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

  // ── Email ──────────────────────────────────────────────────────────
  if (doEmail) {
  console.info(
    "[notification-engine] RSVP email channel",
    `rsvpId=${rsvpId ?? "unknown"}`,
    `emailConsent=${record.email_consent}`,
    `flagEnabled=${flags.emailConfirmationsEnabled}`,
  );
  if (!flags.emailConfirmationsEnabled) {
    emailStatus = "skipped";
    if (rsvpId) await updateRsvpEmailDelivery({ rsvpId, status: "skipped" });
    await logActivity({
      eventSlug: event.slug,
      action: "email.confirmation.skipped",
      entityType: "rsvp",
      entityId: rsvpId,
      metadata: { reason: "EMAIL_CONFIRMATIONS_ENABLED=false" },
    });
  } else if (!record.email_consent) {
    emailStatus = "skipped";
    if (rsvpId) await updateRsvpEmailDelivery({ rsvpId, status: "skipped" });
    await logActivity({
      eventSlug: event.slug,
      action: "email.confirmation.skipped",
      entityType: "rsvp",
      entityId: rsvpId,
      metadata: { reason: "no_email_consent" },
    });
  } else {
    const emailEnv = getEmailEnvPresence();
    if (!emailEnv.ready) {
      emailStatus = "not_configured";
      if (rsvpId) await updateRsvpEmailDelivery({ rsvpId, status: "not_configured" });
      await logActivity({
        eventSlug: event.slug,
        action: "email.confirmation.not_configured",
        entityType: "rsvp",
        entityId: rsvpId,
        metadata: {},
      });
    } else {
      const emailResult = await sendRsvpConfirmationEmail({ event, record });
      if (emailResult.ok) {
        emailSent = true;
        emailStatus = "sent";
        if (rsvpId) {
          await updateRsvpEmailDelivery({
            rsvpId,
            status: "sent",
            providerId: emailResult.id ?? null,
          });
        }
        await logActivity({
          eventSlug: event.slug,
          action: "email.confirmation.sent",
          entityType: "rsvp",
          entityId: rsvpId,
          metadata: {
            providerId: emailResult.id ?? null,
            transport: emailEnv.transport,
            fromDomain: emailEnv.diagnostics.fromDomain,
          },
        });
      } else if (emailResult.reason === "NOT_CONFIGURED") {
        emailStatus = "not_configured";
        if (rsvpId) await updateRsvpEmailDelivery({ rsvpId, status: "not_configured" });
        await logActivity({
          eventSlug: event.slug,
          action: "email.confirmation.not_configured",
          entityType: "rsvp",
          entityId: rsvpId,
          metadata: { transport: emailEnv.transport },
        });
      } else {
        emailStatus = "failed";
        if (rsvpId) await updateRsvpEmailDelivery({ rsvpId, status: "failed" });
        console.warn(
          "[notification-engine] RSVP saved but confirmation email failed.",
          `transport=${emailEnv.transport}`,
          `fromDomain=${emailEnv.diagnostics.fromDomain ?? "none"}`,
          `smtpHost=${emailEnv.diagnostics.smtpHost ?? "none"}`,
        );
        await logActivity({
          eventSlug: event.slug,
          action: "email.confirmation.failed",
          entityType: "rsvp",
          entityId: rsvpId,
          metadata: {
            reason: emailResult.reason,
            transport: emailEnv.transport,
            fromDomain: emailEnv.diagnostics.fromDomain,
          },
        });
      }
    }
  }
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
