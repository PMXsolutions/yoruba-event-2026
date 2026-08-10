# Damola Handover — Public Launch Communication

**Project:** Promax Event Platform  
**Event:** Yoruba Day Canberra 2026  
**Repo:** https://github.com/PMXsolutions/yoruba-event-2026  
**Branch:** `feature/public-launch-comms` (merge to `main` after review)

---

## Current status

| Area | Status |
|------|--------|
| Public landing page | ✅ Production launch wording |
| Register Interest + consent | ✅ Wired |
| Branded confirmation email | ✅ EventConfig HTML template |
| SMS confirmation | ✅ Code ready — off until Twilio + `SMS_ENABLED` |
| Committee Portal (`/dashboard/*`) | ✅ Auth-gated + CRM + delivery status |
| Authentication | ✅ Supabase Auth via `/login` |
| Feature flags | ✅ See `.env.example` |

---

## What Damola must do before public announce

### 1. Pull / deploy latest

```bash
git pull origin main   # after merge
# or deploy the feature branch on Vercel for UAT
```

### 2. Supabase — run communication migration

In **SQL Editor**, run:

- Prefer: `supabase/run-all-migrations.sql` (full), **or**
- Incremental: `supabase/migrations/20260810100000_rsvp_comms_consent.sql`

Confirm `rsvps` has: `email_consent`, `sms_consent`, `marketing_consent`, `email_status`, `sms_status`, `email_sent_at`, `sms_sent_at`.

### 3. Vercel env vars

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes |
| `PUBLIC_REGISTRATION_OPEN=true` | Yes |
| `EMAIL_CONFIRMATIONS_ENABLED=true` | Yes |
| `DASHBOARD_AUTH_REQUIRED=true` | Yes |
| `SMS_ENABLED=false` | Yes (until Twilio ready) |
| SMTP or Resend keys | Yes for live email |
| Twilio keys | Only if enabling SMS |

### 4. Admin account

```bash
npm run provision-admin
```

Verify login at `/login`.

### 5. Verify

```bash
curl https://<your-vercel-domain>/api/health
```

Then:

1. Submit Register Interest on production.
2. Confirm Supabase row + `email_status`.
3. Check inbox for branded confirmation.
4. Open `/dashboard/rsvps` → Communication Status.
5. Mobile check on public form.

### 6. SMS (optional, later)

1. Add Twilio credentials.
2. Set `SMS_ENABLED=true`.
3. Redeploy.
4. Test with consent + phone only.

---

## Joshua steps

1. Merge / push this branch.
2. Confirm Vercel redeploy succeeded.
3. Review one real confirmation email on phone.
4. Share public URL only after Damola checklist above is green.

---

## Known non-blockers

- Ticketing / QR / AI not in this launch
- Mass email/SMS not enabled
- Social links may still be placeholders
