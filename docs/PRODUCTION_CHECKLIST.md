# Production checklist — Yoruba Day Canberra 2026

Use this before treating the Vercel deployment as live.

## Critical blocker (current production)

`GET https://yoruba-event-2026.vercel.app/api/health` currently returns:

```json
{
  "status": "error",
  "code": "MISSING_ENV_VARS",
  "missingEnvVars": [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"
  ],
  "emailConfigured": false
}
```

Until these are set on **Vercel → Project → Settings → Environment Variables** (Production) and the app is **redeployed**, public registration, sponsorship, volunteers, admin login, and CRM cannot work.

---

## 1. Supabase

1. Create / open the Supabase project
2. Run all SQL files in `supabase/migrations/` **in order**
3. Confirm tables: `rsvps`, `profiles`, `sponsors`, `volunteers`, `tasks`, `programme_items`, `announcements`, `activity_logs`, `events`

## 2. Vercel environment (Production + Preview)

| Variable | Required for |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | DB + Auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Login (`/login`) |
| `SUPABASE_SERVICE_ROLE_KEY` | RSVP / sponsors / volunteers / CRM |
| `MAIL_FROM` | Confirmation emails |
| `SMTP_HOST` | SMTP send |
| `SMTP_PORT` | SMTP send (usually `587`) |
| `SMTP_USER` | SMTP send |
| `SMTP_PASSWORD` | SMTP send |
| `ADMIN_EMAIL` | Provisioning |
| `ADMIN_PASSWORD` | Provisioning |

After saving env vars: **Redeploy** (required for `NEXT_PUBLIC_*`).

## 3. Admin user

```bash
npm run provision-admin
```

Creates `admin@promaxevent.com` as `SUPER_ADMIN`.

## 4. Verify

```bash
npm run verify:deployment
# or
curl -s https://yoruba-event-2026.vercel.app/api/health
```

Expect:

```json
{ "status": "ok", "supabase": true, "emailConfigured": true, "authConfigured": true }
```

## 5. Manual smoke test

1. Public RSVP → success + registration reference (+ email if SMTP configured)
2. Sponsor enquiry → success
3. Volunteer registration → success
4. `/login` → dashboard
5. RSVP CRM → status / notes / tags / CSV
6. Sponsors / Volunteers / Tasks / Programme / Announcements → create & edit
7. Analytics / Settings → live status (no secrets shown)
8. Sign out

## 6. Email

SMTP is preferred when `SMTP_*` + `MAIL_FROM` are set. RSVP still succeeds if email fails.
