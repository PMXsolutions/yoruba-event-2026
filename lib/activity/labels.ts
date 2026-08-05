/** Pure activity label helpers — safe for client and tests. */

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
  "sponsor.created": "Sponsor interest received",
  "sponsor.committee_created": "Sponsor added by committee",
  "sponsor.updated": "Sponsor details edited",
  "sponsor.status_updated": "Sponsor status changed",
  "sponsor.note_updated": "Sponsor notes updated",
  "volunteer.created": "Volunteer interest received",
  "volunteer.committee_created": "Volunteer added by committee",
  "volunteer.updated": "Volunteer profile updated",
  "volunteer.status_updated": "Volunteer status changed",
  "task.created": "Task created",
  "task.updated": "Task updated",
  "task.deleted": "Task deleted",
  "programme.upserted": "Programme item saved",
  "programme.deleted": "Programme item deleted",
  "announcement.upserted": "Announcement saved",
  "announcement.published": "Announcement published",
  "announcement.unpublished": "Announcement unpublished",
  "announcement.archived": "Announcement archived",
  "user.role_updated": "User role updated",
  "seating.table_created": "Seating table created",
  "seating.table_updated": "Seating table updated",
  "seating.table_deleted": "Seating table deleted",
  "seating.unassigned": "Seat unassigned",
  "seating.floor_plan_saved": "Floor plan reference saved",
};

export function formatActivityLabel(action: string, metadata?: Record<string, unknown>): string {
  const base = ACTION_LABELS[action] ?? action.replace(/\./g, " · ");
  if (action.includes("status_updated") && metadata?.status) {
    return `${base} → ${String(metadata.status)}`;
  }
  if (action === "rsvp.tag_updated" && metadata?.tag) {
    const verb = metadata.added ? "added" : "removed";
    return `Tag ${verb}: ${String(metadata.tag)}`;
  }
  if (action === "rsvp.seat_assigned" && (metadata?.table || metadata?.seat)) {
    return `Seat assigned — ${[metadata.zone, metadata.table, metadata.seat].filter(Boolean).join(" · ")}`;
  }
  if (action === "user.role_updated" && metadata?.role) {
    return `Role set to ${String(metadata.role)}`;
  }
  return base;
}
