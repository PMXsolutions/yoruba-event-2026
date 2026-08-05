# Yoruba Day Canberra 2026 — Platform Roadmap

**Last updated:** August 2026  
**Owner:** Yoruba Association Canberra / Promax IT Solutions

---

## Ownership at a glance

| Track | Owner |
|-------|-------|
| Public content, committee materials, presentation polish | Joshua |
| Supabase migrations, Vercel env vars, health check, live RSVP test, Resend | Damola |
| Exact date, venue, prices, packages, programme confirmation | Committee |

---

## Phase 1 — Public launch (current)

**Goal:** Professional public website with Register Interest and committee-ready presentation.

| Item | Status | Owner |
|------|--------|-------|
| Marketing site (Hero, About, Experience, Sponsors, Register Interest, Footer) | ✅ Done | Joshua |
| Register Interest form → Supabase (code ready) | ✅ Done | Joshua |
| Health check API | ✅ Done | Joshua |
| GitHub on `main` | ✅ Done | Joshua |
| Committee presentation / feedback / workflows / content checklist | ✅ Done | Joshua |
| Vercel site published | ✅ Live URL exists | Damola |
| Supabase migrations on production | ⏳ Pending | Damola |
| Vercel Supabase env vars | ⏳ Pending | Damola |
| `/api/health` → ok on production | ⏳ Pending | Damola |
| Rate limiting / CAPTCHA | ⏳ Post-launch hardening | Engineering |
| Exact date, venue, ticket prices, sponsor amounts | ⏳ Committee decisions | Committee |
| Final sponsor logos & social URLs | ⏳ Committee / Comms | Committee |

---

## Phase 2 — Organiser dashboard

**Goal:** Internal tools for committee members.

| Item | Status |
|------|--------|
| Dashboard route scaffold (`/dashboard/*`) | ✅ Done (presentation UI) |
| RSVP CRM (list, filters, status, notes, tags, CSV export) | ✅ Done (live when DB connected; sample data otherwise) |
| Authentication (Supabase Auth or similar) | ❌ Not started — required before wide portal sharing |
| Sponsor pipeline CRM | 📋 UI scaffold + placeholder data |
| Volunteer roster | 📋 UI scaffold + placeholder data |
| Task board | 📋 UI scaffold + placeholder data |
| Programme / announcements / analytics | 📋 UI scaffold + placeholder data |

See [PHASE_2_SPEC.md](./PHASE_2_SPEC.md) and [BUSINESS_WORKFLOWS.md](./BUSINESS_WORKFLOWS.md).

---

## Phase 3 — Communications & analytics

**Goal:** Notify organisers and measure engagement.

| Item | Status |
|------|--------|
| Guest confirmation email (Resend) | ⚠️ Scaffold — activates with `RESEND_*` (Damola) |
| Admin notification preferences | ❌ Not started |
| Analytics (Plausible / GA4) | ❌ Not started |
| SEO (sitemap, OG images) | ❌ Not started |

See [PHASE_3_SPEC.md](./PHASE_3_SPEC.md).

---

## Phase 4 — Ticketing & payments

**Goal:** Paid ticketing when packages are finalised.

| Item | Status |
|------|--------|
| Ticket pricing | ❌ Business decision required |
| Payment provider (Stripe, etc.) | ❌ Not started |
| QR check-in | ❌ Not started |
| Refund policy | ❌ Business decision required |

**Do not implement until Phase 1 Register Interest is live and the committee approves pricing.**

---

## Risk register

| Risk | Impact | Mitigation |
|------|--------|------------|
| RSVP spam | Medium | Rate limiting + CAPTCHA (post-launch) |
| Unprotected `/dashboard` routes | Medium | Limit sharing; add auth in Phase 2 |
| Service role key exposure | High | Server-only; never commit secrets |
| Missing Supabase migration / env | High | Damola checklist; verify `/api/health` |
| Invented date / price / venue | High | Use TBC / coming soon until committee confirms |
| Placeholder portal modules | Low | Clearly labelled presentation mode |

---

## Remaining committee decisions

See [CONTENT_CHECKLIST.md](./CONTENT_CHECKLIST.md). Highlights:

1. Exact event date and times  
2. Venue confirmation  
3. Ticket types and pricing  
4. Sponsor tier amounts and benefits  
5. Official social media URLs and phone  
6. Confirmed programme, performers, MC, vendors  
7. Sponsor logos and photography  

---

## Launch readiness checklist

### Joshua (complete / maintain)

- [x] Public site presentation-ready  
- [x] Committee presentation document  
- [x] Committee feedback framework  
- [x] Business workflows documented (proposed)  
- [x] Content checklist with owners  
- [ ] Rehearse 5-minute walkthrough before the meeting  

### Damola (production connection)

- [ ] Run all three Supabase migrations  
- [ ] Set three Supabase env vars on Vercel  
- [ ] Redeploy  
- [ ] `GET /api/health` → `{ "status": "ok", "supabase": true, "env": true }`  
- [ ] Test Register Interest + row in Supabase  
- [ ] Confirm `/dashboard/rsvps` Live banner  
- [ ] Optional: Resend keys  

### Committee

- [ ] Review public wording  
- [ ] Confirm or amend workflows  
- [ ] Fill content checklist priorities  

Full morning checklist: [QUALITY_AUDIT.md](./QUALITY_AUDIT.md#morning-checklist-for-joshua-and-damola).
