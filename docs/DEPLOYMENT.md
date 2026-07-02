# Deployment Guide

Deploy the Yoruba Day Canberra 2026 platform to **Vercel** with **Supabase** as the database backend.

---

## Prerequisites

- GitHub repo: `https://github.com/PMXsolutions/yoruba-event-2026`
- Supabase project with `rsvps` table migrated
- Vercel account linked to GitHub

---

## 1. Supabase (one-time)

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Run SQL from `supabase/migrations/20260112000000_create_rsvps.sql` in the **SQL Editor**.
3. Copy from **Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL` (use `https://<ref>.supabase.co` only — no `/rest/v1`)
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (**server only**)

---

## 2. Vercel deployment

1. Import the GitHub repository in [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Next.js** (auto-detected).
3. Add environment variables:

   | Name | Environment | Notes |
   |------|-------------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Public |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Public |
   | `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development | **Never** prefix with `NEXT_PUBLIC_` |

4. Deploy.

---

## 3. Post-deploy verification

```bash
curl https://<your-domain>/api/health
```

Expected: `{"status":"ok","supabase":true,"env":true}`

Manually test **Register Interest** on the live site and confirm a row in Supabase **Table Editor → rsvps**.

---

## 4. Custom domain (optional)

1. Vercel project → **Settings → Domains**
2. Add domain (e.g. `yorubadaycanberra.org`)
3. Update DNS per Vercel instructions

---

## 5. Local preview (recommended)

Turbopack dev mode may hang on first compile. For reliable local preview:

```bash
npm install
npm run preview   # build + start on :3000
```

Or separately:

```bash
npm run build
npm start
```

---

## 6. Rollback

Vercel → **Deployments** → select previous deployment → **Promote to Production**.

---

## Damola handover notes

- All secrets live in Vercel env vars — never in git.
- RSVP data is in Supabase dashboard → Table Editor → `rsvps`.
- `/dashboard` routes are **scaffold only** — not authenticated; do not promote publicly yet.
- Health endpoint: `/api/health` (safe to use for uptime checks; avoid exposing in public docs if preferred).
