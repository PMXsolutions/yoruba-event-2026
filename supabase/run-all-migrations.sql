-- =============================================================================
-- Promax Event Platform — run ALL migrations (ordered)
-- Paste into Supabase Dashboard → SQL Editor → New query → Run
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE where applicable)
-- =============================================================================


-- ---------------------------------------------------------------------------
-- FILE: supabase/migrations/20260112000000_create_rsvps.sql
-- ---------------------------------------------------------------------------

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


-- ---------------------------------------------------------------------------
-- FILE: supabase/migrations/20260702100000_rsvp_management_columns.sql
-- ---------------------------------------------------------------------------

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


-- ---------------------------------------------------------------------------
-- FILE: supabase/migrations/20260703100000_rsvp_crm_enhancements.sql
-- ---------------------------------------------------------------------------

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


-- ---------------------------------------------------------------------------
-- FILE: supabase/migrations/20260805100000_platform_production.sql
-- ---------------------------------------------------------------------------

-- Promax Event Platform — production modules
-- Extends existing RSVP schema. Safe to re-run (IF NOT EXISTS / OR REPLACE).
-- Does not destroy existing RSVP data.

-- ── Events registry (multi-event readiness) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  event_date DATE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'Australia/Sydney',
  location TEXT,
  address TEXT,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_slug_idx ON public.events (slug);
CREATE INDEX IF NOT EXISTS events_is_active_idx ON public.events (is_active);

INSERT INTO public.events (
  slug, name, tagline, event_date, start_time, end_time, timezone,
  location, address, description, contact_email, website
) VALUES (
  'yoruba-day-canberra-2026',
  'Yoruba Day Canberra 2026',
  'An elevated celebration of Yoruba culture in Canberra',
  '2026-11-22',
  '2026-11-22T14:00:00+11:00',
  '2026-11-22T22:00:00+11:00',
  'Australia/Sydney',
  'Canberra, ACT',
  'Canberra, ACT, Australia',
  'Yoruba Day Canberra 2026 — language, music, dress, cuisine, and community unity on Ngunnawal country.',
  'info@yorubadaycanberra.org',
  'https://yorubadaycanberra.org'
)
ON CONFLICT (slug) DO NOTHING;

-- ── RSVP production columns ─────────────────────────────────────────
ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS event_slug TEXT,
  ADD COLUMN IF NOT EXISTS registration_reference TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.rsvps
SET event_slug = 'yoruba-day-canberra-2026'
WHERE event_slug IS NULL;

ALTER TABLE public.rsvps
  ALTER COLUMN event_slug SET DEFAULT 'yoruba-day-canberra-2026';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rsvps' AND column_name = 'event_slug'
  ) THEN
    ALTER TABLE public.rsvps ALTER COLUMN event_slug SET NOT NULL;
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS rsvps_registration_reference_uidx
  ON public.rsvps (registration_reference)
  WHERE registration_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS rsvps_event_slug_idx ON public.rsvps (event_slug);
CREATE INDEX IF NOT EXISTS rsvps_event_status_idx ON public.rsvps (event_slug, status);

-- Backfill registration references for existing rows
UPDATE public.rsvps
SET registration_reference = 'YDC-' || upper(substr(replace(id::text, '-', ''), 1, 8))
WHERE registration_reference IS NULL;

-- ── Profiles (committee RBAC) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'COMMITTEE'
    CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'COMMITTEE', 'VOLUNTEER')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);

-- Auto-create profile stub on auth signup (role must be elevated by admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'COMMITTEE')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Sponsors ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug TEXT NOT NULL DEFAULT 'yoruba-day-canberra-2026',
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  package TEXT NOT NULL,
  message TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'approved', 'declined', 'active', 'completed')),
  committee_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sponsors_event_slug_idx ON public.sponsors (event_slug);
CREATE INDEX IF NOT EXISTS sponsors_status_idx ON public.sponsors (status);
CREATE INDEX IF NOT EXISTS sponsors_created_at_idx ON public.sponsors (created_at DESC);
CREATE INDEX IF NOT EXISTS sponsors_email_idx ON public.sponsors (email);

-- ── Volunteers ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug TEXT NOT NULL DEFAULT 'yoruba-day-canberra-2026',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  availability TEXT,
  area_of_interest TEXT,
  assigned_role TEXT,
  notes TEXT,
  committee_notes TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'approved', 'assigned', 'declined', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS volunteers_event_slug_idx ON public.volunteers (event_slug);
CREATE INDEX IF NOT EXISTS volunteers_status_idx ON public.volunteers (status);
CREATE INDEX IF NOT EXISTS volunteers_email_idx ON public.volunteers (email);

-- ── Tasks ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug TEXT NOT NULL DEFAULT 'yoruba-day-canberra-2026',
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'blocked', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_event_slug_idx ON public.tasks (event_slug);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks (status);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON public.tasks (priority);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON public.tasks (due_date);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON public.tasks (assigned_to);

-- ── Programme items (operational / editable) ────────────────────────
CREATE TABLE IF NOT EXISTS public.programme_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug TEXT NOT NULL DEFAULT 'yoruba-day-canberra-2026',
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  location TEXT,
  speaker TEXT,
  category TEXT,
  display_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS programme_items_event_slug_idx ON public.programme_items (event_slug);
CREATE INDEX IF NOT EXISTS programme_items_order_idx ON public.programme_items (event_slug, display_order);
CREATE INDEX IF NOT EXISTS programme_items_published_idx ON public.programme_items (published);

-- ── Announcements ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug TEXT NOT NULL DEFAULT 'yoruba-day-canberra-2026',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS announcements_event_slug_idx ON public.announcements (event_slug);
CREATE INDEX IF NOT EXISTS announcements_published_idx
  ON public.announcements (is_published, published_at DESC);

