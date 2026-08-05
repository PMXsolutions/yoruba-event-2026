# Email — Resend Integration

Promax Notification Engine · Email channel

---

## Overview

Confirmation emails send after successful RSVP registration via **Resend**. Email is **non-blocking** — RSVP saves even if email fails.

```
platform/engines/notifications/
  dispatch.ts                          # business entry
  email/resend-client.ts               # transport
  email/templates/rsvp-confirmation.ts # HTML + text template
  email/env-status.ts                  # presence checks only
```

---

## Activation

1. Create account at [resend.com](https://resend.com)
2. Verify sending domain
3. Add to `.env.local` / Vercel:

```bash
RESEND_API_KEY=re_xxxxxxxx
MAIL_FROM="Promax Event <support@yourdomain.com>"
MAIL_FROM_NAME=Promax Event
```

Legacy alias still works if `MAIL_FROM` is unset:

```bash
RESEND_FROM_EMAIL="Promax Event <support@yourdomain.com>"
```

4. Restart / redeploy
5. Submit Register Interest — check inbox

**Never** commit API keys, SMTP passwords, or put them in `NEXT_PUBLIC_*`.

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes | Resend API key |
| `MAIL_FROM` | Yes* | From header |
| `RESEND_FROM_EMAIL` | Alt | Used if `MAIL_FROM` unset |
| `MAIL_FROM_NAME` | No | Display name documentation |

Dashboard → Settings reports **Configured** / **Not configured** only.

---

## Template content

RSVP confirmation includes:

- Promax Event branding
- Event name, date, location, description
- Guest name, attendee count, ticket type
- Registration reference + status
- Save the Date CTA + maps link when configured
- Organisation contact + association branding

Responsive HTML table layout for Gmail, Outlook, Apple Mail, and mobile.

---

## Failure behaviour

| Outcome | RSVP saved? | User experience |
|---------|-------------|-----------------|
| Email sent | Yes | Success + optional “email on the way” |
| Not configured | Yes | Success (email skipped) |
| Send failed | Yes | Success; failure logged server-side |

Technical errors are never shown raw to end users.

---

## Future templates

- Sponsor enquiry acknowledgement
- Volunteer confirmation
- Committee alert on new RSVP
- Announcement broadcast
