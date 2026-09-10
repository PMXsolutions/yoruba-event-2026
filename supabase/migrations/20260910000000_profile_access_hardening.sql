-- Untrusted signup metadata must never grant committee access.
begin;
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    NEW.id, NEW.email,
    coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'COMMITTEE', false
  ) on conflict (id) do nothing;
  return NEW;
end;
$$;

-- Access is provisioned by a trusted administrator, never by self-update.
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles" on public.profiles
  for update to authenticated
  using (public.current_user_role() = 'SUPER_ADMIN')
  with check (public.current_user_role() = 'SUPER_ADMIN');
commit;
