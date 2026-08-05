# Demo Script — Yoruba Day Canberra 2026

**Audience:** Committee members (primary), sponsors, Promax prospects  
**Short version:** use [COMMITTEE_PRESENTATION.md](./COMMITTEE_PRESENTATION.md) (~5 minutes)  
**This document:** fuller demo (~8 minutes) if time allows  

**Presenter:** Joshua  
**Deployer:** Damola (Vercel + Supabase)

---

## Before you start

1. Confirm production URL loads (or local: `npm run preview`).  
2. Prefer Damola has finished migrations + env vars. If not, say clearly:  
   > “Register Interest is ready; Damola is connecting the secure database so submissions save tonight / tomorrow.”  
3. If connected, verify: `curl https://<your-domain>/api/health` → `status: ok`.  
4. Open two tabs: **public site** and **Committee Portal** (`/dashboard`).

> Portal links show **Committee demo**. RSVPs are **live** when the database is connected; otherwise the RSVP screen shows **presentation sample data**. Other portal modules are previews. Sign-in is not implemented yet — keep portal links limited.

---

## Act 1 — Public visitor journey (3 min)

### 1. Landing page (`/`)

- Hero: **Yoruba Day Canberra 2026**, November 2026, Canberra ACT, Presented by Yoruba Association Canberra.  
- Note countdown is toward November 2026; **exact date and venue to be confirmed**.  
- About → Experience (planned highlights) → Sponsors (packages coming soon).

### 2. Register Interest (`/#rsvp`)

- Emphasise **Register Interest** (not checkout).  
- Ticket types are **indicative preferences**; pricing coming soon.  
- Submit a test only if health is ok.  
- If DB not ready, walk the form UI without submitting (or submit and explain Damola’s next step if it errors).

### 3. Sponsors

- Tier names for discussion; amounts **coming soon**.  
- Early interest welcome via form or email.

### 4. Footer

- Contact email; phone **to be confirmed**; socials coming soon.  
- Subtle **Powered by Promax Event Platform**.

---

## Act 2 — Committee Portal (5 min)

### 5. Overview (`/dashboard`)

- Banner: **Committee portal — presentation mode**.  
- Sample executive metrics (expected).  
- Point to **RSVPs** for real guest interest once connected.

### 6. RSVP management (`/dashboard/rsvps`)

- **Live RSVP Data** or **Presentation sample data** banner.  
- KPIs, filters, export, notes/tags (when live).  
- **Register Guest · Coming soon** is intentionally not a live action yet.  
- Workflow language: New → Contacted → … (see [BUSINESS_WORKFLOWS.md](./BUSINESS_WORKFLOWS.md)).

### 7. Other modules (brief)

- Sponsors, Volunteers, Tasks, Programme, Announcements, Analytics = **preview / sample**.  
- Settings: integration status; Damola owns DB/env.

---

## Closing lines

> “This is the digital home for Yoruba Day Canberra 2026, presented by Yoruba Association Canberra, powered quietly by Promax Event Platform.  
> The public site is ready for committee review. Damola is finishing the secure database connection for live Register Interest.  
> We need your decisions on date, venue, programme, and packages — using the feedback sheet.”

Hand out / open: [COMMITTEE_FEEDBACK.md](./COMMITTEE_FEEDBACK.md) and [CONTENT_CHECKLIST.md](./CONTENT_CHECKLIST.md).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Form submit fails | Check `/api/health` — Damola migrations + env |
| `MISSING_ENV_VARS` | Vercel env + redeploy |
| `RSVPS_TABLE_MISSING` | Run all three migrations |
| RSVP shows sample data | Expected until DB connected |
| Non-RSVP modules are placeholders | Expected until Phase 2 |
| Dev server hangs | Use `npm run preview` |

---

## Do not demo (v1)

- Payments / Stripe  
- SMS  
- AI features  
- Editing unfinished “Coming soon” actions as if live  
- Inventing a confirmed date, venue, or price
