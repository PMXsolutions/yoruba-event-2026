# Email — Confirmation & Templates

Promax Notification Engine · Email channel

---

## Overview

After a successful **Register Interest** save, the platform attempts a branded confirmation email.

Rules:

1. Save RSVP to the database first.
2. Only then attempt confirmation email.
3. RSVP remains successful even if email fails.
4. Log every attempt in `activity_logs` and update `rsvps.email_status`.
5. Never expose provider errors to the public form.
6. Committee dashboard shows delivery status and can resend.

Implementation:

- `platform/engines/notifications/dispatch.ts`
- `platform/engines/notifications/email/`
- Templates: `platform/engines/notifications/email/templates/`

---

## Feature flags

| Variable | Default | Meaning |
|----------|---------|---------|
| `EMAIL_CONFIRMATIONS_ENABLED` | `true` | When false, skip sends even if transport is ready |
| `PUBLIC_REGISTRATION_OPEN` | `true` | Must be open for new registrations |

Email also requires a transport (SMTP preferred, Resend fallback) — see `.env.example`.

---

## Environment variables

### SMTP (preferred)

| Variable | Required | Description |
|----------|----------|-------------|
| `SMTP_HOST` | Yes* | Mail host |
| `SMTP_PORT` | No | Default `587` |
| `SMTP_USER` | Yes* | SMTP username |
| `SMTP_PASSWORD` | Yes* | SMTP password |
| `MAIL_FROM` | Recommended | e.g. `Yoruba Day Canberra <noreply@…>` |

### Resend (fallback)

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes* | Resend API key |
| `RESEND_FROM_EMAIL` | Yes* | Verified sender |

\*Required for that transport path.

Check status in **Dashboard → Settings** (env presence only — never secrets).

---

## Delivery statuses

Stored on `rsvps.email_status`:

| Status | Meaning |
|--------|---------|
| `not_attempted` | Default before dispatch |
| `sent` | Provider accepted the message |
| `failed` | Provider error (RSVP still saved) |
| `not_configured` | No transport ready |
| `skipped` | Flag off or no email consent |

`email_sent_at` / `email_provider_id` populate on success.

---

## Templates

| Template | Auto-active |
|----------|-------------|
| Register Interest Confirmation | ✅ Yes |
| Ticket Sales Open | Template only |
| Ticket Confirmation | Template only |
| Seat / QR Assignment | Template only |
| Event Reminder | Template only |
| Volunteer Confirmation | Template only |
| Sponsor Thank You | Template only |
| Post Event Thank You | Template only |

Catalog: `platform/engines/notifications/email/templates/catalog.ts`

All content is driven by **EventConfig** (name, presenter, colours, contact, website URL). Do not hardcode client branding in the notification engine.

---

## Consent

- `email_consent` — defaults on so confirmation can send; registrant can untick.
- Without email consent, status is `skipped`.

Privacy note is shown on the public form.

---

## Failure handling

| Scenario | Public result | Dashboard |
|----------|---------------|-----------|
| Missing transport | RSVP OK | `not_configured` |
| API / SMTP error | RSVP OK | `failed` + activity log |
| Flag disabled | RSVP OK | `skipped` |

---

## Test procedure

1. Configure SMTP or Resend in `.env.local` / Vercel.
2. Set `EMAIL_CONFIRMATIONS_ENABLED=true`.
3. Submit Register Interest with a real inbox.
4. Confirm row in Supabase with `email_status = sent`.
5. Confirm activity log `email.confirmation.sent`.
6. Optionally break SMTP password → RSVP still succeeds, status `failed`.
7. From dashboard detail → **Resend confirmation email**.

Local:

```bash
npm run preview
# open http://localhost:3000/#rsvp
```
