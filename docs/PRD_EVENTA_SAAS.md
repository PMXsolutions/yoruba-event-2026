# Product Requirements Document

**Product name (recommended):** Eventa  
**Commercial name:** Eventa by Promax  
**Owner:** Promax IT Solutions  
**Document type:** Product Requirements Document (PRD)  
**Version:** 1.0  
**Status:** Draft for review  
**Date:** 13 September 2026  
**Reference implementation:** Yoruba Day Canberra 2026 (this repository)  
**Word download:** [Eventa_SaaS_PRD_v1.0.docx](./Eventa_SaaS_PRD_v1.0.docx) (regenerate with `python3 scripts/build-prd-docx.py`)

---

## 1. Document control

| Field | Value |
|-------|--------|
| Product | Eventa — multi-tenant event management SaaS |
| Legal owner | Promax IT Solutions |
| First customer / flagship tenant | Yoruba Association Canberra — Yoruba Day Canberra 2026 |
| Source of truth for v1 behaviour | Current Promax Event Platform (Next.js + Supabase) |
| Target stack | React (frontend) · ASP.NET Core (API) · Microsoft SQL Server (database) |
| Audience | Product, engineering, design, operations, sales, first-customer committee |
| Related docs | `docs/PLATFORM.md`, `docs/ARCHITECTURE.md`, `docs/EMAIL.md`, `docs/SMS.md`, `docs/AI.md`, `docs/ROADMAP.md` |

### 1.1 Change log

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 1.0 | 13 Sep 2026 | Product / Engineering | Initial SaaS PRD. Maps the live Yoruba Day Canberra platform into a multi-tenant commercial product. |

### 1.2 How to read this document

- **Must** = required for the corresponding release phase.
- **Should** = strongly expected unless a recorded exception exists.
- **Could** = desirable, scheduled only after must/should items.
- **Won't (this phase)** = explicitly out of scope.

Yoruba Day Canberra 2026 is not a one-off website. It is the **reference tenant** that Eventa must be able to reproduce without special-casing Yoruba content in the product engines.

---

## 2. Product name

### 2.1 Recommended name: Eventa

**Eventa** (pronounced *eh-VEN-tah*) is the recommended product name.

**Go-to-market name:** Eventa by Promax  
**Legal owner:** Promax IT Solutions  
**Platform brand string (emails, login, powered-by):** Eventa  
**Default domains (proposed):**

| Surface | Proposed host |
|---------|----------------|
| Marketing / signup | `https://eventa.app` or `https://www.eventa.app` |
| Tenant public sites | `https://{event-slug}.eventa.app` |
| Tenant organiser portal | `https://{org-slug}.eventa.app/dashboard` or `https://app.eventa.app/{org-slug}` |
| Promax operator console | `https://admin.eventa.app` |
| API | `https://api.eventa.app` |

### 2.2 Why Eventa

| Criterion | Assessment |
|-----------|------------|
| Distinct from a single cultural event | Yes — not locked to Yoruba / Canberra |
| Easy to say and spell | Yes |
| Works as a SaaS noun | “Create an Eventa site”, “Log in to Eventa” |
| Domain-friendly | `eventa.app`, `geteventa.com`, `eventa.io` |
| Fits Promax brand | “Eventa by Promax” keeps company equity without forcing every tenant to look like Promax |
| International | Neutral English/Latin root from *event* |
| First-customer honour | Yoruba Day Canberra remains the flagship case study, not the product name |

### 2.3 Name alternatives considered

| Name | Verdict |
|------|---------|
| **Promax Event Platform** | Current internal name. Accurate, but sounds like an internal toolkit, not a sellable SaaS. Keep as engineering/code name if needed. |
| **Kolejo** | Yoruba for “gather together”. Beautiful heritage nod. Risk: market reads it as Africa-only. Offer as a *theme pack*, not the product name. |
| **Ayo Events** | *Ayo* = joy (Yoruba). Same cultural-lock risk. |
| **Promax Gather** | Clear, but generic and harder to trademark. |
| **EventForge / EventOS** | Technical. Weaker for community and cultural organisers. |
| **Oríki Events** | Strong for the first customer, too narrow for churches, corporates, festivals, and NGOs. |

**Decision requested:** Adopt **Eventa** as the external product name. Retain “Promax Event Platform” only in internal engineering notes until the rename is complete.

### 2.4 Tagline options

1. **Primary:** Create a branded event site. Run it like a command centre.
2. **Community:** From interest to attendance — one platform for every organiser.
3. **Heritage (first-customer campaign):** The same platform that powers Yoruba Day Canberra. Now yours.

---

## 3. Executive summary

Eventa is a **multi-tenant SaaS event operating system** owned by Promax IT Solutions. Organisations and individual organisers create their own branded public event, collect Register Interest / RSVPs, manage sponsors and volunteers, run a committee dashboard, send confirmations, and publish programme and announcements.

The first production deployment — Yoruba Day Canberra 2026 — already proves the product model:

- Premium public landing page (hero, about, experience, sponsors, volunteer, RSVP).
- Register Interest is **not a ticket**. It is a CRM lead with a unique registration reference.
- Committee portal with live RSVP CRM, sponsor pipeline, volunteer roster, tasks, programme, announcements, analytics, member access, and settings.
- Email confirmation (SMTP / Resend), optional SMS (Twilio), consent-aware communications.
- Config-driven branding: if another organisation could use it, it belongs in an engine. If it is event-specific, it belongs in event configuration.

Today that platform is a **single active event** (`EVENT_SLUG`) on Next.js 16 + Supabase/PostgreSQL. Eventa productises the same engines as a **shared SaaS**: many organisations, many events, one Promax-operated control plane, rebuilt on:

| Layer | Current (reference) | Target (Eventa) |
|-------|---------------------|-----------------|
| Public + organiser UI | Next.js App Router, React 19, Tailwind v4 | React SPA (Vite or Next.js as host), same information architecture |
| Business logic | `platform/engines/*` TypeScript | ASP.NET Core Web API, one bounded context per engine |
| Auth | Supabase Auth | ASP.NET Identity + JWT / cookie auth |
| Data | PostgreSQL + RLS | SQL Server + tenant filters + row-level security where useful |
| Email / SMS | Resend, SMTP, Twilio stubs | Same providers behind a Notification Engine |
| Hosting | Vercel + Supabase | Azure (recommended) or any IIS/Kestrel + SQL Server environment |

**Yoruba Day Canberra 2026 must remain tenant zero.** The rebuild is successful only if that event can be recreated as configuration + data, not as a fork of the codebase.

---

## 4. Problem statement

### 4.1 For organisers

Cultural associations, churches, festivals, schools, NGOs, and small corporates typically assemble an event from disconnected tools:

- a brochure website,
- a Google Form,
- a spreadsheet CRM,
- a WhatsApp volunteer list,
- a Canva programme,
- no consistent confirmation email,
- no audit trail.

That stack does not scale, leaks personal data, and cannot be handed to the next committee.

### 4.2 For Promax IT Solutions

