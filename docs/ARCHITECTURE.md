# Architecture

High-level technical architecture for the Yoruba Day Canberra 2026 digital platform.

---

## System overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel (host)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Next.js 16 App Router                    │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │ Public SPA  │  │ Server Action│  │ API Routes  │  │  │
│  │  │  (page.tsx) │  │ submitRsvp   │  │ /api/health │  │  │
│  │  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘  │  │
│  └─────────┼────────────────┼─────────────────┼─────────┘  │
└────────────┼────────────────┼─────────────────┼────────────┘
             │                │                 │
             │         Service role client       │
             │                │                 │
             ▼                ▼                 ▼
      ┌──────────────────────────────────────────────┐
      │              Supabase (Postgres)              │
      │                  public.rsvps                 │
      │         RLS enabled · no anon policies        │
      └──────────────────────────────────────────────┘
```

---

## Directory structure

| Path | Purpose |
|------|---------|
| `app/page.tsx` | Public homepage — composes all sections |
| `app/layout.tsx` | Root layout, fonts, metadata |
| `app/actions/rsvp.ts` | Server Action — validate + insert RSVP |
| `app/api/health/` | Operational health checks |
| `app/dashboard/` | Phase 2 scaffold (placeholder, no auth) |
| `components/sections/` | Hero, About, Experience, Sponsors, RSVP |
| `components/layout/` | Navbar, Footer |
| `components/dashboard/` | Dashboard shell (Phase 2) |
| `lib/site.ts` | Content constants, launch copy |
| `lib/supabase/admin.ts` | Service role client (`server-only`) |
| `lib/supabase/client.ts` | Browser client (reserved for future) |
| `lib/validation/rsvp.ts` | Zod schema |
| `supabase/migrations/` | SQL for manual / CLI migration |

---

## Data flow — Register Interest

1. User fills form in `components/sections/RSVP.tsx` (client component).
2. Client-side Zod validation runs before submit.
3. `submitRsvp` Server Action receives payload.
4. Server-side Zod validation runs again.
5. `createServiceRoleClient()` inserts into `public.rsvps`.
6. Service role bypasses RLS (intentional — no anon write policies).

---

## Security model

| Layer | Mechanism |
|-------|-----------|
| Secrets | `.env.local` / Vercel env vars; never committed |
| Service role | `server-only` import guard |
| Database | RLS on `rsvps`; zero policies for anon key |
| Validation | Zod on client + server |
| Dashboard | **Not protected yet** — Phase 2 auth required |

---

## Tech stack

- **Next.js 16** — App Router, Server Actions, Route Handlers
- **React 19** — UI
- **Tailwind CSS v4** — styling
- **Framer Motion** — animations
- **Zod 4** — validation
- **Supabase** — Postgres + REST API

---

## Future architecture (Phase 2+)

- Supabase Auth for `/dashboard` routes
- Row-level policies for organiser roles
- Edge middleware for rate limiting
- Email provider webhook for RSVP notifications
- Analytics script (Plausible / GA4)

See [PHASE_2_SPEC.md](./PHASE_2_SPEC.md) and [PHASE_3_SPEC.md](./PHASE_3_SPEC.md).
