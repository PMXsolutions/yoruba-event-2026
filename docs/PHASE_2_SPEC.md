# Phase 2 Specification — Organiser Dashboard

**Status:** RSVP CRM live (July 2026) — other modules scaffold only  
**Blocked on:** Authentication before public launch

---

## RSVP business workflow (v1)

**This is not an approval workflow.** Guests register interest; the committee manages follow-up and segmentation.

```
Register Interest (public site)
  → automatic confirmation email (if Resend configured)
  → appears in dashboard as New
  → Committee follow-up (Contacted)
  → relationship management (tags, committee notes)
  → Confirmed (intent to attend)
  → Cancelled (if no longer attending)
```

**Future journey (not built yet):**

```
Register Interest → New → Contacted → Ticket Invited → Paid → Confirmed → Checked In → Completed
```

Statuses (v1): `New`, `Contacted`, `Confirmed`, `Cancelled`  
Tags (classification): VIP, Sponsor Lead, Volunteer, Performer, Vendor, Media, Committee, General Attendee

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

**Current state:** `/dashboard/rsvps` is a live Event CRM module (server-side Supabase). Other routes use placeholder data. **Not authenticated.**

---

## Required before go-live

### 1. Authentication

- [ ] Choose provider: Supabase Auth (recommended), Clerk, or Auth0
- [ ] Define roles: `admin`, `committee`, `viewer`
- [ ] Protect all `/dashboard/*` routes via middleware
- [ ] Redirect unauthenticated users to login

### 2. RSVP CRM (`/dashboard/rsvps`) — **implemented**

- [x] Server-side read via service role
- [x] KPI cards, search, status/ticket/tag filters, CSV export
- [x] Status workflow: New → Contacted → Confirmed → Cancelled
- [x] Classification tags (multi-tag per registrant)
- [x] Committee Notes field
- [x] Detail panel, row actions, demo mode fallback
- [ ] **Authentication required** before public launch
- [ ] Manual Register Guest form
- [ ] Edit RSVP, date range filter, activity timeline (live events)
- [ ] Paginated list for large datasets

**Migrations required (run in order):**

1. `20260112000000_create_rsvps.sql`
2. `20260702100000_rsvp_management_columns.sql`
3. `20260703100000_rsvp_crm_enhancements.sql`

### 3. Sponsor pipeline (next module)

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

---

## Morning Checklist for Joshua and Damola

Deploy and demo readiness: [QUALITY_AUDIT.md](./QUALITY_AUDIT.md#morning-checklist-for-joshua-and-damola).