Promax has already built a production-grade event operating system for one flagship customer. Without multi-tenancy, every new organisation becomes a **redeploy + fork**, which is not a software business.

### 4.3 Opportunity

Sell the Yoruba Day Canberra capability as a product:

- self-serve organisation signup,
- multiple events per organisation,
- branded public sites,
- shared engines,
- Promax-operated billing, support, and platform administration.

---

## 5. Vision, goals, and non-goals

### 5.1 Vision

Any organisation can launch a public event in minutes that looks as considered as Yoruba Day Canberra, and run it from a secure committee command centre — without Promax engineering a custom site each time.

### 5.2 Product goals

| ID | Goal | Measure |
|----|------|---------|
| G1 | Reproduce the Yoruba Day Canberra experience as a tenant, not a special build | Feature parity checklist (Section 21) passes for tenant zero |
| G2 | Enable any org or external user to create an organisation and an event | Time-to-live public page &lt; 15 minutes for a new organiser |
| G3 | Isolate tenant data completely | Cross-tenant read/write tests fail closed |
| G4 | Keep engine vs config separation | No tenant-specific copy in API engines |
| G5 | Make Promax the platform operator | Super-admin console can suspend tenants, impersonate support (audited), view usage |
| G6 | Commercially package the product | At least three plans (Community / Professional / Enterprise) defined and enforceable |

### 5.3 Non-goals (v1 SaaS)

- Becoming a full ticketing marketplace (Eventbrite competitor) in the first SaaS release.
- Native mobile apps.
- AI-generated content in production (registry only, same as current `docs/AI.md`).
- Mass marketing automation / newsletters.
- Multi-language CMS for every locale on day one (i18n architecture should be ready; Yoruba/English content remains tenant-authored).
- Custom code per tenant.

---

## 6. Success metrics

### 6.1 Product / business

| KPI | Target for first commercial year |
|-----|----------------------------------|
| Paying organisations | Defined by sales; platform must not block it |
| Events created | Growing month on month after launch |
| Public Register Interest submissions (all tenants) | Tracked; no demo/fake data in production |
| Activation | % of orgs that publish a public site and receive ≥ 1 RSVP within 14 days |
| Retention | % of orgs that create a second event |
| Support burden | &lt; 10% of new orgs require Promax to edit content by hand |
| Yoruba Day Canberra | Zero regression vs current public + dashboard behaviour |

### 6.2 Platform health

| KPI | Target |
|-----|--------|
| API availability | 99.9% monthly |
| p95 public RSVP submit | &lt; 800 ms excluding email/SMS |
| Confirmation email attempt | After successful persist; never blocks save |
| Cross-tenant incidents | Zero |
| Failed login lockout | In place; no credential leakage in logs |

---

## 7. Stakeholders and personas

### 7.1 Promax IT Solutions

| Persona | Needs |
|---------|--------|
| Platform owner | Revenue, brand, tenant health, ability to shut down abuse |
| Platform engineer | Clear engines, SQL schema, API contracts, no tenant forks |
| Support agent | Impersonation with audit, health of email/SMS per tenant |
| Sales | Plans, limits, demo tenant, case study (Yoruba Day) |

### 7.2 Tenant organisation (example: Yoruba Association Canberra)

| Persona | Current role analogue | Needs |
|---------|----------------------|--------|
| Organisation owner | Would map to tenant `OWNER` | Billing, branding, who is admin |
| Event lead / committee chair | `ADMIN` | Full CRM + content + settings |
| Committee member | `COMMITTEE` | Day-to-day RSVP, sponsors, volunteers, tasks |
| Volunteer coordinator | `VOLUNTEER` (read-heavy) | Roster and programme visibility |
| External organiser | New | Self-serve signup without a Promax contract first |

### 7.3 Public visitors

| Persona | Needs |
|---------|--------|
| Prospective guest | Understand the event, save the date, register interest, receive confirmation |
| Sponsor prospect | Express interest in a package, not buy blindly |
| Volunteer prospect | Offer skills and availability |
| Search / social visitor | Correct SEO, Event JSON-LD, Open Graph |

---

## 8. Reference product — Yoruba Day Canberra 2026

This section freezes the behaviour Eventa must generalise. It is taken from the live platform, not from a greenfield wishlist.

### 8.1 Public site sections (must remain available as a default theme)

| Section | Purpose |
|---------|---------|
| Navbar | Anchor navigation + discreet committee login |
| Hero | Event name, date, place, countdown, Save the Date, primary CTA |
| About | Presenter / organisation story |
| Experience | Configurable highlight cards (talking drum, cuisine, fashion, etc. are *content*, not code) |
| Sponsors | Tier list + enquiry form |
| Volunteer | Public volunteer interest form |
| Register Interest (RSVP) | Validated form + consent |
| Footer | Contact, legal, platform brand |

### 8.2 Public Register Interest contract

Fields: full name, email, phone (optional unless SMS opted in), number of attendees (1–50), ticket *interest* type, notes, email consent (default on), SMS consent (default off), marketing consent (default off).

Rules:

1. Persist first.
2. Generate unique `registration_reference`.
3. Soft-duplicate: same email + same event within 24 hours is rejected or surfaced as already registered.
4. Rate-limit public posts.
5. Confirmation email is best-effort.
6. Copy must never claim a paid ticket unless ticketing is actually live for that event.

Statuses (relationship CRM, not approval): `new` → `contacted` → `confirmed` | `cancelled`.

Classification tags: VIP, Sponsor Lead, Volunteer, Performer, Vendor, Media, Committee, General Attendee.

### 8.3 Committee portal modules (must remain)

| Route | Engine |
|-------|--------|
| `/dashboard` | Executive overview: RSVP totals, confirmed/new/cancelled, sponsors, volunteers, open tasks, days to event, 14-day trend, funnel, activity, milestones |
| `/dashboard/rsvps` | Search, filters, KPIs, tags, notes, communication status, resend email/SMS, CSV export |
| `/dashboard/sponsors` | Pipeline: new → contacted → approved → declined → active → completed |
| `/dashboard/volunteers` | Roster: new → contacted → approved → assigned → declined → inactive |
| `/dashboard/tasks` | todo / in_progress / blocked / completed; priority low–urgent; assignee; due date |
| `/dashboard/programme` | Timed items, speaker, location, category, publish flag |
| `/dashboard/announcements` | Draft, publish, schedule, archive |
| `/dashboard/analytics` | RSVPs over time, status, ticket-type mix, sponsor packages, attendee totals |
| `/dashboard/members` | Invite + role + active flag; Super Admin only for access changes; last Super Admin cannot be demoted |
| `/dashboard/settings` | Event profile, branding, integrations (presence only, never secrets) |

### 8.4 Current roles and permissions

Roles: `SUPER_ADMIN`, `ADMIN`, `COMMITTEE`, `VOLUNTEER`.

Permissions already in code: `rsvp.read|write|export`, `sponsor.read|write|export`, `volunteer.read|write`, `task.read|write`, `programme.read|write`, `announcement.read|write`, `analytics.read`, `settings.read`, `user.manage`.

