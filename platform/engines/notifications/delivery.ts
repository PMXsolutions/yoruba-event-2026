import "server-only";

import { errorMessage } from "@/lib/db/connectivity";
import { dbQuery } from "@/lib/db/query";
import { isMissingRsvpCommsColumn } from "@/platform/engines/rsvp/columns";
import type {
  EmailDeliveryStatus,
  SmsDeliveryStatus,
} from "@/platform/engines/notifications/types";

export function isDeliveryColumnMissingError(error: unknown): boolean {
  return error instanceof Error && error.name === "DeliveryColumnMissingError";
}

export async function updateRsvpEmailDelivery(params: {
  rsvpId: string;
  status: EmailDeliveryStatus;
  providerId?: string | null;
}): Promise<void> {
  try {
    const rows = await dbQuery<{ id: string }>(
      `UPDATE rsvps
       SET email_status = @status,
           email_sent_at = @sentAt,
           email_provider_id = @providerId,
           updated_at = SYSDATETIMEOFFSET()
       OUTPUT INSERTED.id
       WHERE id = @id`,
      {
        id: params.rsvpId,
        status: params.status,
        sentAt: params.status === "sent" ? new Date() : null,
        providerId: params.status === "sent" ? params.providerId ?? null : null,
      },
    );
    if (rows.length === 0) {
      throw new Error("Email delivery status could not be persisted");
    }
  } catch (error) {
    const message = errorMessage(error);
    console.error("[notification-engine] email_status persistence failed", {
      rsvpId: params.rsvpId,
      status: params.status,
      message,
    });
    if (isMissingRsvpCommsColumn(message)) {
      const missing = new Error("Email delivery columns are not in this database");
      missing.name = "DeliveryColumnMissingError";
      throw missing;
    }
    if (error instanceof Error && error.message === "Email delivery status could not be persisted") {
      throw error;
    }
    throw new Error("Email delivery status could not be persisted");
  }
}

export async function updateRsvpSmsDelivery(params: {
  rsvpId: string;
  status: SmsDeliveryStatus;
  providerId?: string | null;
}): Promise<void> {
  try {
    await dbQuery(
      `UPDATE rsvps
       SET sms_status = @status,
           sms_sent_at = CASE WHEN @status = N'sent' THEN SYSDATETIMEOFFSET() ELSE sms_sent_at END,
           sms_provider_id = CASE WHEN @status = N'sent' THEN @providerId ELSE sms_provider_id END,
           updated_at = SYSDATETIMEOFFSET()
       WHERE id = @id`,
      {
        id: params.rsvpId,
        status: params.status,
        providerId: params.providerId ?? null,
      },
    );
  } catch (error) {
    console.warn("[notification-engine] sms_status update error:", errorMessage(error));
  }
}
