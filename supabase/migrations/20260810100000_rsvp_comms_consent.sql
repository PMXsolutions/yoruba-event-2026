-- RSVP communication consent + delivery status (safe to re-run)
-- Promax Event Platform · Public Launch Communication Experience

alter table public.rsvps
  add column if not exists email_consent boolean not null default true;

alter table public.rsvps
  add column if not exists sms_consent boolean not null default false;

alter table public.rsvps
  add column if not exists marketing_consent boolean not null default false;

alter table public.rsvps
  add column if not exists email_status text not null default 'not_attempted';

alter table public.rsvps
  add column if not exists email_sent_at timestamptz;

alter table public.rsvps
  add column if not exists email_provider_id text;

alter table public.rsvps
  add column if not exists sms_status text not null default 'not_attempted';

alter table public.rsvps
  add column if not exists sms_sent_at timestamptz;

alter table public.rsvps
  add column if not exists sms_provider_id text;

-- Constraints (drop/recreate for idempotency)
alter table public.rsvps drop constraint if exists rsvps_email_status_check;
alter table public.rsvps
  add constraint rsvps_email_status_check
  check (email_status in ('not_attempted', 'sent', 'failed', 'not_configured', 'skipped'));

alter table public.rsvps drop constraint if exists rsvps_sms_status_check;
alter table public.rsvps
  add constraint rsvps_sms_status_check
  check (sms_status in ('not_attempted', 'sent', 'failed', 'disabled', 'not_configured', 'skipped'));

comment on column public.rsvps.email_consent is
  'Registrant consented to email updates about this event';
comment on column public.rsvps.sms_consent is
  'Registrant explicitly opted in to SMS — never pre-ticked';
comment on column public.rsvps.marketing_consent is
  'Optional consent for broader community / marketing updates';
comment on column public.rsvps.email_status is
  'Confirmation email delivery: not_attempted | sent | failed | not_configured | skipped';
comment on column public.rsvps.sms_status is
  'Confirmation SMS delivery: not_attempted | sent | failed | disabled | not_configured | skipped';

create index if not exists rsvps_email_status_idx on public.rsvps (email_status);
create index if not exists rsvps_sms_status_idx on public.rsvps (sms_status);
