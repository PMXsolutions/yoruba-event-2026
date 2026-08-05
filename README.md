# Promax Event Platform

**Version 1.0.0** — reusable event management SaaS  
**First deployment:** Yoruba Day Canberra 2026

Built with Next.js 16, TypeScript, Tailwind CSS v4, Supabase Auth, PostgreSQL, Framer Motion, Zod, Resend, and Server Actions.

> This repository is the **Promax Event Platform**, not a one-off website. Yoruba Day Canberra 2026 is the first customer configuration under `config/events/`.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # Supabase + Resend + admin bootstrap vars
# Apply SQL migrations in supabase/migrations/ (Supabase SQL editor or CLI)
node --env-file=.env.local scripts/provision-admin.mjs
npm run preview
```

Open [http://localhost:3000](http://localhost:3000)  
Committee portal: [/login](http://localhost:3000/login) → [/dashboard](http://localhost:3000/dashboard)

Initial administrator email: `admin@promaxevent.com` (password via `ADMIN_PASSWORD` env — never commit it).

---

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/PLATFORM.md](./docs/PLATFORM.md) | Platform overview & engines |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Vercel + Supabase deploy |
| [docs/PRODUCTION_CHECKLIST.md](./docs/PRODUCTION_CHECKLIST.md) | Go-live env + smoke test checklist |
| [docs/EMAIL.md](./docs/EMAIL.md) | Resend / confirmation emails |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Phases & status |
| [docs/SMS.md](./docs/SMS.md) | Twilio architecture (future) |
| [docs/AI.md](./docs/AI.md) | AI engine architecture (future) |
| [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Dev workflow |

---

## Architecture

```
config/events/<slug>/     Event branding & content (EVENT_SLUG)
platform/core/            Types + active event resolver
platform/engines/         RSVP, sponsors, volunteers, tasks, programme,
                          announcements, notifications, dashboard
app/                      Routes, server actions, API
components/               Public site + enterprise dashboard UI
lib/                      Supabase clients, auth/RBAC, calendar, security
supabase/migrations/      Ordered PostgreSQL + RLS migrations
```

Operational data lives in **Supabase**. Marketing/branding content lives in **event configuration**. There is no production demo-data fallback.

---

## Environment variables

See `.env.example`. Required for production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `RESEND_API_KEY`
- `MAIL_FROM` (or legacy `RESEND_FROM_EMAIL`)
- `EVENT_SLUG` (optional; defaults to `yoruba-day-canberra-2026`)

Never put secrets in `NEXT_PUBLIC_*` or source control.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run preview` | Build + start |
| `npm run lint` | ESLint |
| `node --env-file=.env.local scripts/provision-admin.mjs` | Create/update SUPER_ADMIN |

---

## Health

`GET /api/health` — verifies env presence, event config, Supabase connectivity, and email configuration status (presence only).  
`POST /api/health/rsvp-insert-test` — development-only unless `ENABLE_RSVP_INSERT_TEST=true`.