In Eventa these become **tenant-scoped**. A new **platform** role exists above tenants (Promax operator).

### 8.5 Feature flags already in production

| Flag | Default | Meaning |
|------|---------|---------|
| `PUBLIC_REGISTRATION_OPEN` | true | Public form accepts submits |
| `EMAIL_CONFIRMATIONS_ENABLED` | true | Attempt email after persist |
| `SMS_ENABLED` | false | Twilio path |
| `DASHBOARD_AUTH_REQUIRED` | true | Portal gated |

Eventa must keep the same flags **per event** (not only global env).

### 8.6 Explicitly deferred in the reference product (carry forward as later phases)

- CAPTCHA (architecture ready).
- Committee alert emails on new RSVP/sponsor.
- Sponsor / volunteer confirmation emails (templates exist, not auto-active).
- SMS at scale / mass comms.
- Ticketing, payments, seating, QR check-in.
- AI capabilities (FAQ, drafting) — registry only.
- Full activity timeline UI (logs exist).

---

## 9. Product principles

1. **Engine vs configuration.** Reusable behaviour lives in engines. Tenant copy, colours, dates, tiers, and ticket labels live in configuration/data.
2. **Interest is not a ticket.** Language, emails, and SMS must stay honest until a tenant enables paid ticketing.
3. **Persist then notify.** Email/SMS failure never rolls back an RSVP, sponsor, or volunteer row.
4. **Consent is stored, not inferred.** SMS never pre-ticked. Marketing never pre-ticked. Unknown values fail validation.
5. **No fake production data.** Empty states are first-class.
6. **Public writes never trust the browser.** Validated API + server-side rate limits.
7. **Every operational row is tenant-scoped and event-scoped.**
8. **Yoruba Day Canberra is a tenant.** It must not require a code branch.
9. **Quiet committee access.** Public sites do not advertise an admin backdoor.
10. **Promax never sees tenant PII in logs or support tools without an audited reason.**

---

## 10. Scope

### 10.1 In scope — Eventa SaaS MVP (Phase S1)

- Multi-org, multi-event tenancy.
- Self-serve organisation + first event creation.
- Public event site using the Yoruba Day information architecture (themeable).
- All current engines: RSVP, Sponsors, Volunteers, Tasks, Programme, Announcements, Notifications, Dashboard/Analytics, Members.
- Promax operator console (tenants, plans, feature flags, support audit).
- SQL Server schema equivalent to current PostgreSQL model + tenant keys.
- ASP.NET Core API with the same permission names.
- React frontend for marketing, public event, organiser portal, and operator console.
- Email transport abstraction (SMTP + transactional provider).
- SMS abstraction (disabled by default).
- Activity log.
- Health endpoint.
- Seed/migrate Yoruba Day Canberra as tenant zero.

### 10.2 In scope — soon after MVP (Phase S2)

- Custom domains (`yorubadaycanberra.org` → Eventa).
- CAPTCHA.
- Committee notification emails.
- Activate remaining email templates.
- Soft billing (plan limits enforced).
- Subdomain routing hardened (SSL automation).

### 10.3 Out of scope until later phases

| Item | Phase |
|------|--------|
| Paid ticketing + payments | S3 |
| Seating / QR check-in | S3 |
| Mass email/SMS campaigns | S3 |
| AI assistants | S4 |
| Marketplace of public events | S4 |
| White-label removal of “Powered by Eventa” (Enterprise only) | S2 commercial |

---

## 11. Multi-tenancy model

### 11.1 Tenancy style

**Shared application, shared SQL Server database, strict tenant discriminator on every operational table.**

Rationale:

- Matches the current `event_slug` pattern and is the cheapest path to many orgs.
- SQL Server row-level security (`SESSION_CONTEXT` + security policies) can replace PostgreSQL RLS.
- Enterprise customers who later require isolation can be moved to a dedicated database without changing the API contract.

Rejected for v1: database-per-tenant (operational cost too high for community organisers).

### 11.2 Hierarchy

```
Platform (Promax IT Solutions)
 └── Organisation (tenant)          e.g. Yoruba Association Canberra
      ├── Members & roles
      ├── Branding defaults
      ├── Plan / limits
      └── Event(s)                  e.g. yoruba-day-canberra-2026
           ├── Public site config
           ├── RSVPs
           ├── Sponsors
           ├── Volunteers
           ├── Tasks
           ├── Programme items
           ├── Announcements
           └── Activity logs
```

An **external user** (person not already in an org) can:

1. Sign up with email.
2. Create an Organisation (they become `OWNER`).
3. Create an Event (they become event `ADMIN`).
4. Invite committee members.
5. Publish the public site when required fields are complete.

A user may belong to multiple organisations. Switching org/event is a first-class portal action.

### 11.3 Identity vs tenancy

| Concept | Description |
|---------|-------------|
| User | Global login identity (email unique on the platform) |
| Organisation membership | User + org + org role |
| Event assignment | Optional finer grant (default: org role applies to all org events) |
| Platform operator | Promax staff; not a tenant member unless explicitly invited |

### 11.4 Routing

| Mode | URL | Notes |
|------|-----|--------|
| Path (MVP acceptable) | `eventa.app/e/{eventSlug}` public, `eventa.app/app/{orgSlug}` portal | Fastest to ship |
| Subdomain (target) | `{eventSlug}.eventa.app` | Matches “each event feels like its own site” |
| Custom domain (S2) | customer DNS CNAME | Enterprise / Professional |

`slug` rules: lowercase kebab-case, globally unique for events (keeps current `event_slug` uniqueness), org slugs unique.

Yoruba Day keeps `yoruba-day-canberra-2026`.

### 11.5 Data isolation rules

1. Every operational table has `OrganisationId` (uniqueidentifier) and, where applicable, `EventId`.
2. API middleware resolves tenant from host/path **and** from the authenticated user’s membership. Both must match.
3. Public endpoints resolve only by public event slug / host and only for published/active events.
4. Queries never accept client-supplied `organisationId` as the sole authority.
5. Exports, analytics, and health checks are tenant-scoped.
6. Activity logs record actor, tenant, event, action, metadata (no secrets).

---

## 12. Product surfaces

### 12.1 Eventa marketing site (Promax-owned)

- What Eventa is, pricing, Yoruba Day case study, signup, login, legal (privacy, terms, cookies).
- Not the Yoruba landing page.

### 12.2 Public event site (tenant-owned experience)

Pixel-faithful capability of the current single-page marketing site, driven by Event Config.

Must support:

- Theme tokens (espresso, cream, gold, fonts) so a church fete and Yoruba Day can share one renderer.
- Optional section visibility (hide Volunteer or Sponsors if the organiser turns them off).
- Save the Date: `.ics`, Google Calendar, Outlook.
- Event JSON-LD, sitemap, robots (`/dashboard` disallowed), Open Graph.
- Countdown to `eventIso`.
- Accessibility: skip-to-content, semantic main, form errors on fields.

### 12.3 Organiser / committee portal

Same modules as Section 8.3, plus:

- Organisation switcher and event switcher.
- Event create/archive.
- Branding editor (replaces TypeScript `config/events/<slug>`).
- Billing (when plans go live).

