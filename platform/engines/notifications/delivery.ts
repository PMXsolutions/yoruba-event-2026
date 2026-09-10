import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import type {
  EmailDeliveryStatus,
  SmsDeliveryStatus,
} from "@/platform/engines/notifications/types";

export async function updateRsvpEmailDelivery(params: {
  rsvpId: string;
  status: EmailDeliveryStatus;
  providerId?: string | null;
}): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("rsvps").update({
    email_status: params.status,
    email_sent_at: params.status === "sent" ? new Date().toISOString() : null,
    email_provider_id: params.status === "sent" ? params.providerId ?? null : null,
  }).eq("id", params.rsvpId).select("id").single();
  if (error || !data) {
    console.error("[notification-engine] email_status persistence failed", {
      rsvpId: params.rsvpId, status: params.status, code: error?.code ?? "NO_ROW",
    });
    throw new Error("Email delivery status could not be persisted");
  }
}

export async function updateRsvpSmsDelivery(params: {
  rsvpId: string;
  status: SmsDeliveryStatus;
  providerId?: string | null;
}): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    const payload: Record<string, unknown> = {
      sms_status: params.status,
    };
    if (params.status === "sent") {
      payload.sms_sent_at = new Date().toISOString();
      if (params.providerId) payload.sms_provider_id = params.providerId;
    }
    const { error } = await supabase.from("rsvps").update(payload).eq("id", params.rsvpId);
    if (error) {
      console.warn("[notification-engine] sms_status update failed:", error.message);
    }
  } catch (e) {
    console.warn("[notification-engine] sms_status update error:", e);
  }
}
