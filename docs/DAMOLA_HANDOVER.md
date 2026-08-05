# Damola Handover — Production Database & Hosting

**Project:** Promax Event Platform v1  
**Event:** Yoruba Day Canberra 2026  
**Repo:** https://github.com/PMXsolutions/yoruba-event-2026  
**Branch:** `main` (also accept latest committee-readiness merges)

---

## Ownership split (read this first)

| Damola (you) | Joshua (done / ongoing) | Committee |
|--------------|-------------------------|-----------|
| Supabase migrations (3 SQL files) | Public content & presentation polish | Exact date, venue, prices |
| Vercel env vars + redeploy | Committee presentation & feedback docs | Programme & sponsors decisions |
| `/api/health` verification | Business workflows documentation | Logos, socials, phone |
| Live Register Interest test | Content checklist | Cultural confirmations |
| Optional Resend configuration | Portal presentation labelling | |

**Do not wait on content decisions to finish database connection.** Content can update after health is green.

---

## Current status

| Area | Status |
|------|--------|
| Public landing page | ✅ Committee-ready |
| Register Interest form | ✅ Wired to Supabase (needs your migration + env) |
| Committee Portal UI | ✅ Presentation-ready; RSVP CRM live when DB connected |
| Production site URL | ✅ Published (e.g. yoruba-event-2026.vercel.app) |
| Production `/api/health` | ❌ Last check: `MISSING_ENV_VARS` |
| Email (Resend) | ⚠️ Optional — activates with env vars |
| Authentication | ❌ Phase 2 — not your blocker for Register Interest |

---

## Exact next actions (recommended order)

### 1. Pull latest code

```bash
git pull origin main
```

### 2. Supabase — run migrations

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → project.  
2. **SQL Editor** → **New query**.  
3. Run **all three** in order:

   - `supabase/migrations/20260112000000_create_rsvps.sql`  
   - `supabase/migrations/20260702100000_rsvp_management_columns.sql`  
   - `supabase/migrations/20260703100000_rsvp_crm_enhancements.sql`  

4. Confirm **Table Editor → rsvps** includes CRM columns (`status`, `committee_notes`, `tags`, etc.).

### 3. Vercel — environment variables

Minimum:

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes |
| `RESEND_API_KEY` | Optional |
| `RESEND_FROM_EMAIL` | Optional |

Then **redeploy** Production so the new env vars load.

Full steps: [DEPLOYMENT.md](./DEPLOYMENT.md).

### 4. Verify production health

```bash
curl https://yoruba-event-2026.vercel.app/api/health
```

Expected:

```json
{"status":"ok","supabase":true,"env":true}
```

| Response | Action |
|----------|--------|
| `MISSING_ENV_VARS` | Fix Vercel env; redeploy |
| `RSVPS_TABLE_MISSING` | Re-run migrations |
| `SUPABASE_QUERY_FAILED` | Check URL format (no `/rest/v1`) and keys |

### 5. Test Register Interest

1. Open production site → **Register Interest**.  
2. Submit a unique test email.  
3. Confirm row in Supabase **rsvps**.  
4. Open `/dashboard/rsvps` → expect **Live RSVP Data** banner.

### 6. Optional — Resend

Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL`, redeploy, submit another test, confirm inbox. See [EMAIL.md](./EMAIL.md).

---

## What you do **not** need to do tonight

- Rewrite public marketing copy (Joshua)  
- Invent date / venue / ticket prices (committee)  
- Implement portal authentication (Phase 2)  
- Build new backend modules  

---

## Known risks

| Risk | Mitigation |
|------|------------|
| `/dashboard` has no auth | Share only with committee; Phase 2 auth |
| Env vars missing → form fails | Always verify `/api/health` first |
| Service role key leak | Never `NEXT_PUBLIC_`; never commit |

---

## When you are done

Reply to Joshua with:

1. Health endpoint JSON (ok)  
2. Screenshot or note of test row in Supabase  
3. Whether Resend was configured  

Committee materials: [COMMITTEE_PRESENTATION.md](./COMMITTEE_PRESENTATION.md).