### 12.4 Promax operator console

| Module | Purpose |
|--------|---------|
| Tenants | List orgs, plan, status (trial/active/suspended) |
| Events | Search all events (support); open as read-only or audited impersonation |
| Usage | RSVP counts, email volume, storage |
| Operators | Promax staff accounts |
| System health | SQL, SMTP, SMS, queue depth |
| Audit | Impersonation and privilege changes |

---

## 13. Functional requirements

Requirements use IDs so they can be traced into API tickets and tests. Priority: **P0** MVP, **P1** S2, **P2** later.

### 13.1 Identity, signup, and session — AUTH

| ID | Priority | Requirement |
|----|----------|-------------|
| AUTH-01 | P0 | Email + password registration and login. |
| AUTH-02 | P0 | Email verification before publishing a public event (login allowed on unverified with banner). |
| AUTH-03 | P0 | Password reset. |
| AUTH-04 | P0 | Session via HTTP-only cookie or JWT access + refresh; configurable idle timeout for shared committee devices. |
| AUTH-05 | P0 | Login rate limit and lockout. |
| AUTH-06 | P0 | User profile: name, email, avatar optional. |
| AUTH-07 | P1 | Optional Microsoft / Google social login. |
| AUTH-08 | P1 | MFA for OWNER / platform operators. |
| AUTH-09 | P0 | Account setup page equivalent to current `/account/setup` for invited members. |

### 13.2 Organisations — ORG

| ID | Priority | Requirement |
|----|----------|-------------|
| ORG-01 | P0 | Authenticated user can create an organisation (name, slug, country, timezone default, contact email). |
| ORG-02 | P0 | Creator becomes `OWNER`. |
| ORG-03 | P0 | Org settings: legal name, logo, default from-name, support contact. |
| ORG-04 | P0 | Invite members by email with role. |
| ORG-05 | P0 | Accept invite → membership + profile. |
| ORG-06 | P0 | OWNER/ADMIN can deactivate members; last OWNER cannot be removed. |
| ORG-07 | P0 | User can belong to many orgs and switch context. |
| ORG-08 | P1 | Org-level branding defaults inherited by new events. |
| ORG-09 | P2 | Sub-organisations / chapters. |

### 13.3 Events — EVT

| ID | Priority | Requirement |
|----|----------|-------------|
| EVT-01 | P0 | Create event from blank or from a template (including “Yoruba Day style cultural festival”). |
| EVT-02 | P0 | Event Config fields match current `EventConfig`: slug, name, tagline, ISO dates, timezone, venue, presenter, organisation display name, description, launch copy, nav items, experience items, sponsor tiers, ticket types, contact, social links, website, SEO, branding palette. |
| EVT-03 | P0 | Event lifecycle: `draft` → `published` → `completed` → `archived`. Public site only for `published` (and optionally completed for recap). |
| EVT-04 | P0 | Multiple events per organisation. |
| EVT-05 | P0 | Feature flags per event (registration, email, SMS, dashboard). |
| EVT-06 | P0 | Duplicate event (copy config, not PII). |
| EVT-07 | P1 | Custom domain mapping. |
| EVT-08 | P1 | Event timezone-aware display everywhere (en-AU default for tenant zero). |
| EVT-09 | P0 | Soft delete / archive only; no hard delete of events with RSVPs except Promax legal hold process. |

### 13.4 Public site renderer — PUB

| ID | Priority | Requirement |
|----|----------|-------------|
| PUB-01 | P0 | Themeable single-page layout matching current section order. |
| PUB-02 | P0 | Section on/off flags. |
| PUB-03 | P0 | Countdown + Save the Date menu. |
| PUB-04 | P0 | Responsive desktop and mobile; verify both. |
| PUB-05 | P0 | SEO metadata from Event Config; robots deny portal routes. |
| PUB-06 | P0 | Event JSON-LD. |
| PUB-07 | P0 | Published programme and announcements can appear when the organiser enables those blocks. |
| PUB-08 | P1 | Additional themes (minimal, corporate, faith, festival) sharing the same data contract. |
| PUB-09 | P1 | CMS-like rich text for About (sanitised HTML). |
| PUB-10 | P2 | Multi-page public sites (blog, gallery). |

### 13.5 RSVP engine — RSVP

Preserve `platform/engines/rsvp` behaviour.

| ID | Priority | Requirement |
|----|----------|-------------|
| RSVP-01 | P0 | Public submit with the current Zod-equivalent validation rules. |
| RSVP-02 | P0 | Unique registration reference: prefix from slug initials + entropy (current algorithm or stronger unique index). |
| RSVP-03 | P0 | Status workflow new / contacted / confirmed / cancelled. |
| RSVP-04 | P0 | Multi-tags from the current tag list (tenant-configurable extra tags P1). |
| RSVP-05 | P0 | Committee notes (never public). |
| RSVP-06 | P0 | Consent columns + delivery status columns as today. |
| RSVP-07 | P0 | Dashboard list: search, status, ticket type, tag, date filters, pagination. |
| RSVP-08 | P0 | KPI cards: total, new today, contacted, confirmed, expected guests, pending follow-up. |
| RSVP-09 | P0 | CSV export (`rsvp.export`) with activity log. |
| RSVP-10 | P0 | Detail panel + resend confirmation email / send SMS when allowed. |
| RSVP-11 | P0 | Manual “Register guest” from dashboard. |
| RSVP-12 | P0 | Rate limit + 24h email duplicate soft block per event. |
| RSVP-13 | P1 | CAPTCHA. |
| RSVP-14 | P1 | Edit registrant fields with audit. |
| RSVP-15 | P2 | Future journey: Ticket Invited → Paid → Checked In → Completed. |

### 13.6 Sponsors engine — SPN

| ID | Priority | Requirement |
|----|----------|-------------|
| SPN-01 | P0 | Public enquiry form (company, contact, email, phone, website, package, message, logo URL). |
| SPN-02 | P0 | Statuses: new, contacted, approved, declined, active, completed. |
| SPN-03 | P0 | Committee notes, CRM list, filters, export. |
| SPN-04 | P1 | Confirmation / thank-you email (template already in catalog). |
| SPN-05 | P1 | Logo upload to blob storage (not only URL). |
| SPN-06 | P2 | Public logo wall of `active` sponsors. |

### 13.7 Volunteers engine — VOL

| ID | Priority | Requirement |
|----|----------|-------------|
| VOL-01 | P0 | Public form: name, email, phone, skills, availability, area of interest, notes. |
| VOL-02 | P0 | Statuses: new, contacted, approved, assigned, declined, inactive. |
| VOL-03 | P0 | Assigned role + committee notes. |
| VOL-04 | P1 | Shift scheduling. |
| VOL-05 | P1 | Volunteer confirmation email. |

### 13.8 Tasks engine — TSK

| ID | Priority | Requirement |
|----|----------|-------------|
| TSK-01 | P0 | CRUD with status, priority, due date, assignee (org member). |
| TSK-02 | P0 | List + board view. |
| TSK-03 | P0 | Appear on executive open-task widget. |
| TSK-04 | P1 | Comments and @mentions. |

