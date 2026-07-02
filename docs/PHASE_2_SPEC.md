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

- [ ] Server-side read using service role or RLS policies for authenticated users
- [ ] Paginated list with search (name, email)
- [ ] CSV export (admin only)
- [ ] **Do not** expose RSVP data via public API

### 3. Sponsor pipeline

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

Search for `TODO(phase-2)` in:

- `components/dashboard/DashboardShell.tsx`
- `app/dashboard/page.tsx`

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
