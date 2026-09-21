-- NihonGo capped tester join-links.
-- Paste in the SQL editor after 001_study.sql. Not applied by npm run dev.
-- Guest Join and Pitch mode work without this.

create table if not exists invite_links (
  code text primary key,
  max_signups integer not null check (max_signups > 0),
  signup_count integer not null default 0 check (signup_count >= 0),
  created_at timestamptz not null default now()
);

alter table invite_links enable row level security;

-- Service-role consent uses this so two classmates cannot take the last seat.
create or replace function consume_invite_slot(invite_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update invite_links
  set signup_count = signup_count + 1
  where code = invite_code
    and signup_count < max_signups;
  return found;
end;
$$;

revoke all on function consume_invite_slot(text) from public;
grant execute on function consume_invite_slot(text) to service_role;

-- Example (code must be unique; send /join?from=<code>):
-- insert into invite_links (code, max_signups) values ('rsu-k7m2', 11);
