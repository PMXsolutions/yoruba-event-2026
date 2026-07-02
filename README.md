# Promax Event Platform

**Version 1** — production-ready event management SaaS  
**First deployment:** [Yoruba Day Canberra 2026](https://github.com/PMXsolutions/yoruba-event-2026)

Built with Next.js 16, TypeScript, Tailwind CSS v4, Supabase, Framer Motion, and Nodemailer.

---

## Quick start

```bash
npm install
cp .env.example .env.local
npm run preview
```

Open [http://localhost:3000](http://localhost:3000) · Committee portal: [/dashboard](http://localhost:3000/dashboard) · Login: [/login](http://localhost:3000/login)

---

## Features

### Public site
- Immersive hero with countdown, RSVP / sponsor CTAs, and Save the Date (ICS, Google, Outlook, Apple)
- Programme timeline, speakers, experience, gallery with lightbox, sponsor packages + registration
- RSVP with premium confirmation (reference, QR placeholder, calendar links)
- Volunteer registration, FAQ accordion, contact with Google Maps
- Announcements banner (from Supabase)
- SEO: Schema.org Event, Open Graph, Twitter cards, dynamic OG image, `robots.txt`, `sitemap.xml`

### Committee portal (`/dashboard`)
- Supabase Authentication (committee members only)
- Role-based access control: Super Admin, Admin, Committee, Volunteer
- Dashboard widgets: RSVPs, sponsors, volunteers, announcements
- RSVP management: search, filter, CSV/Excel export, view, delete, email
- Sponsor management: approve/reject, export
- Volunteer assignments
- Announcement publishing

---

## Database setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run migrations in order via SQL Editor or CLI:
   - `supabase/migrations/20260112000000_create_rsvps.sql`
   - `supabase/migrations/20260702000000_platform_tables.sql`
3. Enable **Email** auth provider in Supabase Dashboard → Authentication → Providers
4. Create committee users:
   - Sign up a user in Supabase Auth (or invite via dashboard)
   - Insert into `committee_users` linking `user_id` to a `roles` row:

```sql
INSERT INTO committee_users (user_id, role_id, email, full_name)
SELECT
  '<auth-user-uuid>',
  id,
  'committee@example.com',
  'Committee Member'
FROM roles WHERE slug = 'admin';
```

### Tables
`rsvps`, `roles`, `permissions`, `role_permissions`, `committee_users`, `announcements`, `sponsors`, `volunteers`, `gallery`, `programme`, `speakers`, `faq`, `activity_log`

---

## Environment variables

Copy [`.env.example`](./.env.example) to `.env.local` (never commit secrets).

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key (auth + RLS reads) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side writes (RSVP, sponsors) |
| `SMTP_HOST` | For email | SMTP server hostname |
| `SMTP_PORT` | For email | Usually `587` |
| `SMTP_USER` | For email | SMTP username |
| `SMTP_PASSWORD` | For email | SMTP password |
| `MAIL_FROM` | For email | Sender email address |
| `MAIL_FROM_NAME` | Optional | Display name (e.g. `Yoruba Day Canberra 2026`) |
| `EVENT_SLUG` | Optional | Defaults to `yoruba-day-canberra-2026` |

Example `.env.local` (use your own credentials):

```env
SMTP_HOST=mail.example.com
SMTP_PORT=587
SMTP_USER=support@example.com
SMTP_PASSWORD=your-password
MAIL_FROM=support@example.com
MAIL_FROM_NAME="Yoruba Day Canberra 2026"
```

---

## Authentication

- Committee login at `/login` (protected by middleware)
- `/dashboard/*` routes require an authenticated Supabase user with an active `committee_users` record
- Permissions are enforced via `roles` → `role_permissions` → `permissions`

---

## Deployment (Vercel)

1. Push to GitHub and import in Vercel
2. Set all environment variables in Vercel project settings
3. Run Supabase migrations on your production database
4. Deploy and verify:
   - `GET /api/health` — Supabase connectivity
   - Submit a test RSVP on the public site
   - Sign in at `/login` with a committee account

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run preview` | Production build + start |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

---

## Project structure

```
app/                 Next.js App Router (public + dashboard + API)
components/          UI sections, features, dashboard, SEO
config/events/       Per-event content (Yoruba Day Canberra 2026)
lib/                 Auth, calendar, mail, data, Supabase clients
platform/engines/    RSVP, notifications, validation
supabase/migrations/ Database schema
```

---

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/PLATFORM.md](./docs/PLATFORM.md) | Platform overview |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Vercel + Supabase |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Future phases |
