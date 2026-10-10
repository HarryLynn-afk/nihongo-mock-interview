-- Apply before deploying server-owned participant grading.
alter table study_sessions
  add column if not exists attempt_id text,
  add column if not exists report jsonb;

create unique index if not exists study_sessions_attempt_id_key
  on study_sessions (attempt_id)
  where attempt_id is not null;
