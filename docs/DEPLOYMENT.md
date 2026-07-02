# Deployment Guide

Deploy **Promax Event Platform v1** (Yoruba Day Canberra 2026) to **Vercel** with **Supabase** as the database backend.

---

## Prerequisites

- GitHub repo: `https://github.com/PMXsolutions/yoruba-event-2026`
- Supabase project (free tier is fine)
- Vercel account linked to GitHub

---

## Supabase checklist

Complete these steps **before** testing RSVP on production.

### 1. Create project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard).
2. **New project** → choose region close to users (e.g. Sydney).
3. Save the database password securely.

### 2. Run migrations

Run **both** migration files in order in the **SQL Editor**:

1. `supabase/migrations/20260112000000_create_rsvps.sql`
2. `supabase/migrations/20260702100000_rsvp_management_columns.sql`

The second migration adds committee workflow columns: `status`, `internal_notes`, `contacted_at`.

### 3. Verify table

1. Go to **Table Editor**.
2. Confirm `public.rsvps` exists with columns:
   - `id`, `full_name`, `email`, `phone`, `number_of_attendees`, `ticket_type`, `notes`, `created_at`

### 4. Copy API credentials

From **Settings → API**:

| Supabase value | Environment variable |
|----------------|---------------------|
| Project URL (`https://<ref>.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role key | `SUPABASE_SERVICE_ROLE_KEY` |

**Important:**

- URL must be exactly `https://<ref>.supabase.co` — **no** `/rest/v1` suffix.
- Service role key is **server-only** — never prefix with `NEXT_PUBLIC_`.
- Never commit keys to git.

### 5. Add env vars locally (optional test)

Copy `.env.example` → `.env.local` and fill values.  
Never commit `.env.local`.

### 6. Verify health endpoint

After env vars are set (local or Vercel):

```bash
curl http://localhost:3000/api/health
# or
curl https://<your-vercel-domain>/api/health
```

| Response | Meaning | Action |
|----------|---------|--------|
| `{"status":"ok","supabase":true,"env":true}` | ✅ Ready | Proceed |
| `{"code":"MISSING_ENV_VARS",...}` | Env vars missing | Add vars, redeploy |
| `{"code":"RSVPS_TABLE_MISSING",...}` | Migration not run | Run SQL migration |
| `{"code":"SUPABASE_QUERY_FAILED",...}` | URL/key mismatch | Check URL format and keys |

### 7. Test Register Interest form

1. Open the site (local: `npm run preview` or production URL).
2. Scroll to **Register Interest** (`/#rsvp`).
3. Submit a test entry with a unique email.
4. Open Supabase **Table Editor → rsvps**.
5. Confirm the new row appears.

---

## Vercel checklist (for Damola)

### 1. Import repository

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import `PMXsolutions/yoruba-event-2026` from GitHub.
3. Framework preset: **Next.js** (auto-detected).
4. Do not change build command (`next build`) or output directory.

### 2. Set environment variables

In **Project → Settings → Environment Variables**, add:

| Name | Environments | Notes |
|------|--------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development | **Server only** |
| `RESEND_API_KEY` | Production, Preview | Optional — confirmation emails |
| `RESEND_FROM_EMAIL` | Production, Preview | Optional — verified sender in Resend |
| `EVENT_SLUG` | Production | Optional — defaults to `yoruba-day-canberra-2026` |

### 3. Deploy

1. Click **Deploy** (or push to `main` if auto-deploy is enabled).
2. Wait for build to complete — must show ✓ Ready.

### 4. Test production URL

1. Open the Vercel deployment URL.
2. Check landing page loads (Hero, RSVP section, footer).
3. Run health check:

   ```bash
   curl https://<your-domain>/api/health
   ```

4. Submit a test RSVP on production.
5. Verify row in Supabase.

### 5. Test mobile

On a phone (or browser dev tools):

- Landing page scroll and RSVP form
- Navbar mobile menu
- Committee Portal sidebar drawer (`/dashboard`)

### 6. Confirm dashboard demo pages

Visit these routes — all should load with placeholder data:

- `/dashboard` — Event Command Centre
- `/dashboard/rsvps`
- `/dashboard/sponsors`
- `/dashboard/settings`

Each page shows a **demo mode** banner. Dashboard is **not authenticated** — do not promote publicly beyond **Committee demo** links.

### 7. Optional — custom domain

1. Vercel project → **Settings → Domains**
2. Add domain (e.g. `yorubadaycanberra.org`)
3. Update DNS per Vercel instructions
4. Redeploy if needed

---

## Local preview (recommended)

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

## Optional — Resend email

1. Create account at [resend.com](https://resend.com).
2. Verify sending domain or use Resend sandbox.
3. Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to Vercel.
4. Redeploy.
5. Submit RSVP — confirmation email should send (non-blocking if Resend fails).

See [EMAIL.md](./EMAIL.md) for details.

---

## Rollback

Vercel → **Deployments** → select previous deployment → **Promote to Production**.

---

## Security notes

- All secrets live in Vercel env vars — never in git.
- RSVP inserts use service role server-side only.
- `/dashboard` routes are **demo/scaffold** — add Supabase Auth before public launch.
- Health endpoint is safe for uptime checks; does not expose secrets.
- Do not enable `/api/health/rsvp-insert-test` in production unless `ENABLE_RSVP_INSERT_TEST=true`.

---

## Demo & handover

- **Presenter script:** [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)
- **Damola handover:** [DAMOLA_HANDOVER.md](./DAMOLA_HANDOVER.md)
