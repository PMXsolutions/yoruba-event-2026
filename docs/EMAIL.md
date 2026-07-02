# Email — Resend Integration

Promax Notification Engine · Email channel

---

## Overview

Confirmation emails send after successful RSVP registration via **Resend**. Email is **non-blocking** — RSVP saves even if email fails.

Implementation: `platform/engines/notifications/email/`

---

## Activation (2 minutes)

1. Create account at [resend.com](https://resend.com)
2. Verify sending domain (or use Resend sandbox for testing)
3. Add to `.env.local` and Vercel:

```bash
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL="Yoruba Day Canberra <noreply@yourdomain.com>"
```

4. Restart server / redeploy
5. Submit Register Interest form — check inbox

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes | API key from Resend dashboard |
| `RESEND_FROM_EMAIL` | Yes | Verified sender (name + email) |

Check status in **Dashboard → Settings** (reads env presence only, never values).

---

## Template

RSVP confirmation template: `platform/engines/notifications/email/templates/rsvp-confirmation.ts`

Uses active `EventConfig` for:
- Event name
- Organisation
- Coming-soon note
- Contact email

---

## Future templates

| Template | Trigger | Status |
|----------|---------|--------|
| RSVP confirmation | Form submit | ✅ Implemented |
| Committee alert (new RSVP) | Form submit | TODO |
| Sponsor enquiry ack | Sponsor form | TODO |
| Announcement broadcast | Manual publish | TODO |

---

## Error handling

- Missing env → email skipped, RSVP succeeds, log: `Email skipped — Resend not configured`
- API failure → logged, RSVP succeeds
- Never expose API keys in logs or client

---

## Testing locally

```bash
# With keys in .env.local
npm run preview
# Submit form at http://localhost:3000/#rsvp
```

Without keys, RSVP still works — no email sent.
