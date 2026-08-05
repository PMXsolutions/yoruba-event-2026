# Architecture

Promax Event Platform — technical architecture (v1)

---

## System overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Vercel / Next.js 16                          │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ Public site  │  │ Committee portal │  │ API / Actions    │  │
│  │ (event config)│  │ /dashboard/*     │  │ RSVP, CRM, health│  │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬─────────┘  │
│         │                   │                      │             │
│  ┌──────┴───────────────────┴──────────────────────┴─────────┐  │
│  │              Promax Platform Engines                       │  │
│  │  RSVP · Sponsors · Volunteers · Tasks · Programme          │  │
│  │  Announcements · Notifications · Dashboard / Analytics     │  │
│  └──────┬───────────────────────────────┬────────────────────┘  │
└─────────┼───────────────────────────────┼───────────────────────┘
          │                               │
          ▼                               ▼
   ┌─────────────┐                 ┌─────────────┐
   │  Supabase   │                 │   Resend    │
   │  Auth + DB  │                 │   (email)   │
   │  + RLS      │                 └─────────────┘
   └─────────────┘
```

---

## Separation of concerns

| Layer | Path | Purpose |
|-------|------|---------|
| Event config | `config/events/<slug>/` | Customer branding, date, venue, tickets, SEO |
| Platform core | `platform/core/` | Types, active event resolver (`EVENT_SLUG`) |
| Platform engines | `platform/engines/` | Reusable business logic |
| Auth | `lib/auth/`, `middleware.ts` | Session + RBAC |
| App routes | `app/` | Pages, actions, API |
| Components | `components/` | UI |
| Infrastructure | `lib/supabase/` | Browser, SSR, and service-role clients |

**Rule:** If another organisation could use it → platform engine. If Yoruba-specific → event config.

---

## Authentication & authorization

1. Supabase Auth email/password at `/login`
2. Middleware protects `/dashboard/*` and redirects unauthenticated users to `/login`
3. `profiles` table stores role: `SUPER_ADMIN` | `ADMIN` | `COMMITTEE` | `VOLUNTEER`
4. Server actions call `requireAuth(permission)` before mutating data
5. RLS policies restrict direct table access; public writes go through validated service-role server actions

Initial admin: `admin@promaxevent.com` via `scripts/provision-admin.mjs` (password from env only).

---

## Data model (conceptual)

```
Event (slug)
 ├── RSVPs
 ├── Sponsors
 ├── Volunteers
 ├── Tasks
 ├── Programme items
 ├── Announcements
 └── Activity logs
```

Every operational row carries `event_slug` for multi-event readiness. Full multi-tenancy is not enabled yet.

---

## RSVP flow

1. Public form → Zod validation → rate limit
2. `submitRsvp` Server Action → RSVP Engine insert (service role)
3. Unique `registration_reference` generated
4. Notification Engine sends Resend confirmation (non-blocking)
5. Success UI shows reference; CRM lists live rows

Statuses: `new` → `contacted` → `confirmed` | `cancelled`

---

## Email architecture

```
dispatchRsvpNotifications()
  └── sendRsvpConfirmationEmail()   # transport (Resend HTTP)
        └── buildRsvpConfirmationEmail()  # template
```

Failures are logged server-side without exposing credentials. RSVP persistence never depends on email success.

---

## Public forms abuse protection

- In-memory rate limiting (`lib/security/rate-limit.ts`)
- Soft duplicate prevention (same email + event within 24h for RSVP)
- Architecture ready for CAPTCHA without changing form contracts

---

## Multi-event strategy

| Phase | Mechanism |
|-------|-----------|
| Now | `EVENT_SLUG` + TypeScript registry + `event_slug` columns |
| Next | Subdomain / path routing, shared auth org model |
