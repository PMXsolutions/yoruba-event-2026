# Yoruba Day Canberra 2026

Premium marketing site for **Yoruba Day Canberra 2026**, presented by **Yoruba Association Canberra**. Built with [Next.js](https://nextjs.org) (App Router), TypeScript, Tailwind CSS v4, and [Framer Motion](https://www.framer.com/motion/).

## Prerequisites

- Node.js 20+ (recommended)
- npm (or pnpm / yarn)
- A [Supabase](https://supabase.com) account (free tier is fine) for RSVP storage

## Environment variables

1. Copy the example file and fill in your project values:

   ```bash
   cp .env.example .env.local
   ```

2. Set the variables described in [`.env.example`](./.env.example):

   | Variable | Where to find it | Usage |
   |----------|------------------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → **Project Settings** → **API** → **Project URL** | Browser + server |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → **anon public** key | Browser client (`lib/supabase/client.ts`); not used for RSVP writes today |
   | `SUPABASE_SERVICE_ROLE_KEY` | Same page → **service_role** key (reveal once) | **Server only** — RSVP Server Action (`lib/supabase/admin.ts`) |

   **Security:** never put `SUPABASE_SERVICE_ROLE_KEY` in client-side code, public repos, or `NEXT_PUBLIC_*` variables. It bypasses Row Level Security.

## Supabase setup (RSVP database)

### 1. Create a project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Wait until the database is ready.

### 2. Create the `rsvps` table

1. Open **SQL Editor** in the Supabase dashboard.
2. Paste and run the SQL from [`supabase/migrations/20260112000000_create_rsvps.sql`](./supabase/migrations/20260112000000_create_rsvps.sql).

   This creates `public.rsvps` with:

   - `id` (uuid, primary key, default `gen_random_uuid()`)
   - `full_name`, `email` (required), `phone` (optional)
   - `number_of_attendees` (integer, default `1`)
   - `ticket_type`, `notes` (optional text)
   - `created_at` (timestamptz, default `now()`)

3. **Row Level Security** is enabled with **no policies** for the anonymous key, so the public anon client cannot insert or select rows. The Next.js app inserts using the **service role** client on the server only.

### 3. Connect the app

1. Add your URL and keys to `.env.local` (see table above).
2. Restart the dev server after changing env vars:

   ```bash
   npm run dev
   ```

3. Submit the RSVP form on the home page and confirm a new row appears in Supabase **Table Editor** → `rsvps`.

### 4. Production (e.g. Vercel)

Add the same three variables in your host’s environment settings. The service role key must remain server-side only (Vercel “Environment Variables” without `NEXT_PUBLIC_` prefix for `SUPABASE_SERVICE_ROLE_KEY`).

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run lint    # ESLint
```

## Project structure (high level)

- `app/` — App Router pages and layout
- `app/actions/rsvp.ts` — Server Action: validate + insert RSVP via Supabase service role
- `components/` — UI sections and layout
- `lib/supabase/` — Supabase browser + service-role clients
- `lib/validation/rsvp.ts` — Zod schema shared for validation logic
- `supabase/migrations/` — SQL you can run or track with Supabase CLI

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase + Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
