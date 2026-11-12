# Daily Yoruba Day communications — 13 November 2026

- Attendee email and SMS: 10 am Australia/Sydney, 13–21 November inclusive.
- Committee report: 6 pm Sydney, 13–21 November inclusive.
- Recovery windows: 10–11:59 am and 6–7:59 pm; no overnight or previous-day backlog.
- Server timer checks every minute; GitHub scheduler wakes IIS during these windows. GitHub schedule delivery can be delayed. If the host is unavailable for the whole window, that day's send is missed rather than burst-sent later.
- Consent is checked per channel and cancelled registrations are excluded. No payment reminders or RSVP cutoff wording.
- Reports go individually to active COMMITTEE/ADMIN/SUPER_ADMIN profiles, excluding the bootstrap admin address. Guest count is the sum of attendees on non-cancelled registrations, not registration count.
- Daily SQL claims keyed by event/day/type/hashed recipient prevent repeated and concurrent sends. Claims are written before provider calls. Failed/unknown/claimed outcomes require provider review; they are not automatically retried and cannot prove delivery.
- Settings contains dry-run counts, delivery status and test email/SMS controls. Tests are individually capped per recipient/type/day and do not enrol recipients.
- `/api/communications/run` requires either an admin session and approved same-origin request, or a five-minute HMAC signature from the existing deployment secret. GET requires admin settings permission. No unauthenticated mail trigger.
- The new `daily_communications` table is additive. Existing records/consent are not replaced.

## Rollback
Revert this release's application changes and disable the Daily event communications GitHub workflow. Keep the additive ledger table for audit/dedup; do not restore or replace the hosted database. `DAILY_COMMUNICATIONS_ENABLED=false` disables the runner if set on the host. A previous release returns 404 to the scheduler, which sends nothing.

## Verification limits
Unit/integration tests cover time boundaries, credentials, consent/cancellation, concurrency, retries, and report escaping. Live test results must be checked separately; provider acceptance is not inbox/handset delivery. Exact future timed execution is only evidenced after the first scheduled run.
