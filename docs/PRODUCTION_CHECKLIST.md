# Production checklist — Yoruba Day Canberra 2026

## Live status (verified)

`GET https://yoruba-event-2026.vercel.app/api/health` returns:

```json
{
  "status": "ok",
  "supabase": true,
  "env": true,
  "authConfigured": true,
  "event": "yoruba-day-canberra-2026",
  "emailConfigured": true,
  "emailTransport": "smtp"
}
```

`npm run verify:deployment` → **All checks passed.**

| Capability | Status |
|------------|--------|
| Public site | Live |
| Database (Supabase) | Connected |
| Register Interest | Ready to use |
| Confirmation email (SMTP) | Configured |
| Committee login (`/login`) | Auth configured |
| RSVP / Sponsors / Volunteers CRM | Ready when signed in |

**Yoruba Day Canberra 2026 is ready for public Register Interest and committee operations.**

Still coming soon (content, not blockers): ticket prices, sponsor package amounts, full programme, phone number, social URLs, exact venue hall (city-level Canberra ACT is published).

---

## 1. Supabase (complete when health is ok)

1. Create / open the Supabase project
2. Run all SQL files in `supabase/migrations/` **in order** (or `supabase/run-all-migrations.sql`)
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

## 5. Manual smoke test (recommended each release)

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

## 7. Troubleshooting

| Health code | Action |
|-------------|--------|
| `MISSING_ENV_VARS` | Set Vercel env vars + redeploy |
| `RSVPS_TABLE_MISSING` | Run migrations |
| `SUPABASE_QUERY_FAILED` | Check URL format (`https://<ref>.supabase.co`) and keys |
