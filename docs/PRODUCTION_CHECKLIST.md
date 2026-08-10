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
| `PUBLIC_REGISTRATION_OPEN` | Public Register Interest (`true`) |
| `EMAIL_CONFIRMATIONS_ENABLED` | Confirmation emails (`true`) |
| `SMS_ENABLED` | SMS (`false` until Twilio ready) |
| `DASHBOARD_AUTH_REQUIRED` | Protect `/dashboard` (`true`) |

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
2. Consent checkboxes: SMS remains **unchecked** by default
3. Sponsor enquiry → success
4. Volunteer interest → success
5. `/login` → dashboard
6. RSVP CRM → Communication Status + resend email
7. Sponsors / Volunteers / Tasks / Programme / Announcements → create & edit
8. Analytics / Settings → flags + integrations (no secrets shown)
9. Sign out

## 6. Email & SMS

SMTP is preferred when `SMTP_*` + `MAIL_FROM` are set. RSVP still succeeds if email fails.
SMS only when `SMS_ENABLED=true`, Twilio credentials exist, and the registrant consented.
See [EMAIL.md](./EMAIL.md), [SMS.md](./SMS.md), [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md).
