# Demo script — Yoruba Day Canberra 2026

Stakeholder walkthrough for the production committee portal.

---

## Prep

1. Apply all SQL migrations in `supabase/migrations/`
2. Configure `.env.local` (Supabase + Resend)
3. Provision admin: `node --env-file=.env.local scripts/provision-admin.mjs`
4. `npm run preview`

---

## Public site (5 min)

1. Open `/` — hero shows **Yoruba Day Canberra 2026**, **22 November 2026**, Canberra
2. Click **Save the Date** — download .ics / Google / Outlook
3. Register Interest — submit RSVP; note registration reference
4. Submit a sponsorship enquiry and a volunteer registration

---

## Committee portal (8 min)

1. Open **Committee Portal** → `/login`
2. Sign in as `admin@promaxevent.com`
3. Overview — live KPIs (zeros are real empty states)
4. RSVPs — search, status, tags, notes, CSV export
5. Sponsors / Volunteers / Tasks / Programme / Announcements — live modules
6. Analytics — real distributions or honest empty state
7. Settings — Configured / Not configured only (no secrets)
8. Sign out

---

## Talking points

- Event-specific content is configuration-driven (`EVENT_SLUG`)
- Operational data is Supabase-backed with RLS + server-side RBAC
- Email confirmation is non-blocking (RSVP always persists)
