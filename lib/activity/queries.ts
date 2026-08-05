import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";

export type ActivityTimelineItem = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  label: string;
};

const ACTION_LABELS: Record<string, string> = {
  "rsvp.created": "Interest registered",
  "rsvp.committee_created": "Guest registered by committee",
  "rsvp.updated": "Guest details edited",
  "rsvp.status_updated": "Status changed",
  "rsvp.note_updated": "Committee note updated",
  "rsvp.tag_updated": "Tags updated",
  "rsvp.email_attempted": "Confirmation email attempted",
  "rsvp.email_sent": "Confirmation email sent",
  "rsvp.email_failed": "Confirmation email failed",
  "rsvp.email_resent": "Confirmation email resent",
  "rsvp.seat_assigned": "Seat assigned",
  "rsvp.qr_generated": "QR generated",
  "rsvp.checked_in": "Checked in",
  "rsvp.check_in_undone": "Check-in undone",
};

export function formatActivityLabel(action: string, metadata?: Record<string, unknown>): string {
  const base = ACTION_LABELS[action] ?? action.replace(/\./g, " · ");
  if (action === "rsvp.status_updated" && metadata?.status) {
    return `${base} → ${String(metadata.status)}`;
  }
  if (action === "rsvp.tag_updated" && metadata?.tag) {
    const verb = metadata.added ? "added" : "removed";
    return `Tag ${verb}: ${String(metadata.tag)}`;
  }
  if (action === "rsvp.seat_assigned" && (metadata?.table || metadata?.seat)) {
    return `Seat assigned — ${[metadata.zone, metadata.table, metadata.seat].filter(Boolean).join(" · ")}`;
  }
  return base;
}

/** Fetch activity for a single entity (newest first). */
export async function fetchEntityActivity(
  entityType: string,
  entityId: string,
  limit = 50,
): Promise<ActivityTimelineItem[]> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("activity_logs")
      .select("id, action, entity_type, entity_id, metadata, created_at")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("[activity-queries] Fetch failed:", error.message);
      return [];
    }

    return (data ?? []).map((row) => {
      const metadata =
        row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : {};
      return {
        id: row.id as string,
        action: row.action as string,
        entityType: (row.entity_type as string | null) ?? null,
        entityId: (row.entity_id as string | null) ?? null,
        metadata,
        createdAt: row.created_at as string,
        label: formatActivityLabel(row.action as string, metadata),
      };
    });
  } catch (e) {
    console.warn("[activity-queries] Unexpected error:", e);
    return [];
  }
}
