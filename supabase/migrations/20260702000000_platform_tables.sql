-- Promax Event Platform — extended schema for Yoruba Day Canberra 2026
-- Run after 20260112000000_create_rsvps.sql

-- ── RSVP enhancements ─────────────────────────────────────────────
ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS registration_reference TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS rsvps_registration_reference_idx ON public.rsvps (registration_reference);
CREATE INDEX IF NOT EXISTS rsvps_email_idx ON public.rsvps (email);

-- ── Roles & permissions (RBAC) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.committee_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id),
  full_name TEXT,
  email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS committee_users_role_id_idx ON public.committee_users (role_id);
CREATE INDEX IF NOT EXISTS committee_users_email_idx ON public.committee_users (email);

-- ── Announcements ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.committee_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS announcements_published_idx
  ON public.announcements (is_published, published_at DESC);

-- ── Sponsors ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  package TEXT NOT NULL,
  logo_url TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sponsors_status_idx ON public.sponsors (status);
CREATE INDEX IF NOT EXISTS sponsors_created_at_idx ON public.sponsors (created_at DESC);

-- ── Volunteers ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  skills TEXT[] DEFAULT '{}',
  availability TEXT,
  assignment TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'assigned', 'declined')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS volunteers_status_idx ON public.volunteers (status);

-- ── Gallery ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gallery_sort_idx ON public.gallery (sort_order, created_at);

