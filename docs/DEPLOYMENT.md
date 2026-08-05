# Deployment

Vercel + Supabase production checklist for Promax Event Platform.

> Live site: https://yoruba-event-2026.vercel.app  
> Full go-live steps: [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)

---

## 1. Supabase

1. Create a Supabase project
2. Run migrations **in order** from `supabase/migrations/`:

   Or paste the combined file once: [`supabase/run-all-migrations.sql`](../supabase/run-all-migrations.sql) into the Supabase SQL Editor.
   - `20260112000000_create_rsvps.sql`
   - `20260702100000_rsvp_management_columns.sql`
   - `20260703100000_rsvp_crm_enhancements.sql`
   - `20260805100000_platform_production.sql`
3. Confirm tables exist: `events`, `rsvps`, `profiles`, `sponsors`, `volunteers`, `tasks`, `programme_items`, `announcements`, `activity_logs`
4. Confirm RLS is enabled (policies included in the production migration)

Do **not** run `supabase/seed/` in production. Seed content is for explicit local QA only.

---

## 2. Admin account

Default committee administrator email: `admin@promaxevent.com`

Login and registration fail until Supabase env vars are set on the deployment and the admin user is provisioned.

Confirm Vercel (Production) has:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Then set:

```bash
ADMIN_EMAIL=admin@promaxevent.com
ADMIN_FULL_NAME=Platform Administrator
ADMIN_PASSWORD="your-strong-password-here"
```

Provision:

```bash
npm run provision-admin
```

Sign in at `/login`. Rotate the password after first production use.

---

## 3. Vercel environment

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server inserts + CRM |
| `MAIL_FROM` | Yes for email | e.g. `Promax Event <support@promaxcare.com.au>` |
| `SMTP_HOST` | Yes for SMTP | e.g. `mail.promaxcare.com.au` |
| `SMTP_PORT` | Recommended | `587` |
| `SMTP_USER` | Yes for SMTP | Sender mailbox |
| `SMTP_PASSWORD` | Yes for SMTP | Never commit |
| `EVENT_SLUG` | Optional | Defaults to Yoruba Day |

Optional Resend alternative: `RESEND_API_KEY` (+ From) when SMTP is unset.

**After changing `NEXT_PUBLIC_*` variables, Redeploy.**

---

## 4. Deploy & verify

1. Connect the GitHub repo to Vercel
2. Framework: Next.js (auto-detected)
3. Deploy production
4. Verify:

```bash
npm run verify:deployment
# or
curl -s https://yoruba-event-2026.vercel.app/api/health
```

Expect `{ "status": "ok", "supabase": true, ... }`.

5. Sign in at `/login` and confirm dashboard modules load (empty states are OK)

---

## 5. Production safety

- `/dashboard/*` requires authentication (`proxy.ts`)
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
