# Seating MVP

Promax Event Platform · practical seating foundation (no drag-and-drop designer yet)

---

## What is live

| Capability | Status |
|------------|--------|
| Floor plan URL / reference upload (metadata only) | Live (`/dashboard/seating`) |
| Tables with name, zone, capacity | Live |
| Zones (VIP, Elders, Families, Sponsors, General, Performers, Committee, Accessibility) | Live |
| Guest seat assignment (zone / table / seat) | Live |
| Opaque QR token per assignment | Live |
| Steward CSV export | Live |
| Public seat lookup (`/seat`) | Live (single-guest lookup; no full list) |
| Committee check-in | Live (`/dashboard/check-in`) |

## What is demo / future

- Visual drag-and-drop floor plan designer
- Camera-based QR scanner UI (search/token paste is the foundation)
- Automatic seating emails (draft template only)

## Security

- Floor plan stores a **URL or file reference**, never private storage credentials
- QR payload is `/seat?t=<opaque-token>` — attendee PII resolved server-side
- Public lookup returns one match; ambiguous name searches require a registration reference
- Dashboard seating / check-in require authentication

## Feature flags

- `SEATING_ENABLED` (default true)
- `QR_CHECKIN_ENABLED` (default true)

## Migration

Apply `supabase/migrations/20260805120000_seating_and_rsvp_extensions.sql` (also appended to `supabase/run-all-migrations.sql`).

Creates / extends:

- `rsvps` accessibility / dietary / source / created_by
- `venue_floor_plans`
- `seating_tables`
- `seating_assignments` (+ `qr_token`, check-in columns)
