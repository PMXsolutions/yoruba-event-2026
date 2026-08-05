# Platform overview

Promax Event Platform v1 — reusable engines powering Yoruba Day Canberra 2026.

---

## Engines

| Engine | Path | Status |
|--------|------|--------|
| Active event | `platform/core/config/active-event.ts` | Live |
| RSVP | `platform/engines/rsvp/` | Live (Supabase + CRM) |
| Sponsors | `platform/engines/sponsors/` | Live |
| Volunteers | `platform/engines/volunteers/` | Live |
| Tasks | `platform/engines/tasks/` | Live |
| Programme | `platform/engines/programme/` | Live (operational DB) |
| Announcements | `platform/engines/announcements/` | Live |
| Notifications | `platform/engines/notifications/` | Live (Resend) |
| Dashboard / analytics | `platform/engines/dashboard/` | Live |
| AI | `platform/engines/ai/` | Planned registry only |
| SMS | `platform/engines/notifications/sms/` | Stub |

---

## Event configuration

Active event resolved by `EVENT_SLUG` (default `yoruba-day-canberra-2026`).

Config includes: name, slug, tagline, date/time/timezone, venue, calendar, contact, social, hero copy, experience, sponsor tiers, ticket types, SEO, platform brand.

Stable marketing content (hero, experience) stays in config. Committee-editable operational content (programme items, announcements) lives in Supabase.

---

## Committee portal modules

| Route | Data source |
|-------|-------------|
| `/dashboard` | Live aggregates |
| `/dashboard/rsvps` | `rsvps` |
| `/dashboard/sponsors` | `sponsors` |
| `/dashboard/volunteers` | `volunteers` |
| `/dashboard/tasks` | `tasks` |
| `/dashboard/programme` | `programme_items` |
| `/dashboard/announcements` | `announcements` |
| `/dashboard/analytics` | Aggregated Supabase queries |
| `/dashboard/settings` | Event config + env presence |

Empty states are shown when tables have no rows. Demo/fallback datasets are not used in production.

---

## Roles

| Role | Intent |
|------|--------|
| `SUPER_ADMIN` | Full access |
| `ADMIN` | Manage CRM + content |
| `COMMITTEE` | Day-to-day CRM + tasks |
| `VOLUNTEER` | Read-focused access |

Permission checks are enforced in server actions (`lib/auth/rbac.ts`) and mirrored in RLS helper functions.
