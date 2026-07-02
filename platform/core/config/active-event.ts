import "server-only";

import type { EventConfig } from "@/platform/core/types/event";
import { yorubaDayCanberra2026 } from "@/config/events/yoruba-day-canberra-2026";

const EVENT_REGISTRY: Record<string, EventConfig> = {
  [yorubaDayCanberra2026.slug]: yorubaDayCanberra2026,
};

const DEFAULT_SLUG = yorubaDayCanberra2026.slug;

/**
 * Resolve the active event for this deployment.
 * Future: derive from subdomain, path prefix, or tenant header.
 */
export function getActiveEventSlug(): string {
  return process.env.EVENT_SLUG?.trim() || DEFAULT_SLUG;
}

export function getActiveEventConfig(): EventConfig {
  const slug = getActiveEventSlug();
  const config = EVENT_REGISTRY[slug];
  if (!config) {
    throw new Error(
      `Unknown EVENT_SLUG "${slug}". Registered events: ${Object.keys(EVENT_REGISTRY).join(", ")}`,
    );
  }
  return config;
}

/** Client-safe event config (public fields only). */
export function getPublicEventConfig(): EventConfig {
  return getActiveEventConfig();
}
