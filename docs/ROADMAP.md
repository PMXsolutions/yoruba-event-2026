# Yoruba Day Canberra 2026 — Platform Roadmap

**Last updated:** July 2026  
**Owner:** Yoruba Association Canberra / PMX Solutions

---

## Phase 1 — Public launch (current)

**Goal:** Premium public website with interest registration.

| Item | Status |
|------|--------|
| Marketing site (Hero, About, Experience, Sponsors, RSVP, Footer) | ✅ Done |
| Register Interest form → Supabase | ✅ Done |
| Health check API | ✅ Done |
| GitHub backup | ✅ Done |
| Vercel deployment | ⏳ Damola |
| Rate limiting / CAPTCHA | ⏳ Post-launch hardening |
| Final sponsor logos & social URLs | ⏳ Business decision |
| Confirmed event date & ticket prices | ⏳ Business decision |

---

## Phase 2 — Organiser dashboard

**Goal:** Internal tools for committee members.

| Item | Status |
|------|--------|
| Dashboard route scaffold (`/dashboard/*`) | ✅ Scaffold only |
| Authentication (Supabase Auth or similar) | ❌ Not started |
| RSVP list / export | ❌ Blocked on auth |
| Sponsor pipeline CRM | ❌ Blocked on auth |
| Volunteer roster | ❌ Not started |
| Task board | ❌ Not started |

See [PHASE_2_SPEC.md](./PHASE_2_SPEC.md).

---

## Phase 3 — Communications & analytics

**Goal:** Notify organisers and measure engagement.

| Item | Status |
|------|--------|
| Email on new RSVP (Resend) | ⚠️ Scaffold — activates with `RESEND_API_KEY` + `RESEND_FROM_EMAIL` |
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

**Do not implement until Phase 1 is live and committee approves pricing.**

---

## Risk register

| Risk | Impact | Mitigation |
|------|--------|------------|
| RSVP spam | Medium | Rate limiting + CAPTCHA (Phase 1 hardening) |
| Unprotected `/dashboard` routes | Medium | Do not link publicly; add auth in Phase 2 |
| Service role key exposure | High | Server-only client; never commit `.env.local` |
| Turbopack dev hang | Low | Use `npm run preview` for local testing |
| Missing Supabase migration | High | Run SQL before deploy; verify `/api/health` |
| Placeholder content at launch | Low | Replace sponsors/social when assets ready |

---

## Remaining business decisions

1. **Exact event date** (currently November 2026, placeholder 22 Nov for countdown)
2. **Venue confirmation**
3. **Ticket types and pricing**
4. **Sponsor tier amounts and benefits**
5. **Official social media URLs**
6. **Contact phone number**
7. **Sponsor logo assets**
8. **Photography / video for hero and OG images**

---

## Friday launch checklist

- [ ] Supabase migration applied
- [ ] Vercel env vars set (3 Supabase vars)
- [ ] `GET /api/health` returns `{ "status": "ok" }`
- [ ] Register Interest form submits successfully
- [ ] Damola reviews site on mobile and desktop
- [ ] Custom domain configured (if ready)
- [ ] Committee approves placeholder vs final content