### 13.9 Programme engine — PRG

| ID | Priority | Requirement |
|----|----------|-------------|
| PRG-01 | P0 | Items: title, description, start/end, location, speaker, category, display order, published. |
| PRG-02 | P0 | Public reads published items only. |
| PRG-03 | P1 | Drag-and-drop reorder. |

### 13.10 Announcements engine — ANN

| ID | Priority | Requirement |
|----|----------|-------------|
| ANN-01 | P0 | Title, body, publish, schedule, archive. |
| ANN-02 | P0 | Public reads published + not archived. |
| ANN-03 | P1 | Push published announcements to email subscribers who consented. |
| ANN-04 | P2 | Social drafting via AI registry. |

### 13.11 Notifications engine — NTF

Same rules as `docs/EMAIL.md` and `docs/SMS.md`.

| ID | Priority | Requirement |
|----|----------|-------------|
| NTF-01 | P0 | Channel abstraction: Email (SMTP primary, transactional API fallback), SMS (Twilio). |
| NTF-02 | P0 | Templates driven by Event Config palette and copy. Catalog identical to current eight templates. |
| NTF-03 | P0 | Only Register Interest Confirmation auto-sends in S1. |
| NTF-04 | P0 | Delivery statuses and provider IDs stored on the RSVP (or a `NotificationMessages` table keyed to entity). |
| NTF-05 | P0 | Failures logged; public UI never shows provider errors. |
| NTF-06 | P0 | Per-event and per-org “from” name; Promax can force a shared sending domain until custom domain auth (SPF/DKIM) is verified. |
| NTF-07 | P1 | Committee alerts on new RSVP / sponsor / volunteer. |
| NTF-08 | P1 | Activate remaining templates. |
| NTF-09 | P2 | Mass send with unsubscribe and rate limits. |

### 13.12 Dashboard / analytics — DSH

| ID | Priority | Requirement |
|----|----------|-------------|
| DSH-01 | P0 | Executive metrics as `fetchExecutiveDashboard` today. |
| DSH-02 | P0 | Analytics as `fetchAnalytics` today (30-day trend, breakdowns). |
| DSH-03 | P0 | Empty and error states; no placeholder charts pretending to be live. |
| DSH-04 | P1 | Plausible or privacy-friendly page views (optional per tenant). |
| DSH-05 | P2 | Cross-event org rollup. |

### 13.13 Members and RBAC — MEM

| ID | Priority | Requirement |
|----|----------|-------------|
| MEM-01 | P0 | Roles: platform `PLATFORM_ADMIN`; org `OWNER`; event/org `ADMIN`, `COMMITTEE`, `VOLUNTEER` (map current SUPER_ADMIN → org OWNER or platform). |
| MEM-02 | P0 | Permission names unchanged so the React portal can mirror current gates. |
| MEM-03 | P0 | Access changes audited (`member.access_changed`). |
| MEM-04 | P0 | Cannot leave an org without at least one active OWNER. |
| MEM-05 | P0 | Invites expire; resend available. |
| MEM-06 | P1 | Custom roles (Enterprise). |

### 13.14 Settings and integrations — SET

| ID | Priority | Requirement |
|----|----------|-------------|
| SET-01 | P0 | Show integration *presence* (SMTP configured, SMS configured) never secrets. |
| SET-02 | P0 | Event flags and public registration toggle. |
| SET-03 | P1 | Tenant-provided SMTP or Promax shared pool. |
| SET-04 | P1 | Webhook outbound for RSVP created (Enterprise). |

### 13.15 Platform operator — OPS

| ID | Priority | Requirement |
|----|----------|-------------|
| OPS-01 | P0 | List/search organisations and events. |
| OPS-02 | P0 | Suspend / reinstate organisation (public site shows maintenance or hidden). |
| OPS-03 | P0 | Impersonate organiser with banner + mandatory reason + audit. |
| OPS-04 | P0 | Seed and maintain tenant zero (Yoruba Day). |
| OPS-05 | P1 | Plan assignment and limit overrides. |
| OPS-06 | P1 | Usage metering for email/SMS. |

### 13.16 Billing — BIL

| ID | Priority | Requirement |
|----|----------|-------------|
| BIL-01 | P1 | Plans: Community (free/low), Professional, Enterprise. |
| BIL-02 | P1 | Limits: events, RSVPs/month, members, custom domain, SMS, remove powered-by. |
| BIL-03 | P1 | Stripe or equivalent; invoices to OWNER. |
| BIL-04 | P2 | Annual vs monthly, sponsorship revenue tools. |

Suggested default limits (adjustable):

| | Community | Professional | Enterprise |
|--|-----------|--------------|------------|
| Events | 1 active | 10 | Unlimited |
| RSVPs / event | 300 | 5,000 | Unlimited |
| Committee seats | 3 | 15 | Unlimited |
| Custom domain | No | Yes | Yes |
| SMS | No | Usage | Usage + dedicated |
| Powered by Eventa | Required | Optional | Hidden |
| Support | Docs | Email | Named CSM |

---

## 14. User journeys

### 14.1 External user creates an event (happy path)

1. Visits `eventa.app` → Create organisation.
2. Verifies email.
3. Names organisation (“Yoruba Association Canberra”).
4. Clicks **Create event** → template “Cultural festival” or blank.
5. Completes Event Config wizard: name, date, venue, palette, ticket interest types, sponsor tiers, experience cards.
6. Invites committee.
7. Toggles `PUBLIC_REGISTRATION_OPEN`.
8. Publishes. Receives `{slug}.eventa.app`.
9. Shares URL. Guests register interest. Committee works the CRM.

**Acceptance:** Under 15 minutes for a motivated organiser with copy ready. Public page does not 404. First RSVP appears on dashboard without Promax intervention.

### 14.2 Guest registers interest (Yoruba-equivalent)

1. Lands on public site, reads experience, Save the Date.
2. Completes RSVP with email consent.
3. Sees registration reference.
4. Receives branded email if transport configured.
5. Does **not** see a ticket barcode.

### 14.3 Committee follow-up

1. Login → dashboard.
2. New RSVP KPI increments.
3. Open record, tag VIP, mark Contacted, add notes.
4. Later mark Confirmed.
5. Export CSV for venue planning.

### 14.4 Promax onboards an enterprise org

1. Operator creates org, assigns Enterprise plan, optionally turns off public signup.
2. OWNER invited.
3. Custom domain requested (S2).
4. Support impersonation only if ticket opened.

### 14.5 Abuse / isolation

1. User A in Org A must receive 404/403 for Org B API ids.
2. Knowing an RSVP GUID from another tenant must not return data.
3. Automated test suite proves this on every build.

---

## 15. Information architecture

### 15.1 React applications (recommended monorepo)

