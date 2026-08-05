# Roadmap

Promax Event Platform — status after production hardening (Yoruba Day Canberra 2026).

---

## Completed (v1 production foundation)

- [x] Public marketing site with config-driven branding
- [x] Save the Date (.ics / Google / Outlook)
- [x] RSVP → Zod → Server Action → Supabase
- [x] Registration references + confirmation email (Resend)
- [x] Live RSVP CRM (search, filters, status, tags, notes, CSV)
- [x] Sponsor registration + CRM
- [x] Volunteer registration + management
- [x] Task board
- [x] Programme items (Supabase operational)
- [x] Announcements (publish / archive)
- [x] Live analytics (no fake charts)
- [x] Supabase Auth + middleware + RBAC
- [x] RLS policies for operational tables
- [x] Rate limiting on public forms
- [x] SEO (metadata, sitemap, robots, Event JSON-LD)
- [x] Health checks (env / DB / event / email presence)

---

## Next

- [ ] CAPTCHA on public forms (architecture ready)
- [ ] Committee alert emails on new RSVP / sponsor
- [ ] Sponsor / volunteer confirmation emails
- [ ] Soft multi-tenant routing (subdomain / path)
- [ ] SMS via Twilio (`docs/SMS.md`)
- [ ] Ticketing / payments / check-in (Phase 4)

---

## Explicitly deferred

- Full multi-org SaaS billing
- AI content generation (registry only)
- Automated E2E suite (add when CI budget allows)
