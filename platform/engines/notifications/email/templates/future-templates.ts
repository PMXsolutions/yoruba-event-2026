/**
 * Future email templates — draft copy only.
 * Do not wire automatic sends until committee approves content and triggers.
 */

import type { EventConfig } from "@/platform/core/types/event";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type FutureEmailDraft = {
  subject: string;
  html: string;
  text: string;
  status: "draft";
};

export function buildTicketInvitationEmail(event: EventConfig, guestName: string): FutureEmailDraft {
  const subject = `Ticket invitation — ${event.name} (coming soon)`;
  const text = [
    `Dear ${guestName},`,
    "",
    `Ticketing for ${event.name} will open soon. This is a draft template only.`,
    "Do not treat this message as a live invitation until the committee approves send.",
    "",
    `Powered by ${event.platformBrand}`,
  ].join("\n");
  return {
    status: "draft",
    subject,
    text,
    html: `<p>Dear ${escapeHtml(guestName)},</p><p>Ticketing for <strong>${escapeHtml(event.name)}</strong> will open soon. <em>Draft template — not live.</em></p>`,
  };
}

export function buildSeatingQrConfirmationEmail(
  event: EventConfig,
  guestName: string,
): FutureEmailDraft {
  const subject = `Your seat details — ${event.name} (coming soon)`;
  const text = [
    `Dear ${guestName},`,
    "",
    "Your table, seat and QR check-in details will be shared here once seating is finalised.",
    "Draft template — not live.",
    "",
    `Powered by ${event.platformBrand}`,
  ].join("\n");
  return {
    status: "draft",
    subject,
    text,
    html: `<p>Dear ${escapeHtml(guestName)},</p><p>Seat and QR details for <strong>${escapeHtml(event.name)}</strong> will appear here. <em>Draft template — not live.</em></p>`,
  };
}

export function buildEventReminderEmail(event: EventConfig, guestName: string): FutureEmailDraft {
  const subject = `Reminder — ${event.name} (coming soon)`;
  const text = [
    `Dear ${guestName},`,
    "",
    `A friendly reminder about ${event.name}. Exact doors and programme times will be confirmed later.`,
    "Draft template — not live.",
  ].join("\n");
  return {
    status: "draft",
    subject,
    text,
    html: `<p>Dear ${escapeHtml(guestName)},</p><p>Reminder for <strong>${escapeHtml(event.name)}</strong>. <em>Draft template — not live.</em></p>`,
  };
}

export function buildThankYouEmail(event: EventConfig, guestName: string): FutureEmailDraft {
  const subject = `Thank you — ${event.name} (coming soon)`;
  const text = [
    `Dear ${guestName},`,
    "",
    `Thank you for celebrating with us at ${event.name}.`,
    "Draft template — not live.",
  ].join("\n");
  return {
    status: "draft",
    subject,
    text,
    html: `<p>Dear ${escapeHtml(guestName)},</p><p>Thank you for joining <strong>${escapeHtml(event.name)}</strong>. <em>Draft template — not live.</em></p>`,
  };
}
