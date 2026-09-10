-- Run only in a fresh/staging project. Every synthetic record is rolled back.
begin;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
insert into auth.users(id,email,raw_user_meta_data)
values(current_setting('request.jwt.claim.sub')::uuid,
  'release-security-test@example.invalid','{"role":"SUPER_ADMIN","is_active":true}'::jsonb);
do $$ begin
  if not exists(select 1 from public.profiles
    where id=current_setting('request.jwt.claim.sub')::uuid
    and role='COMMITTEE' and is_active=false)
  then raise exception 'Signup metadata granted access'; end if;
end; $$;
set local role authenticated;
do $$ declare changed int; begin
  if public.is_committee_member() then
    raise exception 'Inactive signup can access committee data';
  end if;
  update public.profiles set role='SUPER_ADMIN',is_active=true where id=auth.uid();
  get diagnostics changed=row_count;
  if changed<>0 then raise exception 'Self escalation allowed'; end if;
end; $$;
reset role;
rollback;
select 'PASS: untrusted signup role ignored, inactive, and self escalation denied; test rolled back' as result;
