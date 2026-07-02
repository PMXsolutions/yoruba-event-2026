-- RSVP management columns for committee portal (safe to re-run)

alter table public.rsvps
  add column if not exists status text not null default 'new',
  add column if not exists internal_notes text,
  add column if not exists contacted_at timestamptz;

-- Ensure check constraint exists (ignore if already present)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'rsvps_status_check'
      and conrelid = 'public.rsvps'::regclass
  ) then
    alter table public.rsvps
      add constraint rsvps_status_check
      check (status in ('new', 'contacted', 'confirmed'));
  end if;
end $$;

comment on column public.rsvps.status is 'Committee workflow: new | contacted | confirmed';
comment on column public.rsvps.internal_notes is 'Internal committee notes — not shown to registrants';
comment on column public.rsvps.contacted_at is 'When the committee last marked this RSVP as contacted';

create index if not exists rsvps_status_idx on public.rsvps (status);
create index if not exists rsvps_contacted_at_idx on public.rsvps (contacted_at desc nulls last);
