-- READ ONLY: run in the production Supabase SQL Editor; no customer data or secrets returned.
-- Check migration history first (SQL Editor applications may not have been recorded here).
select version from supabase_migrations.schema_migrations order by version;

-- Every row must say PRESENT. Presence alone does not validate constraints/policies.
with required(table_name, column_name) as (values
 ('rsvps','id'), ('rsvps','event_slug'), ('rsvps','registration_reference'),
 ('rsvps','email_consent'), ('rsvps','sms_consent'), ('rsvps','marketing_consent'),
 ('rsvps','email_status'), ('rsvps','email_sent_at'), ('rsvps','email_provider_id'),
 ('rsvps','sms_status'), ('rsvps','sms_sent_at'), ('rsvps','sms_provider_id'),
 ('rsvps','committee_notes'), ('rsvps','internal_notes'), ('rsvps','contacted_at'), ('rsvps','tags'),
 ('profiles','role'), ('profiles','is_active'), ('events','slug'),
 ('activity_logs','action'), ('sponsors','id'), ('volunteers','id'),
 ('tasks','id'), ('programme_items','id'), ('announcements','id')
)
select r.*, case when c.column_name is null then 'MISSING' else 'PRESENT' end as result,
 c.column_default, c.is_nullable
from required r left join information_schema.columns c
 on c.table_schema='public' and c.table_name=r.table_name and c.column_name=r.column_name
order by r.table_name, r.column_name;

-- Email constraint must include pending, disabled and consent_declined, plus legacy states.
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint where conrelid='public.rsvps'::regclass and contype='c';

-- All these application tables must have row-level security enabled.
select relname, relrowsecurity
from pg_class join pg_namespace n on n.oid=relnamespace
where n.nspname='public' and relname in
 ('rsvps','profiles','events','activity_logs','sponsors','volunteers','tasks','programme_items','announcements');
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname='public' order by tablename, policyname;

-- Historical delivery states are not rewritten; investigate stale pending individually.
select email_status, count(*) from public.rsvps group by email_status order by email_status;
