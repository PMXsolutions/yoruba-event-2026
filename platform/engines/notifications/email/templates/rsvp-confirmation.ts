import type { EventConfig } from "@/platform/core/types/event";
import type { RsvpRecord } from "@/platform/engines/rsvp/schema";
import {
  escapeHtml,
  eventWebsiteUrl,
  firstNameFromFullName,
  formatEventDateLabel,
  resolveEmailPalette,
  type BuiltEmail,
  type RsvpEmailContext,
} from "@/platform/engines/notifications/email/templates/shared";

export type RsvpConfirmationEmailParams = RsvpEmailContext;

/**
 * Premium Register Interest Confirmation — EventConfig-driven branded HTML.
 * Responsive table layout for Gmail / Outlook / Apple Mail.
 */
export function buildRsvpConfirmationEmail({
  event,
  record,
}: RsvpConfirmationEmailParams): BuiltEmail {
  const palette = resolveEmailPalette(event);
  const website = eventWebsiteUrl(event);
  const dateLabel = formatEventDateLabel(event);
  const location = event.location;
  const firstName = firstNameFromFullName(record.full_name);
  const ctaLabel = `Visit ${event.name}`;

  const subject = `Your interest is registered — ${event.name}`;

  const text = [
    event.name,
    `Presented by ${event.presenter}`,
    "",
    `Your Interest Has Been Registered`,
    "",
    `Ẹ ṣé — thank you for registering your interest in ${event.name}.`,
    "",
    `Name: ${record.full_name}`,
    `Event: ${event.name}`,
    `Location: ${location}`,
    `Date: ${dateLabel}`,
    `Number of guests: ${record.number_of_attendees}`,
    `Ticket preference: ${record.ticket_type}`,
    "",
    "This registration confirms your interest only. Ticketing, sponsorship packages and the full programme will be announced shortly.",
    "",
    "Next steps:",
    "· Watch for ticket release updates",
    "· Programme announcements",
    "· Sponsor opportunities",
    "· Volunteer opportunities",
    "",
    `${ctaLabel}: ${website}`,
    "",
    event.organisation,
    event.contact.email,
    "",
    `Powered by ${event.platformBrand}`,
  ].join("\n");

  // Subtle geometric motif via CSS repeating-linear-gradient (email-safe).
  const patternBg = `background-color:${palette.espresso};background-image:repeating-linear-gradient(45deg,rgba(201,162,39,0.08) 0,rgba(201,162,39,0.08) 2px,transparent 2px,transparent 12px),repeating-linear-gradient(-45deg,rgba(201,162,39,0.05) 0,rgba(201,162,39,0.05) 1px,transparent 1px,transparent 10px);`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${palette.cream};font-family:Georgia,'Times New Roman',serif;color:#24150f;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${palette.cream};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${palette.surface};border:1px solid ${palette.border};border-radius:16px;overflow:hidden;">
          <!-- HEADER -->
          <tr>
            <td style="padding:28px 32px;text-align:center;${patternBg}">
              <h1 style="margin:0;font-size:26px;line-height:1.25;color:${palette.cream};font-weight:600;">${escapeHtml(event.name)}</h1>
              <p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:${palette.gold};">
                Presented by ${escapeHtml(event.presenter)}
              </p>
            </td>
          </tr>
          <!-- HERO -->
          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${palette.goldMuted};">Confirmation</p>
              <p style="margin:0 0 14px;font-size:24px;line-height:1.3;color:#24150f;">Your Interest Has Been Registered</p>
              <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${palette.bodyText};">
                Ẹ ṣé — thank you for registering your interest in <strong>${escapeHtml(event.name)}</strong>, ${escapeHtml(firstName)}.
              </p>
            </td>
          </tr>
          <!-- BODY DETAILS -->
          <tr>
            <td style="padding:0 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${palette.cream};border:1px solid ${palette.border};border-radius:12px;">
                <tr>
                  <td style="padding:18px 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${palette.bodyText};">
                    <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(record.full_name)}</p>
                    <p style="margin:0 0 8px;"><strong>Event:</strong> ${escapeHtml(event.name)}</p>
                    <p style="margin:0 0 8px;"><strong>Location:</strong> ${escapeHtml(location)}</p>
                    <p style="margin:0 0 8px;"><strong>Date:</strong> ${escapeHtml(dateLabel)}</p>
                    <p style="margin:0 0 8px;"><strong>Number of guests:</strong> ${record.number_of_attendees}</p>
                    <p style="margin:0;"><strong>Ticket preference:</strong> ${escapeHtml(record.ticket_type)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- IMPORTANT MESSAGE -->
          <tr>
            <td style="padding:20px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid ${palette.gold};background:#fffdf8;">
                <tr>
                  <td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:${palette.bodyText};">
                    <strong style="color:#24150f;">Important:</strong>
                    This registration confirms your interest only. Ticketing, sponsorship packages and the full programme will be announced shortly.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- NEXT STEPS -->
          <tr>
            <td style="padding:20px 32px 8px;">
              <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:${palette.goldMuted};">Next steps</p>
              <ul style="margin:0;padding:0 0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.8;color:${palette.bodyText};">
                <li>Watch for ticket release updates</li>
                <li>Programme announcements</li>
                <li>Sponsor opportunities</li>
                <li>Volunteer opportunities</li>
              </ul>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:24px 32px 28px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:999px;background:${palette.gold};">
                    <a href="${escapeHtml(website)}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.08em;text-decoration:none;color:${palette.espresso};">
                      ${escapeHtml(ctaLabel)}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background:${palette.cream};padding:20px 32px;text-align:center;border-top:1px solid ${palette.border};">
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#24150f;font-weight:600;">
                ${escapeHtml(event.organisation)}
              </p>
              <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:13px;">
                <a href="mailto:${escapeHtml(event.contact.email)}" style="color:${palette.goldMuted};text-decoration:none;">${escapeHtml(event.contact.email)}</a>
              </p>
              ${
                event.socialLinks.length > 0
                  ? `<p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${palette.goldMuted};">${event.socialLinks
                      .map(
                        (s) =>
                          `<a href="${escapeHtml(s.href)}" style="color:${palette.goldMuted};text-decoration:none;margin:0 6px;">${escapeHtml(s.label)}</a>`,
                      )
                      .join("")}</p>`
                  : `<p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${palette.goldMuted};">Social channels coming soon</p>`
              }
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#a89070;">
                Powered by ${escapeHtml(event.platformBrand)}
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

/** Build a concise premium SMS confirmation — never claims a ticket. */
export function buildRsvpConfirmationSms(event: EventConfig, record: RsvpRecord): string {
  const first = firstNameFromFullName(record.full_name);
  const link = eventWebsiteUrl(event);
  return `Ẹ ṣé, ${first}. Your interest in ${event.name} has been registered. Ticketing and programme updates are coming soon. Details: ${link}`;
}
