# Contributing

Thank you for helping build the Yoruba Association Canberra digital platform.

---

## Getting started

1. Clone the repository:

   ```bash
   git clone https://github.com/PMXsolutions/yoruba-event-2026.git
   cd yoruba-event-2026
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment template:

   ```bash
   cp .env.example .env.local
   ```

4. Fill in Supabase values (see [README](../README.md)).

5. Run local preview:

   ```bash
   npm run preview
   ```

   Open http://localhost:3000

---

## Development workflow

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (Turbopack — may hang on first compile) |
| `npm run preview` | Production build + start (recommended) |
| `npm run build` | Production build only |
| `npm run lint` | ESLint |

---

## Git workflow

1. Create a feature branch from `main`.
2. Make focused changes with clear commit messages.
3. Run `npm run lint` and `npm run build` before pushing.
4. Open a pull request to `main`.
5. **Never commit** `.env.local` or secrets.

---

## Cursor workflow (Joshua / Damola)

1. Open project in Cursor.
2. Use `.env.local` locally — never paste secrets into chat.
3. Ask Cursor to run lint/build before committing.
4. Push to GitHub; Damola deploys via Vercel.

---

## Code conventions

- TypeScript strict mode
- `@/` path alias for imports
- Server-only Supabase admin client — never import in client components
- Content constants in `lib/site.ts`
- Zod schemas in `lib/validation/`
- `"use client"` only where interactivity or hooks are required

---

## What not to change without approval

- `.env.local` or production Vercel env vars
- GitHub repository visibility
- Ticket prices, sponsor amounts, or confirmed event date
- Payment or authentication implementations (Phase 2+)

---

## Questions

Contact the project lead or email **info@yorubadaycanberra.org**.
