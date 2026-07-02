/**
 * Backward-compatible re-exports.
 * New code should import from @/config/events/yoruba-day-canberra-2026 or platform/core.
 */
export {
  SITE,
  LAUNCH_COPY,
  NAV_ITEMS,
  EXPERIENCE_ITEMS,
  SPONSOR_TIERS,
  TICKET_TYPES,
  SOCIAL_LINKS,
  GALLERY_FALLBACK,
} from "@/config/events/yoruba-day-canberra-2026";

export { yorubaDayCanberra2026 as ACTIVE_EVENT } from "@/config/events/yoruba-day-canberra-2026";

export type { NavItem } from "@/platform/core/types/event";
