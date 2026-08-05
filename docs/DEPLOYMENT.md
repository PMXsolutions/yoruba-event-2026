# Deployment

Vercel + Supabase production checklist for Promax Event Platform.

---

## 1. Supabase

1. Create a Supabase project
2. Run migrations **in order** from `supabase/migrations/`:
   - `20260112000000_create_rsvps.sql`
   - `20260702100000_rsvp_management_columns.sql`
   - `20260703100000_rsvp_crm_enhancements.sql`
   - `20260805100000_platform_production.sql`
3. Confirm tables exist: `events`, `rsvps`, `profiles`, `sponsors`, `volunteers`, `tasks`, `programme_items`, `announcements`, `activity_logs`
4. Confirm RLS is enabled (policies included in the production migration)

Do **not** run `supabase/seed/` in production. Seed content is for explicit local QA only.

---

## 2. Admin account

```bash
# In a secure shell with production env vars loaded — never commit passwords
export ADMIN_EMAIL=admin@promaxevent.com
export ADMIN_PASSWORD='…strong password…'
node scripts/provision-admin.mjs
```

This creates/updates the Auth user and upserts a `SUPER_ADMIN` profile.

---

## 3. Vercel environment

Set:

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only |
| `RESEND_API_KEY` | Email |
| `MAIL_FROM` | e.g. `Promax Event <support@example.com>` |
| `EVENT_SLUG` | Optional; default Yoruba Day slug |

Optional: `MAIL_FROM_NAME`, `RESEND_FROM_EMAIL` (legacy), SMTP_* (unused by default transport).

---

## 4. Deploy

1. Connect the GitHub repo to Vercel
2. Framework: Next.js (auto-detected)
3. Deploy production
4. Verify `GET /api/health` returns `{ "status": "ok", ... }`
5. Sign in at `/login` and confirm dashboard modules load (empty states are OK)

---

## 5. Production safety

- `/dashboard/*` requires authentication (middleware)
- Service role key never exposed to the browser
- Settings page shows **Configured / Not configured** only — never secret values
- RSVP insert test route is blocked in production unless `ENABLE_RSVP_INSERT_TEST=true`
- No demo-data fallback when Supabase is unavailable — fail clearly

---

## Health codes

| Code | Meaning |
|------|---------|
| `MISSING_ENV_VARS` | Required Supabase env missing |
| `EVENT_CONFIG_MISSING` | Unknown / invalid `EVENT_SLUG` |
| `RSVPS_TABLE_MISSING` | Migrations not applied |
| `SUPABASE_QUERY_FAILED` | Query error |
| `SUPABASE_CONNECTION_FAILED` | Client/connection error |
