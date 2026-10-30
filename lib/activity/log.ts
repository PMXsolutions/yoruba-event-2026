import "server-only";

import { dbExec } from "@/lib/db/query";
import { isUuid, jsonText } from "@/lib/db/values";

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
    await dbExec(
      `INSERT INTO activity_logs (event_slug, action, entity_type, entity_id, actor_id, metadata)
       VALUES (@eventSlug, @action, @entityType, @entityId, @actorId, @metadata)`,
      {
        eventSlug: input.eventSlug,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: isUuid(input.entityId) ? input.entityId : null,
        actorId: isUuid(input.actorId) ? input.actorId : null,
        metadata: jsonText(input.metadata ?? {}),
      },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[activity-log] Unexpected error:", msg);
  }
}
