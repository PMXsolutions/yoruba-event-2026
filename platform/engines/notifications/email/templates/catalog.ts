/**
 * Event communication HTML template registry.
 * Only Register Interest Confirmation is auto-dispatched today.
 * Remaining templates are reusable stubs for future modules.
 */

import type { EventConfig } from "@/platform/core/types/event";
import { buildRsvpConfirmationEmail } from "@/platform/engines/notifications/email/templates/rsvp-confirmation";
import {
  escapeHtml,
  eventWebsiteUrl,
  resolveEmailPalette,
  type BuiltEmail,
  type TemplateMeta,
} from "@/platform/engines/notifications/email/templates/shared";
import type { RsvpRecord } from "@/platform/engines/rsvp/schema";

export const EMAIL_TEMPLATE_CATALOG: readonly TemplateMeta[] = [
  {
    id: "register-interest-confirmation",
    name: "Register Interest Confirmation",
    description: "Sent after a successful Register Interest submission.",
    autoActive: true,
  },
  {
    id: "ticket-sales-open",
    name: "Ticket Sales Open",
    description: "Announce that ticketing is live.",
    autoActive: false,
  },
  {
    id: "ticket-confirmation",
    name: "Ticket Confirmation",
    description: "Confirm a paid ticket purchase.",
    autoActive: false,
  },
  {
    id: "seat-qr-assignment",
    name: "Seat / QR Assignment",
    description: "Share seating and QR check-in details.",
    autoActive: false,
  },
  {
    id: "event-reminder",
    name: "Event Reminder",
    description: "Pre-event reminder with logistics.",
    autoActive: false,
  },
  {
    id: "volunteer-confirmation",
    name: "Volunteer Confirmation",
    description: "Confirm volunteer interest or shift assignment.",
    autoActive: false,
  },
  {
    id: "sponsor-thank-you",
    name: "Sponsor Thank You",
    description: "Thank a sponsor after enquiry or package confirmation.",
    autoActive: false,
  },
  {
    id: "post-event-thank-you",
    name: "Post Event Thank You",
    description: "Thank guests after the celebration.",
    autoActive: false,
  },
] as const;

function stubEmail(
  event: EventConfig,
  title: string,
  body: string,
  subjectPrefix: string,
): BuiltEmail {
  const palette = resolveEmailPalette(event);
  const website = eventWebsiteUrl(event);
  const subject = `${subjectPrefix} — ${event.name}`;
  const text = [
    event.name,
    "",
    title,
    "",
    body,
    "",
    website,
    "",
    `Powered by ${event.platformBrand}`,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:${palette.cream};font-family:Georgia,serif;color:#24150f;">
  <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:${palette.surface};border:1px solid ${palette.border};border-radius:16px;">
    <tr><td style="background:${palette.espresso};padding:24px;text-align:center;">
      <h1 style="margin:0;color:${palette.cream};font-size:22px;">${escapeHtml(event.name)}</h1>
    </td></tr>
    <tr><td style="padding:28px;">
      <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${palette.goldMuted};">Template ready</p>
      <p style="margin:0 0 12px;font-size:22px;">${escapeHtml(title)}</p>
      <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:${palette.bodyText};">${escapeHtml(body)}</p>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;"><a href="${escapeHtml(website)}" style="color:${palette.goldMuted};">${escapeHtml(website)}</a></p>
    </td></tr>
    <tr><td style="padding:16px;text-align:center;border-top:1px solid ${palette.border};font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#a89070;">
      Powered by ${escapeHtml(event.platformBrand)}
    </td></tr>
  </table>
</body>
</html>`.trim();

  return { subject, html, text };
}

export function buildTicketSalesOpenEmail(event: EventConfig): BuiltEmail {
  return stubEmail(
    event,
    "Ticket Sales Are Open",
    `Tickets for ${event.name} are now available. This template is ready for activation when ticketing goes live.`,
    "Tickets open",
  );
}

export function buildTicketConfirmationEmail(event: EventConfig, guestName = "Guest"): BuiltEmail {
  return stubEmail(
    event,
    "Ticket Confirmed",
    `Dear ${guestName}, your ticket for ${event.name} is confirmed. Activate this template with the ticketing module.`,
    "Ticket confirmed",
  );
}

export function buildSeatQrAssignmentEmail(event: EventConfig): BuiltEmail {
  return stubEmail(
    event,
    "Your Seat & QR Code",
    `Your seating and check-in QR for ${event.name} will appear here once the seating module is live.`,
    "Seat assignment",
  );
}

export function buildEventReminderEmail(event: EventConfig): BuiltEmail {
  return stubEmail(
    event,
    "Event Reminder",
    `A friendly reminder that ${event.name} is approaching. Logistics and arrival details will be filled in when reminders are enabled.`,
    "Reminder",
  );
}

export function buildVolunteerConfirmationEmail(event: EventConfig): BuiltEmail {
  return stubEmail(
    event,
    "Volunteer Interest Received",
    `Thank you for offering to volunteer at ${event.name}. Role assignments will follow once the programme is confirmed.`,
    "Volunteer interest",
  );
}

export function buildSponsorThankYouEmail(event: EventConfig): BuiltEmail {
  return stubEmail(
    event,
    "Thank You, Sponsor",
    `Thank you for your interest in supporting ${event.name}. Packages and next steps will be shared when sponsorship opens.`,
    "Sponsor thank you",
  );
}

export function buildPostEventThankYouEmail(event: EventConfig): BuiltEmail {
  return stubEmail(
    event,
    "Thank You for Celebrating With Us",
    `Thank you for being part of ${event.name}. We hope to welcome you again soon.`,
    "Thank you",
  );
}

/** Active auto-dispatch builder for Register Interest. */
export function buildActiveRsvpConfirmation(
  event: EventConfig,
  record: RsvpRecord,
): BuiltEmail {
  return buildRsvpConfirmationEmail({ event, record });
}