```
apps/
  web-marketing/          Eventa marketing + signup
  web-public/             Public event renderer
  web-portal/             Organiser dashboard
  web-admin/              Promax operator console
packages/
  ui/                     Shared buttons, section heading, modal shell
  api-client/             Typed OpenAPI client
  event-theme/            Design tokens + Yoruba default theme
src/ (or services/)
  Eventa.Api              ASP.NET Core host
  Eventa.Application      Use cases (engines)
  Eventa.Domain           Entities
  Eventa.Infrastructure   EF Core, SMTP, Twilio, blob
  Eventa.Migrations       SQL Server
```

Keep the **engine names** from the current repo so the team can map 1:1:

`Rsvp`, `Sponsors`, `Volunteers`, `Tasks`, `Programme`, `Announcements`, `Notifications`, `Dashboard`, `Ai` (stub).

### 15.2 Portal navigation (must match current labels)

Overview · RSVPs · Sponsors · Volunteers · Tasks · Programme · Announcements · Analytics · Members · Settings

Plus: Events (list/create), Organisation, Billing (S2).

---

## 16. Target architecture

### 16.1 Logical

```
                    ┌──────────────────────────────────────┐
                    │         React clients                 │
                    │  Marketing · Public · Portal · Admin  │
                    └──────────────────┬───────────────────┘
                                       │ HTTPS / JSON
                    ┌──────────────────▼───────────────────┐
                    │         ASP.NET Core API              │
                    │  AuthN/Z · Tenant resolver · Engines  │
                    └─────────────┬─────────────┬───────────┘
                                  │             │
                     ┌────────────▼───┐   ┌─────▼──────────┐
                     │  SQL Server     │   │  Email / SMS   │
                     │  + Blob (images)│   │  SMTP/Twilio   │
                     └────────────────┘   └────────────────┘
```

### 16.2 Mapping current folders → .NET

| Current | Eventa |
|---------|--------|
| `config/events/<slug>` | `Events` + `EventConfigurations` tables + branding JSON |
| `platform/core/types/event.ts` | `EventConfigDto` / domain `Event` |
| `platform/core/flags.ts` | `EventFeatureFlags` entity |
| `platform/engines/*` | `Eventa.Application/{Engine}` |
| `lib/auth/rbac.ts` | `Permission` enum + policy handlers |
| `lib/security/rate-limit.ts` | ASP.NET rate limiter / Redis |
| `lib/calendar` | `CalendarService` |
| `app/actions/*` | API controllers + FluentValidation |
| `app/api/health` | `GET /health` |
| `components/sections/*` | `web-public` section components |
| `components/dashboard/*` | `web-portal` modules |
| `supabase/migrations` | EF Core migrations / SQL scripts |

### 16.3 API conventions

- REST, versioned: `/api/v1/...`
- Auth: `Authorization: Bearer` and/or cookie for same-site portal.
- ProblemDetails for errors.
- Idempotency key on public POST RSVP (header) to survive double-submit.
- Correlation ID on every request; stored on activity logs.

#### Representative endpoints

**Public (anonymous, tenant from slug/host)**

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/public/events/{slug}` | Published config only |
| GET | `/api/v1/public/events/{slug}/programme` | Published items |
| GET | `/api/v1/public/events/{slug}/announcements` | Published |
| POST | `/api/v1/public/events/{slug}/rsvps` | Rate limited |
| POST | `/api/v1/public/events/{slug}/sponsors` | Rate limited |
| POST | `/api/v1/public/events/{slug}/volunteers` | Rate limited |
| GET | `/api/v1/public/events/{slug}/calendar.ics` | Download |

**Authenticated portal**

| Method | Path |
|--------|------|
| GET/POST | `/api/v1/orgs` |
| GET/PATCH | `/api/v1/orgs/{orgId}` |
| GET/POST | `/api/v1/orgs/{orgId}/events` |
| GET/PATCH | `/api/v1/orgs/{orgId}/events/{eventId}` |
| GET/PATCH | `/api/v1/orgs/{orgId}/events/{eventId}/rsvps` |
| POST | `/api/v1/orgs/{orgId}/events/{eventId}/rsvps/{id}/resend-email` |
| GET | `/api/v1/orgs/{orgId}/events/{eventId}/dashboard` |
| GET | `/api/v1/orgs/{orgId}/events/{eventId}/analytics` |
| CRUD | `.../sponsors`, `.../volunteers`, `.../tasks`, `.../programme`, `.../announcements` |
| POST | `/api/v1/orgs/{orgId}/members/invites` |
| PATCH | `/api/v1/orgs/{orgId}/members/{userId}/access` |

**Platform**

| Method | Path |
|--------|------|
| GET | `/api/v1/platform/organisations` |
| POST | `/api/v1/platform/organisations/{id}/suspend` |
| POST | `/api/v1/platform/impersonate` |
| GET | `/health` |

### 16.4 Validation

Port current Zod rules to FluentValidation:

- Name 1–200, email 320, phone 50, notes 2000, attendees 1–50.
- Ticket type and sponsor package must be in the event’s configured lists.
- `smsConsent && !phone` → field error on phone.

---

## 17. Data model (SQL Server)

Use `uniqueidentifier` for IDs, `datetimeoffset` for instants, `date` for due dates, `nvarchar` with explicit lengths. Soft `UpdatedAt` trigger or EF interceptor (current `set_updated_at`).

### 17.1 Platform / identity

```
Users
  Id, Email, NormalizedEmail, PasswordHash, FullName, EmailConfirmed,
  IsActive, CreatedAt, UpdatedAt

Organisations
  Id, Slug (unique), Name, Country, DefaultTimezone, LogoUrl,
  PlanCode, Status (trial|active|suspended), CreatedAt, UpdatedAt

OrganisationMembers
  Id, OrganisationId, UserId, Role (OWNER|ADMIN|COMMITTEE|VOLUNTEER),
  IsActive, CreatedAt, UpdatedAt
  UNIQUE (OrganisationId, UserId)

Invitations
  Id, OrganisationId, Email, Role, TokenHash, ExpiresAt, AcceptedAt, CreatedBy

PlatformOperators
  Id, UserId, Role (SUPPORT|ADMIN|OWNER), IsActive
```

### 17.2 Events and configuration

```
Events
  Id, OrganisationId, Slug (unique global), Name, Status,
  EventStart, EventEnd, Timezone, Location, Address, MapsUrl,
  Presenter, OrganisationDisplayName, Tagline, Description,
  ContactEmail, ContactPhone, Website, CanonicalUrl,
  IsRegistrationOpen, EmailConfirmationsEnabled, SmsEnabled,
  CreatedAt, UpdatedAt

EventBranding
  EventId PK, Espresso, Cream, Gold, GoldMuted, BodyText, Surface, Border,
  PrimaryFont, AccentColor, ThemeKey

EventLaunchCopy
  EventId PK, ComingSoonNote, RegisterInterest, BecomeSponsor,
  SponsorshipAnnouncedSoon, SaveTheDate

EventExperienceItems
  Id, EventId, Title, Accent, AccentLabel, Description, DisplayOrder

EventSponsorTiers
  Id, EventId, Name, TierCode, DisplayOrder

EventTicketTypes
  Id, EventId, Name, DisplayOrder

EventNavItems
  Id, EventId, Label, Href, DisplayOrder