-- ── Programme ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.programme (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_label TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS programme_sort_idx ON public.programme (sort_order);

-- ── Speakers ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  photo_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS speakers_sort_idx ON public.speakers (sort_order);

-- ── FAQ ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS faq_sort_idx ON public.faq (sort_order);

-- ── Activity log ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  actor_id UUID REFERENCES public.committee_users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_log_created_at_idx ON public.activity_log (created_at DESC);

-- ── Seed roles ────────────────────────────────────────────────────────
INSERT INTO public.roles (slug, name, description) VALUES
  ('super_admin', 'Super Admin', 'Full platform access'),
  ('admin', 'Admin', 'Manage events, RSVPs, sponsors, and content'),
  ('committee', 'Committee', 'View and manage RSVPs and announcements'),
  ('volunteer', 'Volunteer', 'Limited dashboard access')
ON CONFLICT (slug) DO NOTHING;

-- ── Seed permissions ──────────────────────────────────────────────────
INSERT INTO public.permissions (slug, name, description) VALUES
  ('rsvp.read', 'View RSVPs', 'Read RSVP registrations'),
  ('rsvp.write', 'Manage RSVPs', 'Edit and delete RSVPs'),
  ('rsvp.export', 'Export RSVPs', 'Export RSVP data'),
  ('sponsor.read', 'View sponsors', 'Read sponsor applications'),
  ('sponsor.write', 'Manage sponsors', 'Approve/reject sponsors'),
  ('sponsor.export', 'Export sponsors', 'Export sponsor data'),
  ('volunteer.read', 'View volunteers', 'Read volunteer registrations'),
  ('volunteer.write', 'Manage volunteers', 'Assign volunteers'),
  ('announcement.write', 'Manage announcements', 'Publish announcements'),
  ('content.write', 'Manage content', 'Edit programme, speakers, gallery, FAQ'),
  ('settings.write', 'Manage settings', 'Platform settings'),
  ('user.manage', 'Manage users', 'Manage committee users and roles')
ON CONFLICT (slug) DO NOTHING;

-- Super Admin gets all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'super_admin'
ON CONFLICT DO NOTHING;

-- Admin permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.slug IN (
  'rsvp.read', 'rsvp.write', 'rsvp.export',
  'sponsor.read', 'sponsor.write', 'sponsor.export',
  'volunteer.read', 'volunteer.write',
  'announcement.write', 'content.write'
)
WHERE r.slug = 'admin'
ON CONFLICT DO NOTHING;

-- Committee permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.slug IN (
  'rsvp.read', 'rsvp.write', 'rsvp.export',
  'sponsor.read', 'announcement.write'
)
WHERE r.slug = 'committee'
ON CONFLICT DO NOTHING;

-- Volunteer permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.slug IN ('rsvp.read', 'volunteer.read')
WHERE r.slug = 'volunteer'
ON CONFLICT DO NOTHING;

-- ── Seed programme (placeholder schedule) ─────────────────────────────
INSERT INTO public.programme (time_label, title, description, location, sort_order) VALUES
  ('2:00 PM', 'Doors open & welcome', 'Registration, cultural welcome, and ambient music in the foyer.', 'Main foyer', 1),
  ('2:30 PM', 'Opening ceremony', 'Traditional prayers, national anthems, and welcome address from elders.', 'Grand hall', 2),
  ('3:15 PM', 'Talking drum & cultural showcase', 'Live performances featuring gangan, dùndún, and contemporary Afrobeats sets.', 'Main stage', 3),
  ('4:30 PM', 'Eyo procession preview', 'A respectful presentation of Eyo pageantry and procession traditions.', 'Main stage', 4),
  ('5:30 PM', 'Yoruba cuisine service', 'Shared tables with àmàlà, stews, and small plates for families.', 'Dining area', 5),
  ('6:45 PM', 'Fashion & gele showcase', 'Aso Oke, gele artistry, and diaspora fashion on the runway.', 'Main stage', 6),
  ('8:00 PM', 'Intergenerational storytelling', 'Poetry, dance, and stage moments honouring elders and youth voices.', 'Main stage', 7),
  ('9:00 PM', 'Closing & community dance', 'Final remarks, photo moments, and open dance floor.', 'Grand hall', 8);

-- ── Seed speakers (placeholder) ───────────────────────────────────────
INSERT INTO public.speakers (name, title, bio, sort_order) VALUES
  ('Chief Adebayo Ogundimu', 'Elder & Cultural Patron', 'A respected community elder who has championed Yoruba language preservation and intergenerational mentorship across Canberra for over two decades.', 1),
  ('Dr. Funmilayo Akinwale', 'Keynote Speaker', 'Academic and cultural historian specialising in Yoruba diaspora narratives, with published work on identity and belonging in Australian multicultural contexts.', 2),
  ('Tunde Bakare', 'Master of Ceremonies', 'Award-winning broadcaster and events host known for weaving humour, dignity, and cultural fluency into every programme he leads.', 3),
  ('Ayo & The Heritage Collective', 'Featured Performers', 'A Canberra-based ensemble blending traditional talking drum rhythms with contemporary Afrobeats — sound as language, calling the community to dance.', 4);

-- ── Seed FAQ ──────────────────────────────────────────────────────────
INSERT INTO public.faq (question, answer, sort_order) VALUES
  ('When and where is Yoruba Day Canberra 2026?', 'The celebration takes place on Saturday, 22 November 2026 in Canberra, ACT. The final venue will be confirmed closer to the date — register your interest to receive updates.', 1),
  ('How do I register for the event?', 'Use the RSVP form on this website to register your interest. Our committee will follow up with ticketing details as the programme is finalised.', 2),
  ('Is the event family-friendly?', 'Absolutely. Yoruba Day is designed for òmò wọ́n àti àgbà — children, parents, and grandparents — with programming for all ages.', 3),
  ('How can my organisation become a sponsor?', 'Scroll to the Sponsors section and complete the sponsorship enquiry form. Our partnerships team will share the full sponsorship deck and packages.', 4),
  ('Can I volunteer on the day?', 'Yes! Visit the volunteer registration section or contact us directly. We welcome help with hospitality, stage support, and community engagement.', 5),
  ('What should I wear?', 'We encourage guests to celebrate in their finest — Aso Oke, gele, agbada, or contemporary African-inspired attire. Gold accents are always welcome.', 6);

-- ── RLS policies ──────────────────────────────────────────────────────
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programme ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Public read for published content
CREATE POLICY "Public read published announcements" ON public.announcements
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public read approved sponsors" ON public.sponsors
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Public read published gallery" ON public.gallery
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public read published programme" ON public.programme
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public read published speakers" ON public.speakers
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public read published faq" ON public.faq
  FOR SELECT USING (is_published = true);

-- Service role bypasses RLS; committee access via service role in dashboard
