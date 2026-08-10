# SMS — Twilio Integration

Promax Notification Engine · SMS channel

---

## Overview

SMS confirmation is **optional** and only sends when all of the following are true:

1. `SMS_ENABLED=true` (or `NOTIFY_SMS_ENABLED=true`)
2. Twilio credentials are present (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`)
3. The registrant explicitly consented to SMS (`sms_consent = true`, never pre-ticked)
4. A phone number was provided

SMS failure **never** fails the RSVP save.

Implementation: `platform/engines/notifications/sms/twilio-client.ts`  
Env presence: `platform/engines/notifications/sms/twilio-stub.ts`

---

## Environment variables

```bash
SMS_ENABLED=false
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_FROM_NUMBER=+61xxxxxxxx
```

When Twilio is not configured:

- No public errors
- SMS stays disabled / `not_configured`
- Settings shows integration status

---

## Message copy

Concise, premium, interest-only (never claims a ticket):

> Ẹ ṣé, [First Name]. Your interest in [Event Name] has been registered. Ticketing and programme updates are coming soon. Details: [website]

Built via EventConfig — not hardcoded to a single client.

---

## Delivery statuses

Stored on `rsvps.sms_status`:

| Status | Meaning |
|--------|---------|
| `not_attempted` | Default |
| `sent` | Twilio accepted |
| `failed` | Twilio error |
| `disabled` | `SMS_ENABLED` is false |
| `not_configured` | Missing Twilio credentials |
| `skipped` | No consent or no phone |

---

## Consent & privacy

- SMS checkbox is **unchecked** by default.
- If SMS is ticked without a phone, validation asks for a phone number.
- Marketing consent is separate (`marketing_consent`).
- Documented on the public form; store only what is needed for opted-in messages.

---

## Committee actions

Dashboard RSVP detail:

- Shows SMS status + timestamp
- **Send SMS confirmation** only when consent + phone exist
- No mass SMS in this release

---

## Test procedure

### Disabled path (default)

1. Leave `SMS_ENABLED=false`.
2. Submit RSVP → `sms_status = disabled`.
3. RSVP succeeds.

### Enabled path

1. Set Twilio env vars + `SMS_ENABLED=true`.
2. Submit with phone + SMS consent ticked.
3. Confirm SMS received and `sms_status = sent`.
4. Break auth token → RSVP still OK, status `failed`.

Settings → Integrations shows Twilio status without exposing secrets.
