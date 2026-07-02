# Damola Handover — Friday Demo Deployment

**Project:** Promax Event Platform v1  
**Event:** Yoruba Day Canberra 2026  
**Repo:** https://github.com/PMXsolutions/yoruba-event-2026  
**Branch:** `main`

---

## Current status (as of handover)

| Area | Status |
|------|--------|
| Public landing page | ✅ Presentation-ready |
| Register Interest form | ✅ Wired to Supabase (needs migration) |
| Committee Portal (`/dashboard/*`) | ✅ Enterprise UI — **demo mode**, placeholder data |
| Email (Resend) | ⚠️ Optional — activates with env vars |
| Authentication | ❌ Not implemented — Phase 2 |
| GitHub push | ⚠️ May need manual push via GitHub Desktop |

---

## What is complete

- Premium public site (Hero, About, Experience, Sponsors, RSVP)
- Server action RSVP insert via Supabase service role
- Health endpoint at `/api/health`
- Enterprise Committee Portal (9 dashboard routes)
- Demo script: [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)
- Deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Platform architecture docs in `docs/`

---

## What is pending (do not block Friday demo)

| Item | Owner | Priority |
|------|-------|----------|
| Supabase migration (`rsvps` table) | Damola | **P0 — before RSVP works** |
| Vercel env vars | Damola | **P0** |
| Push latest commits to GitHub | Joshua | P0 |
| Resend API key (confirmation emails) | Damola | P1 — optional |
| Supabase Auth + dashboard protection | Phase 2 | P2 — after demo |
| Live dashboard data (replace placeholders) | Phase 2 | P2 |

---

## Exact next actions (recommended order)

### 1. Pull latest code

```bash
git pull origin main
```

If commits are only local, Joshua pushes first via GitHub Desktop.

### 2. Supabase — run migration

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor** → **New query**.
3. Paste contents of `supabase/migrations/20260112000000_create_rsvps.sql`.
4. Click **Run**.
5. Confirm table exists: **Table Editor → rsvps**.

### 3. Vercel — deploy

Follow [DEPLOYMENT.md § Vercel checklist](./DEPLOYMENT.md#vercel-checklist-for-damola).

Minimum env vars:

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes |
| `RESEND_API_KEY` | Optional |
| `RESEND_FROM_EMAIL` | Optional |

### 4. Verify production

```bash
curl https://<your-vercel-domain>/api/health
```

Expected: `{"status":"ok","supabase":true,"env":true}`

If `RSVPS_TABLE_MISSING` → migration not applied.  
If `MISSING_ENV_VARS` → check Vercel env settings and redeploy.

### 5. Test RSVP on production

1. Open production URL.
2. Scroll to **Register Interest**.
3. Submit a test entry.
4. Confirm row in Supabase **Table Editor → rsvps**.

### 6. Test dashboard demo pages

Visit `/dashboard` and spot-check RSVPs, Sponsors, Settings.  
Dashboard uses **placeholder data** — this is expected.

### 7. Mobile check

Test on phone: landing page form + dashboard sidebar drawer.

---

## Known risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| `/dashboard` is public (no auth) | Anyone with URL can view demo portal | Only share via **Committee demo** links; add auth in Phase 2 |
| Placeholder dashboard data | Numbers not live | Explain during demo — see [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) |
| `npm run dev` may hang (Turbopack) | Local dev friction | Use `npm run preview` |
| Service role key in Vercel | Security if leaked | Never prefix with `NEXT_PUBLIC_`; never commit to git |
| Migration skipped | RSVP form fails | Always verify `/api/health` first |

---

## What NOT to change before Friday

- Do **not** redesign the public landing page.
- Do **not** remove **Committee demo** badges (they signal demo mode).
- Do **not** expose secrets in git or client code.
- Do **not** implement payments, SMS, or AI API calls.
- Do **not** remove demo banners from dashboard until auth exists.
- Do **not** change `.env.local` in git (local only).

---

## Useful commands

```bash
npm install
npm run lint          # must pass
npm run build         # must pass
npm run preview       # local production preview on :3000
```

---

## Contacts & docs

| Doc | Purpose |
|-----|---------|
| [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) | Joshua’s presentation flow |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Full Supabase + Vercel steps |
| [PLATFORM.md](./PLATFORM.md) | SaaS architecture overview |
| [PHASE_2_SPEC.md](./PHASE_2_SPEC.md) | Auth + live dashboard roadmap |

---

## After Friday

1. Add Supabase Auth + middleware on `/dashboard/*`.
2. Remove or hide public Committee Portal links.
3. Connect dashboard to protected server-side queries.
4. Optional: Resend for confirmation emails, custom domain.
