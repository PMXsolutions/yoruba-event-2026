# Yoruba Day Canberra 2026

Premium marketing site for **Yoruba Day Canberra 2026**, presented by **Yoruba Association Canberra**. Built with [Next.js](https://nextjs.org) (App Router), TypeScript, Tailwind CSS v4, and [Framer Motion](https://www.framer.com/motion/).

**Repository:** https://github.com/PMXsolutions/yoruba-event-2026

---

## Quick start

```bash
npm install
cp .env.example .env.local   # fill Supabase values
npm run preview              # recommended — build + serve on :3000
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** `npm run dev` may hang on first Turbopack compile. Use `npm run preview` for reliable local testing.

---

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Vercel + Supabase deploy steps |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design and data flow |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Phases 1–4, risks, launch checklist |
| [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Dev workflow, Git, Cursor |
| [docs/PHASE_2_SPEC.md](./docs/PHASE_2_SPEC.md) | Dashboard scaffold spec |
| [docs/PHASE_3_SPEC.md](./docs/PHASE_3_SPEC.md) | Email, analytics, SEO spec |

---

## Prerequisites

- Node.js 20+
- npm
- [Supabase](https://supabase.com) project (free tier)

---

## Environment variables

Copy `.env.example` → `.env.local` and set:

| Variable | Usage |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (`https://<ref>.supabase.co` only) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** — RSVP inserts |

Never commit `.env.local` or expose the service role key.

---

## Supabase setup

1. Create a Supabase project.
2. Run [`supabase/migrations/20260112000000_create_rsvps.sql`](./supabase/migrations/20260112000000_create_rsvps.sql) in the SQL Editor.
3. Add keys to `.env.local` and restart the server.
4. Verify: `curl http://localhost:3000/api/health` → `{"status":"ok",...}`

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run preview` | Production build + start |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

---

## Project structure

```
app/                 App Router pages, actions, API routes
app/dashboard/       Phase 2 scaffold (placeholder, no auth)
components/          UI sections, layout, dashboard shell
lib/                 Site content, Supabase clients, validation
supabase/migrations/ SQL for rsvps table
docs/                Architecture, deployment, roadmap
```

---

## Damola — deploy checklist

1. Import repo in Vercel
2. Set 3 Supabase env vars (see [DEPLOYMENT.md](./docs/DEPLOYMENT.md))
3. Deploy and verify `/api/health`
4. Test **Register Interest** on live site
5. Do **not** link `/dashboard` publicly until Phase 2 auth

---

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase + Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
