-- NihonGo migration check. Run in Supabase -> SQL Editor.
-- Every check returns its own row and must read true (ok = t);
-- a missing table, policy, or function reads f instead of being absent.
select 'table: ' || t as check, to_regclass('public.' || t) is not null as ok
from unnest(array[
  'invited_emails', 'participants', 'study_sessions',
  'invite_links', 'full_session_requests', 'survey_submissions'
]) as t
union all
select 'column: study_sessions.' || c, exists (
  select 1 from information_schema.columns
  where table_schema = 'public'
    and table_name = 'study_sessions'
    and column_name = c
)
from unnest(array['attempt_id', 'report']) as c
union all
select 'rls on: ' || t, coalesce((
  select c.relrowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = t
), false)
from unnest(array[
  'invited_emails', 'participants', 'study_sessions',
  'invite_links', 'full_session_requests', 'survey_submissions'
]) as t
union all
select 'policy: participants_select_own', exists (
  select 1 from pg_policies
  where schemaname = 'public'
    and tablename = 'participants'
    and policyname = 'participants_select_own'
)
union all
select 'function: ' || f, to_regprocedure(f) is not null
from unnest(array[
  'public.enroll_allowlisted_participant(uuid,text,text)',
  'public.enroll_join_participant(uuid,text,text,text)'
]) as f
order by 1;
