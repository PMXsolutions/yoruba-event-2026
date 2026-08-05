# SMS — Twilio foundation

Promax Notification Engine · SMS channel

**Do not activate production SMS without Twilio credentials and consent rules.**

---

## Status

| Item | State |
|------|-------|
| Feature flags `SMS_ENABLED` / `NOTIFY_SMS_ENABLED` | Present (default **false**) |
| Dispatch hook `platform/engines/notifications/sms/dispatch.ts` | Foundation — no real Twilio send |
| Env presence helper `twilio-stub.ts` | Live |
| Opt-in checkbox on Register Interest | Live (records `[SMS consent: yes]` in notes) |
| Real Twilio API client | Future |

---

## Planned uses

- Guest ticket and seat information
- Event reminders
- Committee alerts
- VIP registration alerts
- Doors opening reminders

---

## Environment

```bash
SMS_ENABLED=false
NOTIFY_SMS_ENABLED=false
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
SMS_CONSENT_ASSUMED=false   # never set true without legal/consent review
```

## Activation checklist (committee + Damola)

1. Twilio AU number + credentials in Vercel
2. Privacy policy / consent copy approved
3. Prefer per-guest consent column (migration) over `SMS_CONSENT_ASSUMED`
4. Implement `twilio-client.ts` and wire behind flags
5. Keep sends non-blocking (never invalidate RSVP on SMS failure)