-- ── Activity logs ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug TEXT NOT NULL DEFAULT 'yoruba-day-canberra-2026',
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_logs_event_slug_idx ON public.activity_logs (event_slug);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON public.activity_logs (created_at DESC);

-- ── updated_at helper ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'events', 'rsvps', 'profiles', 'sponsors', 'volunteers',
    'tasks', 'programme_items', 'announcements'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_%s_updated_at ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- ── RLS ─────────────────────────────────────────────────────────────
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programme_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
-- rsvps already has RLS enabled from earlier migration

-- Helper: current user is an active committee profile
CREATE OR REPLACE FUNCTION public.is_committee_member()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'COMMITTEE', 'VOLUNTEER')
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles
  WHERE id = auth.uid() AND is_active = true
  LIMIT 1;
$$;

-- Events: public can read active events
DROP POLICY IF EXISTS "Public read active events" ON public.events;
CREATE POLICY "Public read active events" ON public.events
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Committee manage events" ON public.events;
CREATE POLICY "Committee manage events" ON public.events
  FOR ALL USING (public.current_user_role() IN ('SUPER_ADMIN', 'ADMIN'))
  WITH CHECK (public.current_user_role() IN ('SUPER_ADMIN', 'ADMIN'));

-- Profiles: users read own; admins manage
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_committee_member());

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.current_user_role() IN ('SUPER_ADMIN', 'ADMIN'));

-- Sponsors: no public read of CRM; service role inserts via server actions
DROP POLICY IF EXISTS "Committee read sponsors" ON public.sponsors;
CREATE POLICY "Committee read sponsors" ON public.sponsors
  FOR SELECT USING (public.is_committee_member());

DROP POLICY IF EXISTS "Committee write sponsors" ON public.sponsors;
CREATE POLICY "Committee write sponsors" ON public.sponsors
  FOR ALL USING (public.current_user_role() IN ('SUPER_ADMIN', 'ADMIN', 'COMMITTEE'))
  WITH CHECK (public.current_user_role() IN ('SUPER_ADMIN', 'ADMIN', 'COMMITTEE'));

-- Volunteers
DROP POLICY IF EXISTS "Committee read volunteers" ON public.volunteers;
CREATE POLICY "Committee read volunteers" ON public.volunteers
  FOR SELECT USING (public.is_committee_member());

DROP POLICY IF EXISTS "Committee write volunteers" ON public.volunteers;
CREATE POLICY "Committee write volunteers" ON public.volunteers
  FOR ALL USING (public.current_user_role() IN ('SUPER_ADMIN', 'ADMIN', 'COMMITTEE'))
  WITH CHECK (public.current_user_role() IN ('SUPER_ADMIN', 'ADMIN', 'COMMITTEE'));

-- Tasks
DROP POLICY IF EXISTS "Committee read tasks" ON public.tasks;
CREATE POLICY "Committee read tasks" ON public.tasks
  FOR SELECT USING (public.is_committee_member());

DROP POLICY IF EXISTS "Committee write tasks" ON public.tasks;
CREATE POLICY "Committee write tasks" ON public.tasks
  FOR ALL USING (public.current_user_role() IN ('SUPER_ADMIN', 'ADMIN', 'COMMITTEE'))
  WITH CHECK (public.current_user_role() IN ('SUPER_ADMIN', 'ADMIN', 'COMMITTEE'));

-- Programme: public read published only
DROP POLICY IF EXISTS "Public read published programme" ON public.programme_items;
CREATE POLICY "Public read published programme" ON public.programme_items
  FOR SELECT USING (published = true OR public.is_committee_member());

DROP POLICY IF EXISTS "Committee write programme" ON public.programme_items;
CREATE POLICY "Committee write programme" ON public.programme_items
  FOR ALL USING (public.current_user_role() IN ('SUPER_ADMIN', 'ADMIN', 'COMMITTEE'))
  WITH CHECK (public.current_user_role() IN ('SUPER_ADMIN', 'ADMIN', 'COMMITTEE'));

-- Announcements: public read published + not archived
DROP POLICY IF EXISTS "Public read published announcements" ON public.announcements;
CREATE POLICY "Public read published announcements" ON public.announcements
  FOR SELECT USING (
    (is_published = true AND archived_at IS NULL)
    OR public.is_committee_member()
  );

DROP POLICY IF EXISTS "Committee write announcements" ON public.announcements;
CREATE POLICY "Committee write announcements" ON public.announcements
  FOR ALL USING (public.current_user_role() IN ('SUPER_ADMIN', 'ADMIN', 'COMMITTEE'))
  WITH CHECK (public.current_user_role() IN ('SUPER_ADMIN', 'ADMIN', 'COMMITTEE'));

-- Activity logs: committee read; writes via service role
DROP POLICY IF EXISTS "Committee read activity" ON public.activity_logs;
CREATE POLICY "Committee read activity" ON public.activity_logs
  FOR SELECT USING (public.is_committee_member());

-- RSVPs: committee can read; no anon policies (public writes via service role)
DROP POLICY IF EXISTS "Committee read rsvps" ON public.rsvps;
CREATE POLICY "Committee read rsvps" ON public.rsvps
  FOR SELECT USING (public.is_committee_member());

DROP POLICY IF EXISTS "Committee write rsvps" ON public.rsvps;
CREATE POLICY "Committee write rsvps" ON public.rsvps
  FOR UPDATE USING (public.current_user_role() IN ('SUPER_ADMIN', 'ADMIN', 'COMMITTEE'))
  WITH CHECK (public.current_user_role() IN ('SUPER_ADMIN', 'ADMIN', 'COMMITTEE'));

