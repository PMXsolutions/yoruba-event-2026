# Phase 2 Specification — Organiser Dashboard

**Status:** Scaffold only (July 2026)  
**Blocked on:** Authentication + business approval for organiser roles

---

## Objective

Give Yoruba Association Canberra committee members a secure internal dashboard to manage RSVPs, sponsors, volunteers, and planning tasks.

---

## Routes (scaffolded)

| Route | Purpose |
|-------|---------|
| `/dashboard` | Overview / at-a-glance stats |
| `/dashboard/rsvps` | List, filter, export interest registrations |
| `/dashboard/sponsors` | Sponsor pipeline and tier tracking |
| `/dashboard/volunteers` | Volunteer roster and shift scheduling |
| `/dashboard/tasks` | Committee task board |
| `/dashboard/programme` | Run of show management |
| `/dashboard/announcements` | Comms hub |
| `/dashboard/analytics` | Traffic and conversion metrics |
| `/dashboard/settings` | Org profile and integrations |

**Current state:** Placeholder UI with static data. **Not authenticated.**

---

## Required before go-live

### 1. Authentication

- [ ] Choose provider: Supabase Auth (recommended), Clerk, or Auth0
- [ ] Define roles: `admin`, `committee`, `viewer`
- [ ] Protect all `/dashboard/*` routes via middleware
- [ ] Redirect unauthenticated users to login

### 2. RSVP data access

- [x] Server-side read using service role (`platform/engines/dashboard/rsvp/queries.ts`)
- [x] Search and status filter (client-side on loaded records)
- [x] CSV export from dashboard UI
- [x] Status workflow: New → Contacted → Confirmed
- [x] Internal notes column (`internal_notes`)
- [ ] **Authentication required** before public launch
- [ ] Paginated list for large datasets
- [ ] **Do not** expose RSVP data via public API

**Migration required:** Run both SQL files in `supabase/migrations/` including `20260702100000_rsvp_management_columns.sql`.

### 3. Sponsor pipeline (next)

- [ ] CRUD for sponsor enquiries (new table or external CRM)
- [ ] Link to final tier packages when announced

### 4. Volunteers

- [ ] Volunteer sign-up form (public or invite-only)
- [ ] Role assignment and contact details

### 5. Tasks

- [ ] Simple kanban or list view
- [ ] Assignee, due date, status

---

## TODO markers in code

Search for `TODO(` in:

- `components/layout/CommitteePortalLink.tsx` — remove public demo link before launch
- `components/layout/Navbar.tsx` / `Footer.tsx` — hide Committee Portal until auth
- `app/dashboard/*/page.tsx` — connect live data per engine
- `docs/PHASE_2_SPEC.md` — this file

Full list: run `rg 'TODO\\(' --glob '*.{tsx,ts}'` from repo root.

---

## Security requirements

- No public links to `/dashboard` until auth is live
- Audit log for RSVP exports
- Rate limit login attempts
- Session timeout for shared devices

---

## Estimated effort

| Workstream | Estimate |
|------------|----------|
| Auth + middleware | 1–2 days |
| RSVP list + export | 1–2 days |
| Sponsor / volunteer / tasks | 3–5 days |
| **Total Phase 2 MVP** | **~1–2 weeks** |

---

## Out of scope for Phase 2

- Payments
- Public ticket sales
- Email/SMS sending (see Phase 3)
