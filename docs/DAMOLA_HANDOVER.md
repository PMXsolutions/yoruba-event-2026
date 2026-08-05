# Damola Handover — Phase A + Seating MVP

**Project:** Promax Event Platform  
**Event:** Yoruba Day Canberra 2026  
**Repo:** https://github.com/PMXsolutions/yoruba-event-2026  

---

## What is live in code

| Area | Status |
|------|--------|
| Public Register Interest | Live — keep open; not a ticket |
| Confirmation email | Live when SMTP/Resend configured |
| Committee Register Guest | Live in RSVP CRM |
| RSVP CRM + activity timeline | Live |
| Sponsor / volunteer interest | Live (interest only) |
| Seating / QR / check-in / `/seat` | Live in app — **needs migration** |
| Dashboard auth | Live — `/dashboard` protected |
| SMS | Foundation only — do not enable |

---

## Damola — exact next steps

1. **Pull / deploy** the Phase A branch / PR after merge to `main`.
2. **Supabase SQL Editor** — run seating migration (or full `run-all-migrations.sql`):
   - `supabase/migrations/20260805120000_seating_and_rsvp_extensions.sql`
3. Confirm new tables: `venue_floor_plans`, `seating_tables`, `seating_assignments`.
4. Confirm `rsvps` has `accessibility_requirements`, `dietary_requirements`, `source`.
5. Verify Vercel env (never commit secrets):
   - Supabase URL / anon / service role
   - SMTP or Resend
   - Leave `PUBLIC_REGISTRATION_OPEN` unset or `true`
   - Keep `SMS_ENABLED=false`
6. Smoke test:
   - Public Register Interest → appears in RSVPs
   - Register Guest → appears in RSVPs
   - Seating assign → `/seat?t=…` works
   - Check-in Mark Arrived
   - Unauthenticated `/dashboard` → `/login`
7. `/api/health` should remain healthy.

## Joshua — exact next steps

1. Review and merge the Phase A PR.
2. Confirm committee messaging stays “Register Interest / priority updates / not a ticket”.
3. Decide when (if ever) to set `PUBLIC_REGISTRATION_OPEN=false`.
4. Approve floor plan asset URL for seating.
5. Do **not** publish ticket prices or sponsor amounts until committee approval.
6. Coordinate Twilio + SMS consent only when ready (see `docs/SMS.md`).

---

## Docs index

- [BUSINESS_WORKFLOWS.md](./BUSINESS_WORKFLOWS.md)
- [SEATING_MVP.md](./SEATING_MVP.md)
- [QR_CHECKIN.md](./QR_CHECKIN.md)
- [EMAIL.md](./EMAIL.md)
- [SMS.md](./SMS.md)
- [AUTH_AND_ROLES.md](./AUTH_AND_ROLES.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md)
- [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)
- [ROADMAP.md](./ROADMAP.md)
