# Promax Event Platform

**Version 1** — reusable event management SaaS  
**First deployment:** [Yoruba Day Canberra 2026](https://github.com/PMXsolutions/yoruba-event-2026)

Built with Next.js 16, TypeScript, Tailwind CSS v4, Supabase, and Framer Motion.

> This repository is the **Promax Event Platform**, not a one-off website. Yoruba Day Canberra 2026 is the first customer configuration under `config/events/`.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # Supabase + optional Resend
npm run preview              # recommended local preview
```

Open [http://localhost:3000](http://localhost:3000) · Committee portal: [/dashboard](http://localhost:3000/dashboard)

---

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/PLATFORM.md](./docs/PLATFORM.md) | **Platform overview & engines** |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Vercel + Supabase deploy |
| [docs/EMAIL.md](./docs/EMAIL.md) | Resend integration |
| [docs/SMS.md](./docs/SMS.md) | Twilio architecture (future) |
| [docs/AI.md](./docs/AI.md) | AI engine architecture (future) |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Phases 1–4 |
| [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Dev workflow |

---

## Platform structure

```
config/events/     Per-customer branding & content
platform/          Reusable engines (RSVP, notifications, dashboard, AI)
app/               Next.js routes
components/        Public UI + committee portal
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

---

## Deploy checklist (Damola)

1. Push latest to GitHub
2. Import in Vercel · set env vars
3. Run Supabase migration
4. Verify `/api/health` → `ok`
5. Test Register Interest + optional email

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

---

**Promax IT Solutions** · Event Management SaaS
