import type { EventConfig } from "@/platform/core/types/event";

export type CalendarEventDetails = {
  title: string;
  description: string;
  location: string;
  /** ICS UTC datetime e.g. 20261122T030000Z */
  startIcs: string;
  endIcs: string;
  url?: string;
};

export function buildCalendarDetails(event: EventConfig): CalendarEventDetails {
  const start = new Date(event.calendar.startIso);
  const end = new Date(event.calendar.endIso);

  return {
    title: event.name,
    description: `${event.tagline}\n\nPresented by ${event.organisation}`,
    location: event.venue.fullAddress || event.location,
    startIcs: toIcsUtc(start),
    endIcs: toIcsUtc(end),
    url: event.seo.canonicalUrl,
  };
}

function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function generateIcsContent(details: CalendarEventDetails, prodId: string): string {
  const uid = `${details.startIcs}@${prodId}`;
  const now = toIcsUtc(new Date());

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${prodId}//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${details.startIcs}`,
    `DTEND:${details.endIcs}`,
    `SUMMARY:${escapeIcsText(details.title)}`,
    `DESCRIPTION:${escapeIcsText(details.description)}`,
    `LOCATION:${escapeIcsText(details.location)}`,
    details.url ? `URL:${details.url}` : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function downloadIcsFile(
  details: CalendarEventDetails,
  filename: string,
  prodId: string,
): void {
  const content = generateIcsContent(details, prodId);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function googleCalendarUrl(details: CalendarEventDetails): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: details.title,
    dates: `${details.startIcs}/${details.endIcs}`,
    details: details.description,
    location: details.location,
  });
  if (details.url) params.set("sprop", `website:${details.url}`);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(details: CalendarEventDetails): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: details.title,
    body: details.description,
    location: details.location,
    startdt: icsToIsoLocal(details.startIcs),
    enddt: icsToIsoLocal(details.endIcs),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function icsToIsoLocal(icsDate: string): string {
  const y = icsDate.slice(0, 4);
  const m = icsDate.slice(4, 6);
  const d = icsDate.slice(6, 8);
  const h = icsDate.slice(9, 11);
  const min = icsDate.slice(11, 13);
  const s = icsDate.slice(13, 15);
  return `${y}-${m}-${d}T${h}:${min}:${s}Z`;
}
