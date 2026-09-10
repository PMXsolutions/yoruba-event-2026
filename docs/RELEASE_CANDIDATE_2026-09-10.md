# Release candidate — 10 September 2026

**Decision: NO-GO for production launch until the production database and end-to-end delivery checks below pass.** Local fixes are prepared; production has not been changed.

Repository: PMXsolutions/yoruba-event-2026. Base: `39f0e32` (main, PR #17 merge). Working branch: `release/production-readiness`. This is a fresh clone: uncommitted Cursor work on another computer is not included. No business content, pricing, venue, programme, or sponsor amounts changed.

## Verified findings

- Live homepage and login return HTTP 200. Unauthenticated `/dashboard` redirects to login in the browser.
- Live `/api/health` returns HTTP **503**, `SUPABASE_QUERY_FAILED`, `supabase:false`, `env:true`, `authConfigured:true`, `emailConfigured:true`, transport SMTP, email confirmation flag enabled. Configuration presence is not connectivity, authentication, provider acceptance, or inbox-delivery proof.
- The remote main branch has the consent migration but lacks the delivery-status migration reported as locally uncommitted in August.
- The previous code discarded consent/status fields on schema errors and accepted a legacy insert; status updates suppressed failures and could match no row without detection. Dispatch depended on an optional returned insert ID and wrote status only after sending.
- The old route guard checked Supabase sign-in, while dashboard service-role reads did not independently require an active authorised profile. The auth flag could bypass the proxy even in production.

## Changes prepared

- RSVP insertion generates a UUID before persistence and atomically stores it, consent, and `email_status=pending`. No legacy insertion fallback. Missing schema fails visibly before claiming success.
- Email dispatcher persists disabled, consent_declined, not_configured, or pending before provider work; then sent or failed. Missing ID and tracking failures are explicit errors. No email is sent if its initial tracking write fails. The public action preserves an already-saved RSVP if notification work fails.
- Email status writes verify a matching row. Resends clear obsolete provider/timestamp fields and respect saved email consent. Dashboard reads no longer hide missing communication columns behind invented defaults; the timeline displays skipped/disabled/pending outcomes.
- Pending means the outcome is unconfirmed. A killed process or failed final database update can leave pending. Review provider logs before resending; there is no automatic retry worker or exactly-once delivery guarantee. Sent means the provider accepted the message, not proof of inbox delivery. Historical skipped/not_attempted rows are retained without inventing outcomes.
- Resend HTTP calls have a 20-second timeout. SMTP retains TLS enforcement and existing socket/connection/greeting timeouts; transport closes after both success and failure.
- Production dashboard authentication is mandatory. Layout and protected service-role reads check active profiles/permissions. Login return navigation is restricted to dashboard paths. Production insert/delete diagnostic endpoint is always disabled.
- Unknown consent strings fail validation instead of becoming true.
- Next.js and eslint-config-next updated to 16.3.4, Nodemailer to 10.0.3; compatible transitive patches applied in package-lock.json. Dependency audit reports zero vulnerabilities at verification time.
- Health checks select required RSVP communication columns; deployment verification also requires auth/email configuration, enabled confirmations, and an unauthenticated dashboard redirect.

## Validation

- ESLint: passed.
- TypeScript: passed.
- Automated tests: 15 passed, using actual application modules with mocked database/provider boundaries. Cover provider acceptance/failure/exception, disabled/declined/unconfigured paths, tracking failure, missing IDs, no-row updates, mandatory production auth, invalid consent, atomic ID/status insert, absent migration rejection, inactive profiles, and saved RSVP preservation.
- Production compilation: `npx next build --webpack` passed. Default Turbopack build could not complete in this host sandbox: Google font networking required escalation, then a PostCSS child process was denied port binding. Webpack is a supported build alternative; validate the normal `npm run build` in CI/Vercel before merge. No font mock was used.
- Local production server: homepage/form rendered; submitting a local test address with no configured database produced a clear configuration error, not false success.
- Live read-only smoke: homepage/login pass; unauthenticated dashboard redirect passes; database health fails as above.
- Not verified: real Supabase migration execution, production policies, real successful sign-in/sign-out, active/disabled user access on production, successful production RSVP insert, real SMTP acceptance/inbox receipt, authenticated dashboard state, and production flag overrides beyond the public health output. No production test message was sent.

## Migration inventory and exact production steps

All six files are now present under `supabase/migrations/`, in this order:

1. `20260112000000_create_rsvps.sql`
2. `20260702100000_rsvp_management_columns.sql`
3. `20260703100000_rsvp_crm_enhancements.sql`
4. `20260805100000_platform_production.sql`
5. `20260810100000_rsvp_comms_consent.sql`
6. `20260810120000_rsvp_delivery_status_labels.sql` — new in this candidate.

**Production application state is unknown for every file.** Do not interpret local presence as application, or blindly rerun older migrations. In particular, rerunning migration 5 after migration 6 reinstates an older status constraint.

1. Open the correct Supabase project and confirm it is running. In Vercel, inspect the production `/api/health` function error to distinguish unreachable/paused project, credential mismatch, and schema errors. Verify the production URL and server service-role key belong to that same project without copying secrets into messages or source control.
2. Run `supabase/verify-release.sql` read-only in SQL Editor. If `supabase_migrations.schema_migrations` does not exist, run the remaining statements separately and compare the actual schema/policies; manual SQL Editor applications may have no migration ledger. This script returns metadata and aggregate statuses only.
3. Apply only missing prerequisite migrations, in order, after reviewing their contents against the existing production schema. Migration 4 contains pre-existing event seed content: retain only already-approved project content; this candidate does not authorise changing event details. Apply migration 6 after confirming migration 5 is fully present. It adds allowed statuses and changes the default without changing existing outcomes or deleting registrations. Use the project's normal backup/migration process.
4. Re-run the read-only verification: all required columns present, email default pending, check constraint includes new and legacy statuses, application RLS enabled, expected policies present. Compare migration ledger and actual schema. SQL execution/constraint correctness still needs a real PostgreSQL run.
5. Verify Vercel Production variables in the service UI: Supabase URL/anon/server keys, intended active event slug, MAIL_FROM and SMTP host/port/user/password (or existing Resend configuration). Preserve the authorised sender; do not invent or change domains. A configured status alone is insufficient.
6. Confirm intended launch flags: `PUBLIC_REGISTRATION_OPEN=true`, `EMAIL_CONFIRMATIONS_ENABLED=true`, `SMS_ENABLED=false`, `NOTIFY_SMS_ENABLED=false` (legacy alias can enable SMS), `DASHBOARD_AUTH_REQUIRED=true`. Production enforces auth regardless of its flag. Keep registration closed while the database is failing if operationally required; no production flag was changed here.
7. Build/test in CI with `npm ci`, `npm run lint`, `npm test`, `npm run build`. If the hosting environment also cannot run Turbopack, use `npx next build --webpack` as the reviewed deployment build command. Merge/deploy only after migrations and checks pass. Public Supabase variables are build-time inputs; redeploy after changing them.
8. Run `npm run verify:deployment` against production. Require `/api/health` HTTP 200 and all checks passing.
9. With an existing active committee account, verify sign-in, RSVP list/detail access, authorised edits, and sign-out. Verify an inactive/unprovisioned authenticated account cannot read dashboard data. Existing password recovery points back to login and has no dedicated password-update screen in this repository: use administrator-assisted account recovery for launch, and do not represent self-service recovery as verified or ready.
10. Use a user-approved test recipient to submit one fresh RSVP (existing 24-hour duplicate prevention applies). Record its reference and ID. Confirm exactly one saved registration, matching consent, pending before send, provider acceptance, terminal dashboard status, and inbox/spam receipt. Confirm this is the production deployment of this candidate. Do not use an arbitrary third-party address.
11. Verify declined consent produces consent_declined and sends nothing. Exercise disabled/unconfigured/provider-failure cases in a staging environment, not by breaking live configuration. Confirm the registration survives failures. Check provider logs for stale pending before a manual resend to avoid duplicates.

## Commit/push/merge handoff

Changes remain local for review; no push, merge, production deployment, or database mutation was performed. Review with `git diff` (or `git diff --cached` if staged). Suggested commit: `Fix RSVP delivery tracking and harden production access`. Push the release branch and open a PR against main after review. Do not overwrite independent uncommitted Cursor fixes: compare them with this branch before combining.

Remaining access needed: authenticated Supabase/Vercel project access, an existing committee session, and a user-approved recipient for the real delivery test. Those are required to resolve the current live failure and approve launch.

## Follow-up: confirmed account/project mismatch

During the authenticated browser inspection, the screenshot project `vfmhjosbzudasunbsijf` (yoruba-day-canberra-2026) changed from Unhealthy to Healthy. Its public schema shows no tables. This is **not** the Supabase URL compiled into the live app's login JavaScript: that URL is `https://fuuorypigipziozrxoxm.supabase.co` (public configuration, not a secret).

Opening that original project under the current Supabase session returned **You do not have access to this project**. Vercel's original `promax-it-solutions/yoruba-event-2026` URL returned 404 under the signed-in account `alukojoshfx@gmail.com`; the team selector showed only Joshua's projects. The original project's current server environment cannot yet be inspected, so the compiled public URL is evidence of the client configuration, not independent proof of every server variable.

Production health was checked again: still HTTP 503 / SUPABASE_QUERY_FAILED. No tables were created in the empty project and no production settings were replaced. Recover access to the original Supabase project and original Vercel team before deciding whether migration to the empty project is necessary. Preserve original registrations and authentication users.

## Fresh account deployment progress

Joshua confirmed all old registrations were tests and authorised a fresh deployment in his accounts, leaving the original intact.

- Created Vercel project `joshuas-projects-8c8851bf/yoruba-event-2026`. No deployment yet. Import created 17 template environment entries. Public-prefixed variables were incorrectly typed as Secret; Vercel refuses editing their values as Secret and refuses creating same-name Config entries. They need replacement with Config entries before deployment. No database keys saved to Vercel yet.
- Verified Supabase `vfmhjosbzudasunbsijf` public schema was empty, then applied a consolidated fresh setup derived from the seven migration files. The event seed contains only slug, name, and timezone; no unconfirmed date, venue, contact or programme seed was inserted. This was SQL Editor execution, not a CLI migration ledger application.
- All nine application tables verified with `relrowsecurity=true`.
- Added migration `20260910000000_profile_access_hardening.sql`: ignores untrusted signup role metadata, creates inactive profiles, and prevents self-update escalation. Existing profiles are not modified by this migration.
- Executed `supabase/test-profile-access.sql` on the fresh project: PASS. Metadata claiming SUPER_ADMIN produced inactive COMMITTEE; an authenticated self-promotion affected zero rows. Synthetic test user/profile rolled back. No test emails sent.
- `supabase/fresh-project-setup.sql` is the reviewed full-script equivalent for an EMPTY project only; browser execution consolidated intermediate alterations and omitted comments. Do not rerun it blindly against a live populated project. Further schema/default/constraint verification and real auth/RSVP/email checks remain required.
- API keys were read only into transient browser-tool variables with outputs redacted, following Joshua's specific approval to transfer them into the new Vercel project. They have not been written to Git or chat.

Remaining: replace the two incorrect public-variable template entries, configure database and email secrets plus flags, provision Joshua's login, deploy the release branch, and verify real registration/delivery/dashboard. Earlier original-production findings above remain historical; they do not describe this fresh project's schema.

### Environment replacement checkpoint

User explicitly approved deletion/recreation of both public Supabase entries. Vercel confirmed removal of NEXT_PUBLIC_SUPABASE_URL. NEXT_PUBLIC_SUPABASE_ANON_KEY deletion dialog was open, but repeated browser input timeouts prevented confirmation of its removal. Neither replacement Config entry has been created. No further approval is needed for those two replacements.

### Confirmed public-variable removal

Joshua's screenshot and a subsequent authenticated page inspection confirm NEXT_PUBLIC_SUPABASE_ANON_KEY was also removed. Both public entries now need recreation as Config. Browser input remains blocked by repeated connection timeouts and a native no-windows error. No replacement values were saved. SMTP password remains unavailable locally; it must be entered securely into the new project's SMTP_PASSWORD setting before email validation.

### Dedicated sender mailbox checkpoint

User explicitly approved creating yoruba-events@promaxcare.com.au. SmarterASP Email Manager confirmed creation and listed seven mailboxes, including the new mailbox. Existing support mailbox was not changed. Provider UI confirms secure SMTP hostname mail5010.site4now.net and ports 465/587.

Updated new Joshua-team Vercel project variables in Production and Preview: SMTP_PASSWORD (new random secret, never printed or committed), SMTP_HOST=mail5010.site4now.net, SMTP_PORT=465, SMTP_USER and MAIL_FROM=yoruba-events@promaxcare.com.au, MAIL_FROM_NAME=Yoruba Association in the ACT. Password save returned success. Deployment and actual SMTP authentication/delivery remain unverified; do not report email operational yet.
