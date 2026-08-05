-- Seating MVP + RSVP accessibility extensions
-- Idempotent where practical for Promax Event Platform

-- RSVP extensions
ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS accessibility_requirements text,
  ADD COLUMN IF NOT EXISTS dietary_requirements text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);

COMMENT ON COLUMN public.rsvps.source IS 'public | committee | phone | walk_in';
COMMENT ON COLUMN public.rsvps.accessibility_requirements IS 'Guest accessibility needs (committee-visible)';
COMMENT ON COLUMN public.rsvps.dietary_requirements IS 'Guest dietary needs (committee-visible)';

CREATE INDEX IF NOT EXISTS rsvps_registration_reference_idx
  ON public.rsvps (registration_reference);

CREATE INDEX IF NOT EXISTS activity_logs_entity_idx
  ON public.activity_logs (entity_type, entity_id, created_at DESC);

-- Venue floor plan references (URL/path — no private credentials stored)
CREATE TABLE IF NOT EXISTS public.venue_floor_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug text NOT NULL DEFAULT 'yoruba-day-canberra-2026',
  title text NOT NULL DEFAULT 'Main hall',
  file_url text,
  file_label text,
  mime_hint text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS venue_floor_plans_event_idx
  ON public.venue_floor_plans (event_slug, is_active);

-- Seating tables / zones
CREATE TABLE IF NOT EXISTS public.seating_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug text NOT NULL DEFAULT 'yoruba-day-canberra-2026',
  name text NOT NULL,
  zone text NOT NULL DEFAULT 'General',
  capacity integer NOT NULL DEFAULT 8 CHECK (capacity > 0 AND capacity <= 100),
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seating_tables_event_idx
  ON public.seating_tables (event_slug, sort_order, name);

-- Guest seat assignments + QR tokens
CREATE TABLE IF NOT EXISTS public.seating_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug text NOT NULL DEFAULT 'yoruba-day-canberra-2026',
  rsvp_id uuid NOT NULL REFERENCES public.rsvps(id) ON DELETE CASCADE,
  table_id uuid REFERENCES public.seating_tables(id) ON DELETE SET NULL,
  zone text,
  seat_label text,
  qr_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  checked_in_at timestamptz,
  checked_in_by uuid REFERENCES public.profiles(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_slug, rsvp_id)
);

CREATE INDEX IF NOT EXISTS seating_assignments_event_idx
  ON public.seating_assignments (event_slug);
CREATE INDEX IF NOT EXISTS seating_assignments_qr_idx
  ON public.seating_assignments (qr_token);
CREATE INDEX IF NOT EXISTS seating_assignments_table_idx
  ON public.seating_assignments (table_id);

-- RLS: service role bypasses; authenticated committee can read/write via app service role.
ALTER TABLE public.venue_floor_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seating_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seating_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS venue_floor_plans_authenticated_all ON public.venue_floor_plans;
CREATE POLICY venue_floor_plans_authenticated_all
  ON public.venue_floor_plans FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS seating_tables_authenticated_all ON public.seating_tables;
CREATE POLICY seating_tables_authenticated_all
  ON public.seating_tables FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS seating_assignments_authenticated_all ON public.seating_assignments;
CREATE POLICY seating_assignments_authenticated_all
  ON public.seating_assignments FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Public seat lookup uses service role in Next.js (no anon full guest list).
