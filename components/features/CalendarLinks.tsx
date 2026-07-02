"use client";

import type { EventConfig } from "@/platform/core/types/event";
import {
  appleCalendarAction,
  buildCalendarDetails,
  downloadIcsFile,
  googleCalendarUrl,
  outlookCalendarUrl,
} from "@/lib/calendar/event-calendar";

type CalendarLinksProps = {
  event: Pick<EventConfig, "name" | "tagline" | "eventIso" | "location" | "venue" | "canonicalUrl" | "organisation">;
  compact?: boolean;
};

const linkClass =
  "inline-flex items-center justify-center rounded-full border border-gold/25 bg-mahogany/40 px-4 py-2 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-gold-light transition-colors hover:border-gold-bright/50 hover:bg-mahogany/60 hover:text-cream";

export function CalendarLinks({ event, compact = false }: CalendarLinksProps) {
  const details = buildCalendarDetails(event as EventConfig);

  const links = [
    { label: "Download ICS", onClick: () => downloadIcsFile(details) },
    { label: "Google", href: googleCalendarUrl(details) },
    { label: "Outlook", href: outlookCalendarUrl(details) },
    { label: "Apple", onClick: () => appleCalendarAction(details) },
  ];

  return (
    <div
      className={`flex flex-wrap gap-2 ${compact ? "" : "justify-center"}`}
      role="group"
      aria-label="Add to calendar"
    >
      {links.map((link) =>
        link.href ? (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {link.label}
          </a>
        ) : (
          <button key={link.label} type="button" onClick={link.onClick} className={linkClass}>
            {link.label}
          </button>
        ),
      )}
    </div>
  );
}
