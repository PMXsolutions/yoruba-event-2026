import type { EventConfig } from "@/platform/core/types/event";
import type { RsvpRecord } from "@/platform/engines/rsvp/schema";
import { buildCalendarDetails, generateIcsContent } from "@/lib/calendar/event-calendar";

export type RsvpConfirmationEmailParams = {
  event: EventConfig;
  record: RsvpRecord;
  registrationReference: string;
};

export function buildRsvpConfirmationEmail({
  event,
  record,
  registrationReference,
}: RsvpConfirmationEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Registration confirmed — ${event.name}`;
  const eventDate = event.heroDateDisplay ?? event.heroDateLine;
  const mapsUrl = event.venue?.mapsUrl ?? `https://maps.google.com/?q=${encodeURIComponent(event.location)}`;

  const text = [
    `Dear ${record.full_name},`,
    "",
    `Thank you for registering for ${event.name}.`,
    "",
    `Registration reference: ${registrationReference}`,
    `Event date: ${eventDate}`,
    `Venue: ${event.venue?.name ?? event.location}`,
    `Guests: ${record.number_of_attendees}`,
    `Ticket type: ${record.ticket_type}`,
    "",
    `View on map: ${mapsUrl}`,
    "",
    `If you have questions, contact us at ${event.contact.email}.`,
    "",
    `Warm regards,`,
    event.organisation,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="font-family:'Georgia',serif;background:#faf6ef;color:#24150f;padding:32px 16px;margin:0">
  <div style="max-width:600px;margin:0 auto">
    <div style="background:linear-gradient(135deg,#24150f,#0f0806);border-radius:20px 20px 0 0;padding:32px;text-align:center">
      <p style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#e4c76a;margin:0 0 8px">${escapeHtml(event.organisation)}</p>
      <h1 style="font-size:28px;margin:0;color:#faf6ef;font-weight:600">${escapeHtml(event.name)}</h1>
    </div>
    <div style="background:#fff;border:1px solid #e8dfd0;border-top:none;border-radius:0 0 20px 20px;padding:32px">
      <h2 style="font-size:22px;margin:0 0 8px;color:#24150f">Thank you, ${escapeHtml(record.full_name)}</h2>
      <p style="line-height:1.7;color:#3a2419;margin:0 0 24px">Your registration has been received. We look forward to celebrating with you.</p>

      <div style="background:#faf6ef;border:1px solid #e8dfd0;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8a6f38;margin:0 0 12px">Registration details</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#8a6f38">Reference</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#24150f">${escapeHtml(registrationReference)}</td></tr>
          <tr><td style="padding:6px 0;color:#8a6f38">Date</td><td style="padding:6px 0;text-align:right">${escapeHtml(eventDate)}</td></tr>
          <tr><td style="padding:6px 0;color:#8a6f38">Venue</td><td style="padding:6px 0;text-align:right">${escapeHtml(event.venue?.name ?? event.location)}</td></tr>
          <tr><td style="padding:6px 0;color:#8a6f38">Guests</td><td style="padding:6px 0;text-align:right">${record.number_of_attendees}</td></tr>
          <tr><td style="padding:6px 0;color:#8a6f38">Ticket type</td><td style="padding:6px 0;text-align:right">${escapeHtml(record.ticket_type)}</td></tr>
        </table>
      </div>

      <div style="text-align:center;margin:28px 0">
        <a href="${mapsUrl}" style="display:inline-block;background:#c9a227;color:#0f0806;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:13px;font-weight:600;letter-spacing:0.05em;margin:4px">View on Google Maps</a>
      </div>

      <p style="font-size:13px;line-height:1.7;color:#3a2419;text-align:center">
        Add this event to your calendar using the attached .ics file, or save the date for ${escapeHtml(eventDate)}.
      </p>

      <hr style="border:none;border-top:1px solid #e8dfd0;margin:28px 0">
      <p style="font-size:13px;color:#8a6f38;text-align:center;margin:0">
        Questions? <a href="mailto:${escapeHtml(event.contact.email)}" style="color:#7a5c1e">${escapeHtml(event.contact.email)}</a>
      </p>
    </div>
    <p style="text-align:center;font-size:11px;color:#8a6f38;margin-top:16px">© ${new Date().getFullYear()} ${escapeHtml(event.organisation)}</p>
  </div>
</body>
</html>`.trim();

  return { subject, html, text };
}

export function buildRsvpConfirmationAttachments(
  event: EventConfig,
): { filename: string; content: string }[] {
  const calendar = buildCalendarDetails(event);
  return [
    {
      filename: "yoruba-day-canberra-2026.ics",
      content: generateIcsContent(calendar),
    },
  ];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
