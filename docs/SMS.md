# SMS — DirectSMS and Twilio

Promax Notification Engine · SMS channel

---

## Overview

SMS sends only when all of the following are true:

1. SMS is enabled in **Dashboard → Settings → SMS settings**, or `SMS_ENABLED=true` when no dashboard row has been saved
2. The selected gateway is configured
3. The registrant explicitly consented to SMS (`sms_consent = true`, never pre-ticked)
4. A phone number was provided

Confirmation SMS is sent after registration and from the RSVP action menu. Event reminders are a separate switch. They go only to opted-in registrants, skip cancelled records, and skip anyone who already received that reminder. Each reminder run sends at most 40 messages.

SMS failure never fails the RSVP save.

Gateway code:

- `platform/engines/notifications/sms/directsms-client.ts`
- `platform/engines/notifications/sms/twilio-client.ts`
- `platform/engines/notifications/sms/format.ts` (Australian number rules)

---

## Number format

The gateway receives digits with a country code and no leading `+`.

| Input | Sent as (country code 61) |
|-------|---------------------------|
| `0412345678` | `61412345678` |
| `+61412345678` | `61412345678` |
| `61412345678` | `61412345678` |
| `412345678` | `61412345678` |
| `+447911123456` | `447911123456` |

Spaces and punctuation are removed first. A leading `+` is treated as an international number and is not prefixed again.

---

## Dashboard settings

Administrators (`settings.write`) can set:

- Provider: DirectSMS or Twilio
- SMS confirmations on or off
- Event reminders on or off
- DirectSMS username and password
- Sender ID (default `YCD`, 1–11 letters or numbers)
- Message type `1-way` or `2-way`
- Default country code (default `61`)
- HTTPS or HTTP to `api.directsms.com.au`
- Reminder template using `{firstName}`, `{eventName}`, `{date}`, `{location}`, `{website}`

The password is encrypted with `SESSION_SECRET` before it is stored. The screen never shows it again. Leave the password blank to keep the saved one.

Twilio credentials stay in the environment: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`.

Do not put gateway passwords in source code. If a password was previously hardcoded, rotate it with the provider and enter the new value in Settings.

Apply `sql/mssql/001_create_and_migrate.sql` so `sms_settings` and the reminder columns exist. `npm run db:migrate` applies that script.

---

## Environment fallback

Used only when Settings has not saved a row:

```bash
SMS_ENABLED=false
DIRECTSMS_USERNAME=
DIRECTSMS_PASSWORD=
DIRECTSMS_SENDER_ID=YCD
DIRECTSMS_COUNTRY_CODE=61
```

A saved dashboard row controls `enabled` even when `SMS_ENABLED` is false.

---

## Committee actions

RSVP management:

- **Send SMS confirmation** when consent and a phone exist
- **Send SMS reminder** for one registrant
- **Send SMS reminders** for opted-in registrants who have not already been reminded

Sponsors and volunteers are not texted from these actions. They do not have an SMS consent field.
