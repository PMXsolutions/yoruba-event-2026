import type { EventConfig } from "@/platform/core/types/event";
import type { RsvpRecord } from "@/platform/engines/rsvp/schema";

export type RsvpConfirmationEmailParams = {
  event: EventConfig;
  record: RsvpRecord;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatEventDate(event: EventConfig): string {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: event.calendar.timezone,
    }).format(new Date(event.calendar.startIso));
  } catch {
    return event.heroDateDisplay;
  }
}

/**
 * Professional HTML confirmation email — Promax Event branded.
 * Responsive table layout for Gmail / Outlook / Apple Mail.
 */
export function buildRsvpConfirmationEmail({
  event,
  record,
}: RsvpConfirmationEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const brand = event.platformBrand;
  const dateLabel = formatEventDate(event);
  const location = event.venue.fullAddress || event.location;
  const mapsUrl = event.venue.mapsUrl;
  const ref = record.registration_reference ?? "Pending";
  const status = "New";
  const saveTheDateUrl = event.seo.canonicalUrl;

  const subject = `Interest received — ${event.name}`;

  const text = [
    `${brand}`,
    "",
    `Dear ${record.full_name},`,
    "",
    `Thank you — we have received your interest for ${event.name}.`,
    "",
    "This is not yet a purchased or confirmed ticket.",
    "Ticketing, sponsorship packages and the full programme will be announced later.",
    "You will receive priority updates when details are released.",
    "",
    `Event date: ${dateLabel}`,
    `Location: ${location}`,
    "",
    event.description,
    "",
    `Registration reference: ${ref}`,
    `Status: ${status}`,
    `Guests: ${record.number_of_attendees}`,
    `Ticket preference: ${record.ticket_type}`,
    "",
    `Save the date: ${saveTheDateUrl}`,
    mapsUrl ? `Map: ${mapsUrl}` : "",
    "",
    `Questions? Contact ${event.contact.email}`,
    event.contact.phone ? `Phone: ${event.contact.phone}` : "",
    "",
    `Warm regards,`,
    event.organisation,
    `Powered by ${brand}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4efe6;font-family:Georgia,'Times New Roman',serif;color:#24150f;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e8dfd0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#1a0f0a;padding:28px 32px;text-align:center;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#c9a227;">${escapeHtml(brand)}</p>
              <h1 style="margin:10px 0 0;font-size:26px;line-height:1.25;color:#faf6ef;font-weight:600;">${escapeHtml(event.name)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#8a6f38;">Interest received</p>
              <p style="margin:0 0 16px;font-size:22px;line-height:1.3;">Dear ${escapeHtml(record.full_name)},</p>
              <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#3a2419;">
                Thank you — we have received your interest for <strong>${escapeHtml(event.name)}</strong>.
              </p>
              <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#3a2419;background:#faf6ef;border:1px solid #e8dfd0;border-radius:12px;padding:14px 16px;">
                <strong>This is not yet a purchased or confirmed ticket.</strong>
                Ticketing, sponsorship packages and the full programme will be announced later.
                You will receive <strong>priority updates</strong> when details are released.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#faf6ef;border:1px solid #e8dfd0;border-radius:12px;">
                <tr>
                  <td style="padding:18px 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#3a2419;">
                    <p style="margin:0 0 8px;"><strong>Date:</strong> ${escapeHtml(dateLabel)}</p>
                    <p style="margin:0 0 8px;"><strong>Location:</strong> ${escapeHtml(location)}</p>
                    <p style="margin:0;"><strong>About:</strong> ${escapeHtml(event.description)}</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #efe6d8;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#8a6f38;">Registration reference</td>
                  <td style="padding:10px 0;border-bottom:1px solid #efe6d8;font-family:Arial,Helvetica,sans-serif;font-size:13px;text-align:right;color:#24150f;"><strong>${escapeHtml(ref)}</strong></td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #efe6d8;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#8a6f38;">Status</td>
                  <td style="padding:10px 0;border-bottom:1px solid #efe6d8;font-family:Arial,Helvetica,sans-serif;font-size:13px;text-align:right;">${escapeHtml(status)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #efe6d8;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#8a6f38;">Guests</td>
                  <td style="padding:10px 0;border-bottom:1px solid #efe6d8;font-family:Arial,Helvetica,sans-serif;font-size:13px;text-align:right;">${record.number_of_attendees}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#8a6f38;">Ticket preference</td>
                  <td style="padding:10px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;text-align:right;">${escapeHtml(record.ticket_type)}</td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td style="border-radius:999px;background:#c9a227;">
                    <a href="${escapeHtml(saveTheDateUrl)}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;color:#1a0f0a;">Save the Date</a>
                  </td>
                </tr>
              </table>
              ${
                mapsUrl
                  ? `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;"><a href="${escapeHtml(mapsUrl)}" style="color:#7a5c1e;">View location on Google Maps</a></p>`
                  : ""
              }
              <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#3a2419;">
                Questions? <a href="mailto:${escapeHtml(event.contact.email)}" style="color:#7a5c1e;">${escapeHtml(event.contact.email)}</a>
              </p>
              <p style="margin:24px 0 0;font-size:14px;color:#3a2419;">Warm regards,<br><strong>${escapeHtml(event.organisation)}</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background:#faf6ef;padding:18px 32px;text-align:center;border-top:1px solid #e8dfd0;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8a6f38;">
                Powered by ${escapeHtml(brand)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  return { subject, html, text };
}
