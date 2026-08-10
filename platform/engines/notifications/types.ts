/** Delivery statuses persisted on RSVP records and shown in the committee portal. */

export const EMAIL_DELIVERY_STATUSES = [
  "not_attempted",
  "sent",
  "failed",
  "not_configured",
  "skipped",
] as const;

export type EmailDeliveryStatus = (typeof EMAIL_DELIVERY_STATUSES)[number];

export const SMS_DELIVERY_STATUSES = [
  "not_attempted",
  "sent",
  "failed",
  "disabled",
  "not_configured",
  "skipped",
] as const;

export type SmsDeliveryStatus = (typeof SMS_DELIVERY_STATUSES)[number];

export function formatEmailDeliveryLabel(status: EmailDeliveryStatus | null | undefined): string {
  switch (status) {
    case "sent":
      return "Sent";
    case "failed":
      return "Failed";
    case "not_configured":
      return "Not configured";
    case "skipped":
      return "Skipped";
    case "not_attempted":
    default:
      return "Not attempted";
  }
}

export function formatSmsDeliveryLabel(status: SmsDeliveryStatus | null | undefined): string {
  switch (status) {
    case "sent":
      return "Sent";
    case "failed":
      return "Failed";
    case "disabled":
      return "Disabled";
    case "not_configured":
      return "Not configured";
    case "skipped":
      return "Skipped";
    case "not_attempted":
    default:
      return "Not attempted";
  }
}

export function isEmailDeliveryStatus(value: string): value is EmailDeliveryStatus {
  return (EMAIL_DELIVERY_STATUSES as readonly string[]).includes(value);
}

export function isSmsDeliveryStatus(value: string): value is SmsDeliveryStatus {
  return (SMS_DELIVERY_STATUSES as readonly string[]).includes(value);
}
