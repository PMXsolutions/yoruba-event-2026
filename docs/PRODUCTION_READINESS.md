# Production Readiness — Public Launch Communication

**Event:** Yoruba Day Canberra 2026  
**Platform:** Promax Event Platform  
**Mode:** Controlled public launch (Register Interest + confirmations)

---

## Score

| Area | Score | Notes |
|------|-------|-------|
| Public site & messaging | 95 | Interest-only copy; discreet committee login |
| RSVP persistence | 95 | Rate limit, duplicates, consent columns |
| Email confirmation | 90 | Branded HTML; needs live transport in prod |
| SMS confirmation | 85 | Implemented; off until Twilio + flag |
| Dashboard CRM + comms | 90 | Delivery status + resend actions |
| Auth | 85 | Dashboard gated; provision admin before share |
| Docs / ops | 90 | Email, SMS, deploy, handover updated |
| **Overall** | **90 / 100** | Ready for public interest registration |

---

## Feature flags (confirm in production)

```bash
PUBLIC_REGISTRATION_OPEN=true
EMAIL_CONFIRMATIONS_ENABLED=true
SMS_ENABLED=false
DASHBOARD_AUTH_REQUIRED=true
```

---

## Production checklist before announcing the link

1. Run latest Supabase migrations including `20260810100000_rsvp_comms_consent.sql` (or `supabase/run-all-migrations.sql`).
2. Verify `/api/health` returns ok.
3. Set SMTP or Resend env vars; send a test Register Interest.
4. Confirm confirmation email renders on mobile (Gmail / Apple Mail).
5. Leave `SMS_ENABLED=false` unless Twilio is fully configured and legal copy approved.
6. Provision committee admin (`npm run provision-admin`) and verify `/login` → `/dashboard`.
7. Spot-check public copy: Register Interest is **not** a ticket.
8. Confirm Committee Portal link is discreet and wording is production-ready.
9. Deploy to Vercel; smoke-test production URL `#rsvp`.
10. Only then share the public link.

---

## Consent rules

| Field | Default | Required for |
|-------|---------|--------------|
| Email updates | Checked | Confirmation email |
| SMS updates | Unchecked | SMS confirmation |
| Marketing / community | Unchecked | Future non-event mail |

---

## Failure handling

- Email fail → RSVP OK, status `failed`, activity logged
- SMS fail → RSVP OK, status `failed`, activity logged
- Public UI never shows provider error messages

---

## Remaining non-blockers

- Ticketing, seating, QR, AI modules (intentionally deferred)
- Mass communications (not enabled)
- Full activity feed from `activity_logs` in UI (status fields + timeline stubs ship now)
