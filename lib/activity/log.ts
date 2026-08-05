import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";

export type ActivityLogInput = {
  eventSlug: string;
  action: string;
  entityType?: string;
  entityId?: string;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
};

/** Best-effort activity log — never throws to callers. */
export async function logActivity(input: ActivityLogInput): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("activity_logs").insert({
      event_slug: input.eventSlug,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      actor_id: input.actorId ?? null,
      metadata: input.metadata ?? {},
    });
    if (error) {
      console.warn("[activity-log] Insert failed:", error.message);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[activity-log] Unexpected error:", msg);
  }
}
