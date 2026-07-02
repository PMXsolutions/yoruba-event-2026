-- RSVP table for Yoruba Day Canberra (run in Supabase SQL Editor or via Supabase CLI)

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  number_of_attendees integer not null default 1,
  ticket_type text,
  notes text,
  created_at timestamptz not null default now()
);

comment on table public.rsvps is 'Public RSVP interest submissions; inserts from app use service role.';

create index if not exists rsvps_created_at_idx on public.rsvps (created_at desc);
create index if not exists rsvps_email_idx on public.rsvps (email);

alter table public.rsvps enable row level security;

-- No policies for the anon key: public clients cannot read/write this table directly.
-- Server-side inserts use the service role key, which bypasses RLS.
