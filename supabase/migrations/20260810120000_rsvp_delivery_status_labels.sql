-- Apply after 20260810100000_rsvp_comms_consent.sql.
-- Preserve historical states: skipped does not prove consent was declined.
begin;
alter table public.rsvps drop constraint if exists rsvps_email_status_check;
alter table public.rsvps add constraint rsvps_email_status_check
  check (email_status in ('not_attempted', 'pending', 'sent', 'failed', 'disabled', 'consent_declined', 'not_configured', 'skipped'));
alter table public.rsvps alter column email_status set default 'pending';
comment on column public.rsvps.email_status is
  'pending = outcome unconfirmed; sent = provider accepted, not proof of inbox delivery. Historical not_attempted/skipped retained.';
commit;
