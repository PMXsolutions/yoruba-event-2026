import type { EventConfig } from "@/platform/core/types/event";
import type { RsvpRecord } from "@/platform/engines/rsvp/schema";

export type RsvpConfirmationEmailParams = {
  event: EventConfig;
  record: RsvpRecord;
};

export function buildRsvpConfirmationEmail({ event, record }: RsvpConfirmationEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Interest registered — ${event.name}`;

  const text = [
    `Dear ${record.full_name},`,
    "",
    `Thank you for registering your interest in ${event.name}.`,
    "",
    `We have received your details:`,
    `• Guests: ${record.number_of_attendees}`,
    `• Preferred ticket type: ${record.ticket_type}`,
    "",
    event.launchCopy.comingSoonNote,
    "",
    `If you have questions, contact us at ${event.contact.email}.`,
    "",
    `Warm regards,`,
    event.organisation,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Georgia,serif;background:#faf6ef;color:#24150f;padding:32px 16px;margin:0">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8dfd0;border-radius:16px;padding:32px">
    <p style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#8a6f38;margin:0 0 8px">${event.organisation}</p>
    <h1 style="font-size:24px;margin:0 0 16px;color:#24150f">Thank you, ${escapeHtml(record.full_name)}</h1>
    <p style="line-height:1.7;color:#3a2419">Your interest in <strong>${escapeHtml(event.name)}</strong> has been received.</p>
    <table style="width:100%;margin:24px 0;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#8a6f38;font-size:13px">Guests</td><td style="padding:8px 0;text-align:right">${record.number_of_attendees}</td></tr>
      <tr><td style="padding:8px 0;color:#8a6f38;font-size:13px">Ticket type</td><td style="padding:8px 0;text-align:right">${escapeHtml(record.ticket_type)}</td></tr>
    </table>
    <p style="line-height:1.7;color:#3a2419;font-size:14px">${escapeHtml(event.launchCopy.comingSoonNote)}</p>
    <p style="margin-top:24px;font-size:14px;color:#3a2419">Questions? <a href="mailto:${escapeHtml(event.contact.email)}" style="color:#7a5c1e">${escapeHtml(event.contact.email)}</a></p>
  </div>
</body>
</html>`.trim();

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
