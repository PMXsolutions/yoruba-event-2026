# Demo script — Yoruba Day Canberra 2026

Stakeholder walkthrough for Phase A + Seating MVP.

---

## Prep

1. Apply all SQL migrations (including seating extensions) — or `run-all-migrations.sql`
2. Configure Supabase + SMTP/Resend env vars
3. Provision admin: `npm run provision-admin`
4. `npm run build && npm run start` (or Vercel preview)

---

## Public site (6 min)

1. Open `/` — **Yoruba Day Canberra 2026**, Save the Date, honest “coming soon” copy
2. Register Interest — emphasise **not a ticket**; note registration reference
3. Confirmation email (if configured) — interest received + priority updates
4. Sponsor enquiry + volunteer interest — expressions of interest only
5. Optional: `/seat` after a committee seat assignment

---

## Committee portal (10 min)

1. `/login` → Overview KPIs
2. **RSVPs** — Register Guest (VIP / phone), status, tags, notes, activity timeline, resend email, CSV
3. **Seating** — floor plan URL, create table/zone, assign seat, steward export
4. **Check-in** — search, Mark Arrived / Undo, steward export
5. Sponsors / Volunteers / Tasks / Programme / Announcements
6. Settings — configured flags only (no secrets)
7. Sign out — confirm `/dashboard` redirects to login

---

## Talking points

- Public Register Interest stays open until the committee chooses otherwise
- Seating MVP is operational foundation — not a visual designer yet
- QR tokens are opaque; full guest list is not public
- SMS and payment/ticketing remain future scope
