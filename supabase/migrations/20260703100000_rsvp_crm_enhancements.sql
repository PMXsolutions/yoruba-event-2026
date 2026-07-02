-- RSVP CRM enhancements: committee notes, tags, cancelled status (safe to re-run)

-- Committee notes (rename path from internal_notes)
alter table public.rsvps add column if not exists committee_notes text;

update public.rsvps
set committee_notes = internal_notes
where committee_notes is null
  and internal_notes is not null;

-- Classification tags (multiple per registrant)
alter table public.rsvps add column if not exists tags text[] not null default '{}';

-- Expand status workflow to include cancelled
alter table public.rsvps drop constraint if exists rsvps_status_check;

alter table public.rsvps
  add constraint rsvps_status_check
  check (status in ('new', 'contacted', 'confirmed', 'cancelled'));

comment on column public.rsvps.status is
  'Interest registration follow-up: new | contacted | confirmed | cancelled — not an approval workflow';
comment on column public.rsvps.committee_notes is
  'Committee notes for relationship management — not shown to registrants';
comment on column public.rsvps.tags is
  'Classification tags e.g. VIP, Sponsor Lead, Volunteer — not workflow status';

create index if not exists rsvps_tags_gin_idx on public.rsvps using gin (tags);
