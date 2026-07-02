# Architecture

Promax Event Platform — technical architecture (v1)

---

## System overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Vercel / Next.js 16                          │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ Public site  │  │ Committee portal │  │ API / Actions    │  │
│  │ (event config)│  │ /dashboard/*     │  │ RSVP, health     │  │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬─────────┘  │
│         │                   │                      │             │
│  ┌──────┴───────────────────┴──────────────────────┴─────────┐  │
│  │              Promax Platform Engines                       │  │
│  │  RSVP · Notifications · Dashboard · AI (registry)         │  │
│  └──────┬───────────────────────────────┬────────────────────┘  │
└─────────┼───────────────────────────────┼───────────────────────┘
          │                               │
          ▼                               ▼
   ┌─────────────┐                 ┌─────────────┐
   │  Supabase   │                 │   Resend    │
   │  (Postgres) │                 │   (email)   │
   └─────────────┘                 └─────────────┘
```

---

## Separation of concerns

| Layer | Path | Purpose |
|-------|------|---------|
| Event config | `config/events/<slug>/` | Customer branding, copy, ticket types |
| Platform core | `platform/core/` | Types, active event resolver |
| Platform engines | `platform/engines/` | Reusable business logic |
| App routes | `app/` | Next.js pages, actions, API |
| Components | `components/` | UI |
| Infrastructure | `lib/supabase/` | Database clients |

**Rule:** If another organisation could use it → platform engine. If Yoruba-specific → event config.

---

## RSVP flow

1. Client form validates via `createRsvpFormSchema(ticketTypes)`
2. `submitRsvp` Server Action resolves `EventConfig` via `getActiveEventConfig()`
3. **RSVP Engine** validates + inserts via service role
4. **Notification Engine** sends Resend confirmation (non-blocking)
5. Success returned to client

---

## Multi-event strategy

| Phase | Mechanism |
|-------|-----------|
| v1 | `EVENT_SLUG` env var → `EVENT_REGISTRY` |
| v2 | Subdomain → slug mapping |
| v3 | Tenant ID column on all tables + RLS |

---

## Committee portal

`/dashboard/*` — Dashboard Engine UI with placeholder data. Auth required before production (Phase 2).

Modules: Executive, RSVPs, Sponsors, Volunteers, Tasks, Programme, Announcements, Analytics, Settings.

---

## Security

- Service role: `server-only`, never client-bundled
- RLS on `rsvps`, no anon policies
- Email/SMS: server-side only, non-blocking
- Dashboard: unauthenticated scaffold — do not expose publicly

---

## Related

- [PLATFORM.md](./PLATFORM.md) — engine catalogue
- [EMAIL.md](./EMAIL.md) — Resend
- [PHASE_2_SPEC.md](./PHASE_2_SPEC.md) — auth + live dashboard
