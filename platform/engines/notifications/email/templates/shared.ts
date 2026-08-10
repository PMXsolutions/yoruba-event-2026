import type { EventConfig } from "@/platform/core/types/event";
import type { RsvpRecord } from "@/platform/engines/rsvp/schema";

/** Shared HTML email building helpers — EventConfig-driven, client-agnostic. */

export type EmailBrandingPalette = {
  espresso: string;
  cream: string;
  gold: string;
  goldMuted: string;
  bodyText: string;
  surface: string;
  border: string;
};

export function resolveEmailPalette(event: EventConfig): EmailBrandingPalette {
  const b = event.branding;
  return {
    espresso: b?.espresso ?? "#1a0f0a",
    cream: b?.cream ?? "#faf6ef",
    gold: b?.gold ?? "#c9a227",
    goldMuted: b?.goldMuted ?? "#8a6f38",
    bodyText: b?.bodyText ?? "#3a2419",
    surface: b?.surface ?? "#ffffff",
    border: b?.border ?? "#e8dfd0",
  };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function eventWebsiteUrl(event: EventConfig): string {
  return event.website?.trim() || event.seo.canonicalUrl;
}

export function formatEventDateLabel(event: EventConfig): string {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      month: "long",
      year: "numeric",
      timeZone: event.calendar.timezone,
    }).format(new Date(event.calendar.startIso));
  } catch {
    return event.heroDateLine;
  }
}

export function firstNameFromFullName(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0];
  return part || fullName;
}

export type BuiltEmail = {
  subject: string;
  html: string;
  text: string;
};

export type TemplateMeta = {
  id: string;
  name: string;
  description: string;
  /** Only Register Interest Confirmation is auto-dispatched today */
  autoActive: boolean;
};

export type RsvpEmailContext = {
  event: EventConfig;
  record: RsvpRecord;
};
