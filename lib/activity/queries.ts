import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { formatActivityLabel } from "@/lib/activity/labels";

export type ActivityTimelineItem = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  label: string;
};

export { formatActivityLabel } from "@/lib/activity/labels";

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
