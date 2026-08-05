"use client";

import type { ActivityTimelineItem } from "@/lib/activity/queries";

function formatShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Reusable activity timeline for RSVP, sponsor, volunteer, task, etc. */
export function ActivityTimeline({
  items,
  loading,
  emptyFallback,
}: {
  items: ActivityTimelineItem[];
  loading?: boolean;
  emptyFallback?: string;
}) {
  return (
    <div className="rounded-xl border border-mahogany/[0.06] bg-cream/30 p-4">
      <p className="font-sans text-[0.65rem] font-bold uppercase tracking-wide text-mahogany/40">
        Activity timeline
      </p>
      <ul className="mt-3 space-y-3 font-sans text-sm text-mahogany/65" aria-live="polite">
        {loading ? (
          <li className="text-mahogany/45">Loading activity…</li>
        ) : items.length === 0 ? (
          <li className="text-mahogany/45">{emptyFallback ?? "No activity recorded yet."}</li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="flex gap-2">
              <span className="text-gold-deep" aria-hidden>
                ·
              </span>
              <span>
                {item.label}
                <span className="text-mahogany/40"> — {formatShort(item.createdAt)}</span>
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
