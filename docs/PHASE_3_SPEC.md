# Phase 3 Specification — Communications & Analytics

**Status:** Not started  
**Depends on:** Phase 1 live, Phase 2 auth (for admin notifications)

---

## Objective

Notify organisers when interest is registered, measure site engagement, and improve discoverability.

---

## Email notifications

### New RSVP alert

- Trigger: successful insert into `public.rsvps`
- Provider options: Resend, SendGrid, Postmark
- Recipients: configurable committee email list
- Template: name, email, attendees, ticket type, timestamp
- **Do not** send marketing emails without consent

### Implementation options

1. **Server Action hook** — call email API after Supabase insert in `app/actions/rsvp.ts`
2. **Supabase Database Webhook** — trigger Edge Function on insert
3. **Vercel Cron** — poll new rows (less ideal)

---

## Analytics

| Metric | Tool options |
|--------|--------------|
| Page views | Plausible, GA4, Vercel Analytics |
| Register Interest clicks | Custom event or Plausible goals |
| Form completions | Server-side count or analytics event |
| Sponsor page views | Section scroll / click tracking |

**Privacy:** Prefer cookie-light analytics (Plausible) for community trust.

---

## SEO

- [ ] `app/sitemap.ts` — dynamic sitemap
- [ ] `app/robots.ts` — allow indexing of public pages, disallow `/dashboard`
- [ ] Open Graph image (`opengraph-image.tsx` or static asset)
- [ ] Structured data (Event schema) when date/venue confirmed

---

## Error monitoring

- [ ] Sentry or Vercel monitoring for production errors
- [ ] Alert on `/api/health` failures

---

## Estimated effort

| Workstream | Estimate |
|------------|----------|
| Email on RSVP | 0.5–1 day |
| Analytics setup | 0.5 day |
| SEO basics | 0.5–1 day |
| Error monitoring | 0.5 day |
| **Total Phase 3** | **~2–3 days** |

---

## Business decisions required

1. Which email address(es) receive RSVP alerts?
2. Analytics provider and privacy policy wording
3. Final OG image and meta copy when event details confirmed

---

## Out of scope for Phase 3

- Ticketing emails (Phase 4)
- SMS notifications
- Marketing automation / newsletters

---

## Morning Checklist for Joshua and Damola

Pre-launch verification: [QUALITY_AUDIT.md](./QUALITY_AUDIT.md#morning-checklist-for-joshua-and-damola).
