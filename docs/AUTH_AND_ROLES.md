# Auth and Roles

Promax Event Platform · committee portal security

---

## Live now

- Supabase Auth for committee users (`/login`)
- `proxy.ts` redirects unauthenticated users away from `/dashboard/*`
- Server actions use `requireAuth(permission)`
- Roles in DB / RBAC today: `SUPER_ADMIN`, `ADMIN`, `COMMITTEE`, `VOLUNTEER`
- Feature flag `DASHBOARD_AUTH_REQUIRED` defaults to **true** (do not disable in production)

## Minimum product roles (target map)

| Product role | Current platform role | Notes |
|--------------|----------------------|-------|
| Platform Admin | `SUPER_ADMIN` / `ADMIN` | Full ops |
| Event Director | `ADMIN` | Full event ops |
| Committee Member | `COMMITTEE` | Read/write most modules |
| RSVP Manager | `COMMITTEE` (+ `rsvp.*`) | Use COMMITTEE until finer roles ship |
| Sponsor Manager | `COMMITTEE` (+ `sponsor.*`) | Same |
| Volunteer Coordinator | `COMMITTEE` (+ `volunteer.*`) | Same |
| Programme Coordinator | `COMMITTEE` (+ `programme.*`) | Same |
| Read Only | `VOLUNTEER` (limited) | Read-focused permissions |

## Next step (not blocking this release)

Implement named product roles as first-class `profiles.role` values with permission matrices, without leaving the dashboard public. Authentication-first is already complete.

## Credentials required

| Item | Owner |
|------|-------|
| Supabase Auth enabled | Damola |
| Committee user accounts / invite | Damola + Joshua |
| `ADMIN_*` bootstrap via `npm run provision-admin` | Damola |
