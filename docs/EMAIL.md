# Email — SMTP & Resend

Promax Notification Engine · Email channel

---

## Overview

Confirmation emails send after successful RSVP registration. Delivery is **non-blocking** — RSVP saves even if email fails.

Transports (first match wins):

1. **SMTP** — when `SMTP_HOST` + `SMTP_USER` + `SMTP_PASSWORD` (+ From) are set  
2. **Resend** — when `RESEND_API_KEY` (+ From) are set and SMTP is not configured

```
platform/engines/notifications/
  dispatch.ts
  email/env-status.ts      # presence + From resolution (no secrets logged)
  email/smtp-client.ts     # nodemailer SMTP transport
  email/resend-client.ts   # send entry (SMTP preferred, Resend fallback)
  email/templates/rsvp-confirmation.ts
```

---

## SMTP activation (Promax Care)

Add to **`.env.local`** (gitignored) or Vercel environment — **never commit passwords**:

```bash
MAIL_FROM="Promax Event <support@promaxcare.com.au>"
MAIL_FROM_NAME=Promax Event
SMTP_HOST=mail.promaxcare.com.au
SMTP_PORT=587
SMTP_USER=support@promaxcare.com.au
SMTP_PASSWORD=********
```

Optional aliases accepted by the app:

| Alias | Maps to |
|-------|---------|
| `SMTPMail` | `SMTP_HOST` |
| `MAIL_SENDER` | `SMTP_USER` |
| `SMTP_Password` | `SMTP_PASSWORD` |

Dashboard → Settings reports **Configured** / **Not configured** only (never shows passwords).

---

## Resend (optional)

```bash
RESEND_API_KEY=re_xxxxxxxx
MAIL_FROM="Promax Event <support@yourdomain.com>"
```

---

## Security

- Do not put SMTP passwords in git, README, or `NEXT_PUBLIC_*`
- Do not log passwords or API keys
- Rotate any password that was shared in chat, tickets, or screenshots

---

## Failure behaviour

| Outcome | RSVP saved? |
|---------|-------------|
| Email sent | Yes |
| Not configured | Yes (email skipped) |
| Send failed | Yes (failure logged safely) |
