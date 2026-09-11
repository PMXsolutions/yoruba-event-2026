-- Serialize access changes, authorize again inside the transaction, and audit them.
begin;
create or replace function public.manage_member_access(target_id uuid, member_role text, active boolean)
returns void language plpgsql security definer set search_path = public as $$
declare actor public.profiles; previous public.profiles;
begin
  perform pg_advisory_xact_lock(60911001);
  select * into actor from public.profiles where id = auth.uid();
  if actor.id is null or not actor.is_active or actor.role <> 'SUPER_ADMIN' then
    raise exception 'Only active Super Admins can manage members';
  end if;
  if target_id = actor.id then raise exception 'Ask another Super Admin to change your access'; end if;
  if member_role is null or member_role not in ('SUPER_ADMIN','ADMIN','COMMITTEE','VOLUNTEER') or active is null then
    raise exception 'Invalid access settings';
  end if;
  select * into previous from public.profiles where id = target_id for update;
  if previous.id is null then raise exception 'Member not found'; end if;
  if previous.role = 'SUPER_ADMIN' and previous.is_active and (not active or member_role <> 'SUPER_ADMIN')
    and not exists (select 1 from public.profiles where id <> target_id and role = 'SUPER_ADMIN' and is_active) then
    raise exception 'Keep at least one active Super Admin';
  end if;
  update public.profiles set role = member_role, is_active = active, updated_at = now() where id = target_id;
  insert into public.activity_logs(event_slug, action, entity_type, entity_id, actor_id, metadata)
  values ('yoruba-day-canberra-2026','member.access_changed','member',target_id,actor.id,
    jsonb_build_object('previous_role',previous.role,'role',member_role,'previous_active',previous.is_active,'active',active));
end $$;
revoke all on function public.manage_member_access(uuid,text,boolean) from public, anon;
grant execute on function public.manage_member_access(uuid,text,boolean) to authenticated;
-- All browser access changes now go through the checked, audited function.
drop policy if exists "Admins update profiles" on public.profiles;
commit;
