# Production Readiness

Promax Event Platform · Yoruba Day Canberra 2026 · Phase A + Seating MVP

---

## Scorecard

| Area | Score | Notes |
|------|-------|-------|
| Public Register Interest | 9/10 | Live; honest messaging; email non-blocking |
| Committee Register Guest | 9/10 | Live in RSVP CRM |
| RSVP CRM + timeline | 9/10 | Status, tags, notes, CSV, activity, resend |
| Seating MVP | 8/10 | Needs migration applied in production |
| QR / check-in | 8/10 | Foundation live; camera scan later |
| Auth | 9/10 | Dashboard protected; finer product roles next |
| Email | 8/10 | Live when SMTP/Resend configured |
| SMS | 4/10 | Foundation + flag only; no production sends |
| Docs | 9/10 | Workflows and ops guides updated |
| **Production readiness** | **8.5/10** | Apply seating migration; verify Vercel env |
| **SaaS readiness** | **6.5/10** | Single-event strong; multi-tenant / billing deferred |

---

## Live vs demo vs credentials

| Feature | State |
|---------|-------|
| Public site Save the Date / Register Interest | Live |
| Sponsor / volunteer interest | Live (expression of interest) |
| RSVP CRM | Live |
| Seating / check-in / seat lookup | Live in code — **requires migration** |
| Confirmation email | Live when email env configured |
| SMS | Not live |
| Payments / ticket prices | Not implemented (by design) |
| Drag-drop seating designer | Future |

---

## Required before claiming production seating

1. Run `20260805120000_seating_and_rsvp_extensions.sql` (or `run-all-migrations.sql`) in Supabase
2. Confirm `/api/health` remains healthy
3. Smoke-test Register Interest, Register Guest, seat assign, `/seat`, check-in
4. Keep `PUBLIC_REGISTRATION_OPEN=true` unless committee explicitly closes interest
