# Promax Event Platform

**Version 1** — multi-event SaaS foundation  
**First deployment:** Yoruba Day Canberra 2026

---

## What this is

This repository is **not** a one-off website. It is Version 1 of the **Promax Event Platform** — reusable event management software for churches, cultural associations, conferences, schools, charities, festivals, and corporate events.

Yoruba Day Canberra 2026 is the **first customer configuration**, isolated under `config/events/`.

---

## Architecture layers

```
config/events/          Event-specific branding & content (per customer)
platform/
  core/                 Types, active event resolver
  engines/
    rsvp/               RSVP validation, persistence, errors
    notifications/      Email (Resend), SMS stub (Twilio)
    dashboard/          Portal navigation & placeholder data
    ai/                 AI capability registry (no API calls v1)
app/                    Next.js routes (public + committee portal)
components/             UI (public sections + dashboard)
lib/                    Legacy re-exports + Supabase clients
```

---

## Engines (v1 status)

| Engine | Status | Location |
|--------|--------|----------|
| Event Engine | ✅ Config-driven | `platform/core/` |
| RSVP Engine | ✅ Live | `platform/engines/rsvp/` |
| Notification Engine (email) | ✅ Resend-ready | `platform/engines/notifications/` |
| Notification Engine (SMS) | 📋 Architecture only | `docs/SMS.md` |
| Dashboard Engine | ✅ UI + placeholders | `platform/engines/dashboard/` |
| Sponsor CRM | 📋 Scaffold | `/dashboard/sponsors` |
| Volunteer CRM | 📋 Scaffold | `/dashboard/volunteers` |
| Committee CRM | 📋 Scaffold | `/dashboard/tasks` |
| Programme Engine | 📋 Scaffold | `/dashboard/programme` |
| Analytics Engine | 📋 Scaffold | `/dashboard/analytics` |
| AI Engine | 📋 Registry only | `platform/engines/ai/` |
| Ticketing | ❌ Phase 4 | `docs/ROADMAP.md` |
| Check-in | ❌ Phase 4 | `docs/ROADMAP.md` |
| CMS | ❌ Future | Content in event config for now |

---

## Multi-event / multi-tenancy path

1. **Today:** Single deployment, `EVENT_SLUG` defaults to `yoruba-day-canberra-2026`
2. **Next:** Add events to `EVENT_REGISTRY` in `platform/core/config/active-event.ts`
3. **Future:** Subdomain routing (`yoruba.promax.events`), tenant DB column, org billing

---

## Adding a new event

1. Create `config/events/<slug>/index.ts` implementing `EventConfig`
2. Register in `EVENT_REGISTRY`
3. Deploy with `EVENT_SLUG=<slug>`
4. Run Supabase migration (shared or per-tenant schema TBD)

---

## Committee portal

Routes under `/dashboard/*` — **Event Command Centre** with enterprise UI.

**Current status:** RSVP management at `/dashboard/rsvps` reads live Supabase data (server-side). Other modules use placeholder data. **Not authenticated** — protect before public launch.

**Next staged modules:** Sponsors CRM, Volunteers, Tasks, Programme — see `docs/PHASE_2_SPEC.md`.
- Add Supabase Auth + RBAC middleware on all `/dashboard/*` routes
- Replace placeholder data with protected server-side queries
- Remove or hide public demo links

See `docs/PHASE_2_SPEC.md` for auth roadmap.

---

## Related docs

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [EMAIL.md](./EMAIL.md)
- [SMS.md](./SMS.md)
- [AI.md](./AI.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [ROADMAP.md](./ROADMAP.md)
