# Demo Script — Yoruba Day Canberra 2026

**Audience:** Committee members, sponsors, Promax IT Solutions prospects  
**Duration:** ~8 minutes  
**Presenter:** Joshua  
**Deployer:** Damola (Vercel + Supabase)

---

## Before you start

1. Confirm production URL is live (or run locally: `npm run preview`).
2. Run migration in Supabase if not done — see [DEPLOYMENT.md](./DEPLOYMENT.md).
3. Verify health: `curl https://<your-domain>/api/health` → expect `{"status":"ok",...}`.
4. Open two browser tabs: **public site** and **Committee Portal** (`/dashboard`).

> **Note:** Dashboard links in the nav/footer are labelled **Committee demo**. RSVP Management at `/dashboard/rsvps` uses **live Supabase data** when migrations and env vars are applied; other portal modules use placeholder data until Phase 2. Auth is not yet implemented.

---

## Act 1 — Public visitor journey (3 min)

### 1. Landing page (`/`)

- Scroll through Hero → About → Experience → Sponsors.
- Highlight: premium cultural branding, countdown, clear call-to-action.
- Point out **Register Interest** (not “RSVP” — ticketing opens later).

### 2. Register Interest form (`/#rsvp`)

- Click **Register Interest** in the hero or nav.
- Fill in:
  - Name: `Demo Guest`
  - Email: your test address
  - Attendees: `2`
  - Ticket type: `General admission`
- Submit and show the **confirmation message**:
  > “Thank you — you are on the list”
- If Resend is configured, mention confirmation email (optional).

### 3. Sponsors section

- Briefly show tier cards (Platinum, Gold, Heritage, Community).
- Explain packages are TBC — enquiries flow through the committee.

---

## Act 2 — Committee Portal (5 min)

### 4. Open Event Command Centre

- Click **Committee Portal** (with **Committee demo** badge) in nav or footer.
- Or navigate directly to `/dashboard`.

### 5. Executive overview (`/dashboard`)

Walk through:

| Widget | Talking point |
|--------|----------------|
| Stat cards | RSVPs, attendance, sponsors, volunteers, tasks, days to event |
| Registration funnel | Preview metrics — live after Supabase + analytics |
| Recent activity | Committee activity feed (demo data) |
| Upcoming milestones | Key planning dates |
| Priority tasks | Active workstreams |

Mention the **Demo mode** banner — auth required before public launch.

### 6. RSVP management (`/dashboard/rsvps`)

- Show **Demo Mode** or **Live RSVP Data** banner (professional — not an error state).
- Walk through KPI cards: Total Registrations, New Today, Contacted, Confirmed, Expected Guests, Pending Follow Up.
- Demonstrate search, status/ticket/tag filters, and **Export CSV**.
- Open **View Details** on a row — show contact info, tags, committee notes, activity timeline placeholder.
- Explain workflow: **Register Interest is not approval** — committee follows up, tags for segmentation, status for relationship stage.
- Mention future journey: Ticket Invited → Paid → Checked In (Phase 4 ticketing).
- If live: submit a test registration on the public site and refresh to show the new row.

### 7. Sponsor CRM (`/dashboard/sponsors`)

- Pipeline cards by tier.
- Sponsor table with follow-up status and next actions.

### 8. Volunteers & Tasks (`/dashboard/volunteers`, `/dashboard/tasks`)

- Roster and committee task board with progress indicators.

### 9. Analytics (`/dashboard/analytics`)

- Trend charts, funnel, conversion metrics (placeholder for demo).

### 10. Settings (`/dashboard/settings`)

- Event configuration and integration status (Supabase, Resend, Vercel).
- Demo & launch notes — auth and live data roadmap.

---

## Closing lines

> “This is Promax Event Platform v1 — a reusable SaaS foundation. Yoruba Day Canberra 2026 is the first deployment. The public site captures interest today; the Committee Portal shows where organisers will manage everything once auth and live data are connected.”

---

## Troubleshooting during demo

| Issue | Fix |
|-------|-----|
| Form submit fails | Check `/api/health` — run Supabase migration |
| Health returns `RSVPS_TABLE_MISSING` | Run SQL from `supabase/migrations/20260112000000_create_rsvps.sql` |
| Health returns `MISSING_ENV_VARS` | Add Supabase env vars in Vercel |
| RSVP dashboard shows demo sample data | Run migrations + env vars; expect green **Live** banner when connected |
| Non-RSVP dashboard modules show placeholder | Expected until Phase 2 |
| Dev server hangs | Use `npm run preview` instead of `npm run dev` |

---

## Do not demo (v1)

- Payments / Stripe
- SMS / Twilio
- AI features
- Real authentication (login)

See [DAMOLA_HANDOVER.md](./DAMOLA_HANDOVER.md) for deployment steps.

---

## Morning Checklist for Joshua and Damola

Before presenting: push commits, run migrations, verify `/api/health`, deploy, test Register Interest and `/dashboard/rsvps`, rehearse this script. Details: [QUALITY_AUDIT.md](./QUALITY_AUDIT.md#morning-checklist-for-joshua-and-damola).
