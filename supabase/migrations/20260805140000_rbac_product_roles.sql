-- V1 RBAC product roles + safer signup default (Yoruba Day / Promax platform)
-- Idempotent where practical

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (
    role IN (
      'SUPER_ADMIN',
      'ADMIN',
      'EVENT_DIRECTOR',
      'COMMITTEE',
      'RSVP_MANAGER',
      'SPONSOR_MANAGER',
      'VOLUNTEER_COORDINATOR',
      'PROGRAMME_COORDINATOR',
      'READ_ONLY',
      'VOLUNTEER'
    )
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'READ_ONLY',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
