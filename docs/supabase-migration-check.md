# Supabase migration check

The study tables are applied **by hand** — the files in `supabase/migrations/`
are pasted into the Supabase SQL Editor, not run by `npm run dev`, Netlify, or
the Supabase CLI. So there is no migration ledger to read; verify the schema by
querying it.

Run this in **Supabase → SQL Editor**. Every row should read `PASS`.

```sql
-- NihonGo migration check: every row must read PASS.
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
```

Expected (all `PASS`):

| check                                                     | ok |
| --------------------------------------------------------- | -- |
| column: study_sessions.attempt_id                         | t  |
| column: study_sessions.report                             | t  |
| function: public.enroll_allowlisted_participant(uuid,text,text)      | t  |
| function: public.enroll_join_participant(uuid,text,text,text)        | t  |
| policy: participants_select_own                           | t  |
| rls on: full_session_requests                             | t  |
| rls on: invite_links                                      | t  |
| rls on: invited_emails                                    | t  |
| rls on: participants                                      | t  |
| rls on: study_sessions                                    | t  |
| rls on: survey_submissions                                | t  |
| table: full_session_requests                              | t  |
| table: invite_links                                       | t  |
| table: invited_emails                                     | t  |
| table: participants                                       | t  |
| table: study_sessions                                     | t  |
| table: survey_submissions                                 | t  |

A row that reads `f` or `null` means that piece is missing. A missing table
also fails its `rls on:` row, so no row is ever silently absent.

## Applying missing migrations

Apply the files **in order**, pasting each into the SQL Editor:

1. `001_study.sql`
2. `002_invite_links.sql`
3. `003_full_session_requests.sql`
4. `004_atomic_join_enrollment.sql` — the capped join-link enrollment function
5. `005_score_attempts.sql` — `study_sessions.attempt_id` and `report`
6. `006_survey_submissions.sql` — the survey delivery-status table
7. `007_atomic_allowlist_enrollment.sql` — allowlist enrollment function, shared participant lock

Tables, columns, and functions use `create ... if not exists` / `create or
replace`, so re-running those parts is safe. But `001_study.sql` also drops and
recreates the `participants_select_own` policy — do not re-run it blindly after
you have customized that policy.

## Functional smoke test

Schema aside, prove the wiring end to end:

- Sign in with an allowlisted Google account → `GET /api/study/me` returns
  `state: "ready"` with a `participant_id`.
- Open `/join?from=<code>` → a `P...` participant id is assigned.

If both work, `001`–`007` are effectively in place.

## Note on the Supabase CLI

`supabase migration list` only tracks migrations applied **through the CLI**.
Because these were pasted by hand, the CLI may report them as "not applied" even
though the schema is correct — trust the SQL check above, not the CLI here.