EventSocialLinks
  Id, EventId, Platform, Label, Href

EventSeo
  EventId PK, Title, Description, OgImageUrl
```

Alternatively, store less-queryable marketing blobs as `nvarchar(max)` JSON **plus** strongly typed columns for dates/venue used in filters. Prefer typed columns for anything the dashboard queries.

### 17.3 Operational (every table: OrganisationId + EventId)

```
Rsvps
  Id, OrganisationId, EventId, FullName, Email, Phone,
  NumberOfAttendees, TicketType, Notes, RegistrationReference (unique),
  Status, CommitteeNotes, ContactedAt, Tags (nvarchar JSON or RsvpTags),
  EmailConsent, SmsConsent, MarketingConsent,
  EmailStatus, EmailSentAt, EmailProviderId,
  SmsStatus, SmsSentAt, SmsProviderId,
  CreatedAt, UpdatedAt

Sponsors
  … current columns + OrganisationId, EventId, Status, CommitteeNotes

Volunteers
  … skills as separate VolunteerSkills or nvarchar JSON
  Status, AssignedRole, CommitteeNotes

Tasks
  Title, Description, Status, Priority, AssignedTo, CreatedBy, DueDate

ProgrammeItems
  Title, Description, StartTime, EndTime, Location, Speaker, Category,
  DisplayOrder, Published

Announcements
  Title, Body, IsPublished, PublishedAt, ScheduledFor, ArchivedAt, CreatedBy

ActivityLogs
  Action, EntityType, EntityId, ActorId, Metadata (NVARCHAR JSON)
```

Indexes to port:

- `(EventId, Status)` on RSVPs, Sponsors, Volunteers, Tasks.
- Unique `RegistrationReference`.
- `(EventId, DisplayOrder)` on programme.
- `(EventId, CreatedAt DESC)` on activity.

### 17.4 SQL Server row-level security (recommended)

```sql
CREATE FUNCTION security.fn_org_predicate(@OrganisationId uniqueidentifier)
RETURNS TABLE WITH SCHEMABINDING AS
  RETURN SELECT 1 AS fn_access
  WHERE @OrganisationId = CONVERT(uniqueidentifier, SESSION_CONTEXT(N'OrganisationId'));

CREATE SECURITY POLICY security.OrgIsolation
  ADD FILTER PREDICATE security.fn_org_predicate(OrganisationId) ON dbo.Rsvps,
  -- repeat for all operational tables
  WITH (STATE = ON);
