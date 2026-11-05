"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/rbac";
import { logActivity } from "@/lib/activity/log";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { parseSmsSettingsInput } from "@/platform/engines/notifications/sms/config";
import { resolveSmsSettings, saveSmsSettings } from "@/platform/engines/notifications/sms/settings-store";
import { deliverSms } from "@/platform/engines/notifications/sms/twilio-client";

export async function saveSmsSettingsAction(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuth("settings.write");
  if (!auth.ok) return { ok: false, error: auth.message };
  const limit = checkRateLimit(`sms-settings:${auth.user.id}`, 20, 60_000);
  if (!limit.allowed) return { ok: false, error: "Too many setting changes. Wait a moment and try again." };

  const parsed = parseSmsSettingsInput(raw);
  if (!parsed.ok) return parsed;

  const result = await saveSmsSettings(parsed.value, auth.user.id);
  if (!result.ok) return result;

  const event = getActiveEventConfig();
  await logActivity({
    eventSlug: event.slug,
    action: "sms.settings.saved",
    entityType: "sms_settings",
    actorId: auth.user.id,
    metadata: {
      provider: parsed.value.provider,
      enabled: parsed.value.enabled,
      remindersEnabled: parsed.value.remindersEnabled,
      senderId: parsed.value.senderId,
    },
  });
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function sendTestSmsAction(
  phone: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const auth = await requireAuth("settings.write");
  if (!auth.ok) return { ok: false, error: auth.message };
  const limit = checkRateLimit(`sms-test:${auth.user.id}`, 5, 10 * 60_000);
  if (!limit.allowed) return { ok: false, error: "Test SMS is limited. Try again in a few minutes." };

  const event = getActiveEventConfig();
  const settings = await resolveSmsSettings();
  const result = await deliverSms(settings, {
    to: phone,
    body: `${event.name}: SMS test from the committee portal. No action is required.`,
    eventSlug: event.slug,
  });
  await logActivity({
    eventSlug: event.slug,
    action: result.ok ? "sms.test.sent" : "sms.test.failed",
    entityType: "sms_settings",
    actorId: auth.user.id,
    metadata: { provider: settings.provider, reason: result.ok ? null : result.reason },
  });
  if (!result.ok) {
    return {
      ok: false,
      error:
        result.reason === "MISSING_PHONE"
          ? "Enter a mobile number such as 0412 345 678."
          : result.reason === "NOT_CONFIGURED"
            ? result.message
            : "The test SMS could not be sent. Check the gateway username, password, and sender ID.",
    };
  }
  return { ok: true, message: "Test SMS sent. Save any unsaved settings before relying on this result." };
}
