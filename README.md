# Promax Event Platform

**Version 1** — reusable event management software  
**First deployment:** [Yoruba Day Canberra 2026](https://github.com/PMXsolutions/yoruba-event-2026)

Built with Next.js 16, TypeScript, Tailwind CSS v4, Supabase, and Framer Motion.

> This repository is the **Promax Event Platform**, not a one-off website. Yoruba Day Canberra 2026 is the first customer configuration under `config/events/`.

---

## Current status (committee readiness)

| Area | Status | Owner |
|------|--------|-------|
| Public website content & presentation | Ready for committee review | Joshua |
| Committee presentation & feedback docs | Ready | Joshua |
| Business workflows (documented, proposed) | Ready for confirmation | Joshua + committee |
| Content checklist (TBC items) | Ready | Committee |
| Supabase migrations | Pending production apply | Damola |
| Vercel environment variables | Pending | Damola |
| Production `/api/health` → ok | Pending | Damola |
| Live Register Interest on production | Pending DB connection | Damola |
| Resend confirmation email | Optional | Damola |
| Committee portal sign-in | Future (Phase 2) | Joshua / engineering |
| Exact date, venue, prices, packages | Committee decisions | Committee |

**Go-live for public Register Interest:** only after Damola confirms `/api/health` is ok and a test submission appears in Supabase.

---

## Quick start (local)

```bash
npm install
cp .env.example .env.local   # Supabase + optional Resend
npm run preview              # recommended local preview
```

Open [http://localhost:3000](http://localhost:3000) · Committee portal: [/dashboard](http://localhost:3000/dashboard)

---

## Documentation

### Committee & business (start here for meetings)

| Doc | Description |
|-----|-------------|
| [docs/COMMITTEE_PRESENTATION.md](./docs/COMMITTEE_PRESENTATION.md) | **5-minute committee walkthrough** |
| [docs/COMMITTEE_FEEDBACK.md](./docs/COMMITTEE_FEEDBACK.md) | Feedback questions for the committee |
| [docs/BUSINESS_WORKFLOWS.md](./docs/BUSINESS_WORKFLOWS.md) | Proposed attendee / sponsor / volunteer flows |
| [docs/CONTENT_CHECKLIST.md](./docs/CONTENT_CHECKLIST.md) | Content still needing decisions |

### Platform & delivery

| Doc | Description |
|-----|-------------|
| [docs/PLATFORM.md](./docs/PLATFORM.md) | Platform overview & engines |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Vercel + Supabase deploy (Damola) |
| [docs/DAMOLA_HANDOVER.md](./docs/DAMOLA_HANDOVER.md) | Damola deployment checklist |
| [docs/DEMO_SCRIPT.md](./docs/DEMO_SCRIPT.md) | Longer demo script |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Phases 1–4 |
| [docs/QUALITY_AUDIT.md](./docs/QUALITY_AUDIT.md) | Quality audit & morning checklist |
| [docs/EMAIL.md](./docs/EMAIL.md) | Resend integration |
| [docs/SMS.md](./docs/SMS.md) | Twilio architecture (future) |
| [docs/AI.md](./docs/AI.md) | AI engine architecture (future) |
| [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Dev workflow |

---

## Platform structure

```
config/events/     Per-customer branding & content
platform/          Reusable engines (RSVP, notifications, dashboard, AI)
app/               Next.js routes
components/        Public UI + committee portal
docs/              Delivery, committee, and platform guides
```

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run preview` | Production build + start |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

---

## Environment variables

See [`.env.example`](./.env.example). Minimum for RSVP:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional for confirmation emails:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

**Damola owns** setting these on Vercel. Do not commit secrets.

---

## Ownership split

| Joshua (product / content / committee) | Damola (database / hosting) | Committee |
|----------------------------------------|-----------------------------|-----------|
| Public copy & presentation polish | Supabase migrations | Exact date & venue |
| Committee docs & feedback framework | Vercel env vars + redeploy | Ticket & sponsor packages |
| Workflow documentation | `/api/health` verification | Programme, performers, MC |
| Content checklist | Live RSVP test | Logos, socials, phone |
| Portal presentation labelling | Optional Resend setup | Cultural content decisions |

---

**Promax IT Solutions** · Event Management Software · Powered by Promax Event Platform