```

API sets `SESSION_CONTEXT` after tenant resolution. Background jobs use a privileged connection only for explicit cross-tenant operations (billing, operator).

### 17.5 Tenant zero seed

Migrate existing Yoruba Day Canberra rows:

- Organisation: Yoruba Association Canberra.
- Event slug: `yoruba-day-canberra-2026`.
- Config from `config/events/yoruba-day-canberra-2026/index.ts`.
- Import RSVPs/sponsors/volunteers/tasks/programme/announcements/members if production cutover is required.

Cutover plan must keep registration references stable.

---

## 18. Frontend requirements (React)

### 18.1 Stack

- React 19, TypeScript, Vite (portal/admin/public) or a React meta-framework if SSR is required for public SEO.
- **Public event pages should be server-rendered or pre-rendered** so Event JSON-LD and first paint match today’s Next.js SEO.
- Tailwind CSS (keep the current visual language for the default “Heritage” theme).
- Framer Motion optional; respect reduced-motion (already a platform habit).
- TanStack Query for portal data; React Hook Form + Zod (or shared OpenAPI types) on the client, with server as source of truth.

### 18.2 Visual language

Default theme tokens come from Yoruba Day (espresso / cream / gold). Tenants override tokens; they do not fork CSS files.

Portal: keep the current “enterprise command centre” density — KPI cards, filters, detail drawer (`ModalShell` pattern), CSV export.

### 18.3 States that must be designed

Empty, loading, error, forbidden, unpublished event, registration closed, email not configured, SMS disabled, suspended tenant, impersonation banner.

### 18.4 Responsive

All public sections and the RSVP/sponsor/volunteer forms must be verified at a desktop width (~1440) and a mobile width (~390). Portal tables may horizontally scroll on mobile but filters and KPIs must remain usable.

---

## 19. Security, privacy, and compliance

### 19.1 Security

- HTTPS only; HSTS.
- Password hashing via ASP.NET Identity (PBKDF2 or modern Identity defaults).
- Secrets in Azure Key Vault / environment — never `NEXT_PUBLIC_*` equivalents for private keys.
- CORS: explicit portal and public origins.
- Public form rate limits per IP + per email + per event.
- File uploads (S2): type/size scan, private containers, signed URLs.
- CSRF protection for cookie-authenticated portal.
- Security headers: CSP, X-Content-Type-Options, Referrer-Policy.
- Dependency scanning in CI.

### 19.2 Privacy

- Lawful basis: legitimate interest + consent for email/SMS/marketing (Australian Privacy Principles + GDPR-ready).
- Consent text on public forms, tenant-editable with a required minimum.
- Export and delete of a registrant on OWNER request (data-subject request workflow P1).
- Retention: configurable; default keep until event + 24 months then anonymise (P1).
- SMS checkbox never pre-selected.
- No PII in AI prompts without consent (future).

### 19.3 Audit

Log: login success/fail, export, access change, impersonation, flag change, RSVP status change, notification send/fail.

### 19.4 Roles vs current SUPER_ADMIN

| Current | Eventa |
|---------|--------|
| `SUPER_ADMIN` on a single deployment | Split into **Platform operator** (Promax) and **Organisation OWNER** |
| `ADMIN` | Org/event `ADMIN` |
| `COMMITTEE` | `COMMITTEE` |
| `VOLUNTEER` | `VOLUNTEER` |

Yoruba Day’s current super admin becomes Org OWNER + optional Promax operator if they are Promax staff.

---

## 20. Non-functional requirements

| ID | Area | Requirement |
|----|------|-------------|
| NFR-01 | Availability | 99.9% API + public GET |
| NFR-02 | Latency | p95 read &lt; 300 ms, RSVP write &lt; 800 ms excl. providers |
| NFR-03 | Scale S1 | 500 orgs, 2,000 events, 1M RSVPs |
| NFR-04 | Backups | SQL daily full + hourly log, 14-day retain, tested restore |
| NFR-05 | Observability | Structured logs, metrics, tracing; health like current `/api/health` |
| NFR-06 | I18n | UI English first; tenant content any language; date/time by event timezone |
| NFR-07 | A11y | WCAG 2.2 AA on public forms and portal critical paths |
| NFR-08 | Browser | Last two Chrome/Edge/Safari/Firefox; iOS/Android current |
| NFR-09 | Email | Mobile-safe HTML (current Georgia/Arial table templates) |
| NFR-10 | Test | Unit (engines), API integration (SQL), tenant isolation suite, Playwright smoke of public RSVP + login |
| NFR-11 | Docs | OpenAPI, runbooks, operator handbook |
| NFR-12 | Deploy | Blue-green or slot swap; migrations backward compatible |

---

## 21. Feature parity checklist (tenant zero)

The rebuild is not done until Yoruba Association Canberra can operate without noticing a functional regression.

| Capability | Current | Eventa S1 |
|------------|---------|-----------|
| Public sections + countdown + Save the Date | Yes | Must |
| Register Interest + reference + consent | Yes | Must |
| Confirmation email branded | Yes | Must |
| SMS path off by default | Yes | Must |
| RSVP CRM + tags + notes + CSV | Yes | Must |
| Sponsors / volunteers / tasks / programme / announcements | Yes | Must |
| Analytics live, no fake charts | Yes | Must |
| Members invite + audited access | Yes | Must |
| Settings integration presence | Yes | Must |
| Health endpoint | Yes | Must |
| Rate limit + duplicate email window | Yes | Must |
| Event JSON-LD / sitemap / robots | Yes | Must |
| Ticketing / QR / AI live | No | Still no |

---

## 22. Release plan

Do not treat these as calendar estimates. They are capability slices.

### Phase S0 — Specification and foundation

- This PRD approved.
- Eventa name, domains, and plan names approved.
- Solution skeleton: API + SQL + React portal + public renderer.
- Tenant resolver + Identity + one vertical slice (create org → create event → public GET → RSVP POST → dashboard list).

### Phase S1 — SaaS MVP (parity + tenancy)

- All engines ported.
- Operator console minimum (list, suspend, impersonate).
- Yoruba Day Canberra loaded as tenant zero.
- Parallel run: existing Next.js site remains live until cutover decision.

### Phase S2 — Commercial hardening

- Custom domains, CAPTCHA, billing limits, committee alert emails, remaining templates, data-subject export/delete.

### Phase S3 — Attendance

- Ticketing, payments, QR, check-in, seating (current Phase 4 / seating MVP intent).

### Phase S4 — Intelligence and network

- AI registry implementations, public event directory opt-in, deeper automation.

---

## 23. Acceptance criteria (S1)

1. A new user can create an org and a published event without Promax engineering.
2. Two tenants cannot read each other’s RSVPs via API or UI (automated tests).
3. Yoruba Day Canberra config produces a public page with the same sections, ticket types, and sponsor tiers.
4. RSVP persist succeeds when SMTP is broken; status becomes `failed`; dashboard can resend.
5. SMS never sends without flag + credentials + explicit consent + phone.
6. Permission matrix matches Section 8.4 for tenant users.
7. Last OWNER / last platform admin cannot be locked out by themselves.
8. `/health` reports SQL, email transport presence, and version — never secrets.
9. CSV export is permissioned and audited.
10. Suspended org public site is not registrable.
11. Empty dashboard shows zeros and empty lists, not demo rows.
12. Mobile and desktop public RSVP paths both succeed in a real browser test.

---

## 24. Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Rewrite drift from the live Yoruba site | Customer regression | Tenant-zero parity checklist; keep Next.js live until signed off |
| Shared DB noisy neighbour | Slow tenants | Indexes, partitioning by EventId later, query limits |
| Email deliverability on a shared domain | Lost confirmations | Dedicated sending domain, tenant DKIM in S2 |
| Slug squatting / abuse | Brand harm | Reserved slugs, abuse report, Promax suspend |
| PII export by a compromised committee account | Privacy incident | Role least privilege, export audit, optional MFA |
| Scope creep into ticketing | Late MVP | Ticketing stays S3 |
| Confusing SUPER_ADMIN vs Promax admin | Privilege bugs | Split roles; tests for both |

---

## 25. Open decisions

Product/engineering must record answers before S1 build starts:

1. Confirm product name **Eventa** (or reject in favour of an alternative in Section 2.3).
2. Path vs subdomain as the S1 public URL strategy.
3. Azure vs on-prem SQL Server for first production.
4. Whether Yoruba Day Canberra **cutover** to Eventa or remains on the current Next.js stack until after 22 November 2026.
5. Community plan: free with Eventa branding vs paid-only.
6. Who owns sending domain and legal privacy policy (Promax vs tenant DPA).
7. Whether external self-serve is open worldwide or waitlist + Australia-first.

---

## 26. Appendix A — Event Config contract (must not shrink)

The TypeScript `EventConfig` in `platform/core/types/event.ts` is the product contract. The API DTO and SQL model must include:

- Identity: `slug`, `name`, `tagline`, `presenter`, `organisation`, `platformBrand`
- Time: `eventIso`, `heroDateLine`, `heroDateDisplay`, `heroPlaceLine`, `calendar.startIso`, `calendar.endIso`, `calendar.timezone`
- Place: `location`, `venue.name`, `venue.fullAddress`, `venue.mapsUrl`
- Content: `description`, `launchCopy.*`, `navItems[]`, `experienceItems[]`
- Commerce interest: `sponsorTiers[]`, `ticketTypes[]`
- Contact: `email`, `phone`, `socialLinks[]`, `website`
- SEO: `title`, `description`, `canonicalUrl`, `ogImage`
- Branding: `espresso`, `cream`, `gold`, `goldMuted`, `bodyText`, `surface`, `border`, fonts

**Rule unchanged:** If another organisation could use it → engine. If it is Yoruba-specific → configuration.

---

## 27. Appendix B — Email template catalog (carry over)

| ID | Auto-active S1 |
|----|----------------|
| register-interest-confirmation | Yes |
| ticket-sales-open | Template only |
| ticket-confirmation | Template only |
| seat-qr-assignment | Template only |
| event-reminder | Template only |
| volunteer-confirmation | Template only |
| sponsor-thank-you | Template only |
| post-event-thank-you | Template only |

Footer must say **Powered by Eventa** (or the tenant’s `platformBrand` override on Enterprise).

---

## 28. Appendix C — Future RSVP journey (do not implement in S1)

`Register Interest → New → Contacted → Ticket Invited → Paid → Confirmed → Checked In → Completed`

S1 stops at Confirmed / Cancelled, exactly as production does today.

---

## 29. Appendix D — Glossary

| Term | Meaning |
|------|---------|
| Eventa | The SaaS product |
| Promax IT Solutions | Legal owner and platform operator |
| Organisation / tenant | Paying or community customer account |
| Event | A dated public gathering under an organisation |
| Engine | Isolated business capability (RSVP, Sponsors, …) |
| Event Config | Branding and marketing content for one event |
| Register Interest | Public lead capture; not a ticket |
| Tenant zero | Yoruba Day Canberra 2026 |
| Platform operator | Promax staff in the admin console |
| OWNER | Highest role inside an organisation |

---

## 30. Approval

| Role | Name | Decision | Date |
|------|------|----------|------|
| Promax IT Solutions (product owner) | | Name + scope | |
| Engineering lead | | Stack + tenancy | |
| Yoruba Association Canberra (flagship) | | Cutover timing | |
| Security / privacy | | Consent + isolation | |

---

*End of PRD v1.0 — Eventa by Promax. This document generalises the production Promax Event Platform; it does not replace the live Yoruba Day Canberra runbooks until a cutover is explicitly approved.*
