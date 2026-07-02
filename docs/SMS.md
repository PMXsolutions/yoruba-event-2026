# SMS — Twilio Integration (Future)

Promax Notification Engine · SMS channel — **not implemented in v1**

---

## Overview

SMS will complement email for:
- RSVP confirmation (opt-in)
- Day-of event reminders
- Volunteer shift alerts
- Urgent announcements

Architecture stub: `platform/engines/notifications/sms/twilio-stub.ts`

---

## Planned environment variables

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_FROM_NUMBER=+61xxxxxxxx
NOTIFY_SMS_ENABLED=false   # feature flag
```

---

## Activation steps (when ready)

1. Create Twilio account and purchase AU number
2. Add env vars to Vercel
3. Implement `platform/engines/notifications/sms/twilio-client.ts`
4. Wire into `dispatchRsvpNotifications()` behind `NOTIFY_SMS_ENABLED`
5. Add opt-in checkbox on RSVP form (consent required)
6. Update privacy policy

---

## Design principles

- **Opt-in only** — never send SMS without explicit consent
- **Non-blocking** — same as email; RSVP succeeds if SMS fails
- **Rate limited** — prevent abuse
- **Per-event config** — message templates from EventConfig

---

## Estimated effort

0.5–1 day after Twilio credentials and legal copy approved.
