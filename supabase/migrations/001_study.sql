-- NihonGo invited-tester study tables.
-- Not applied by `npm run dev` or Netlify. Paste once into the Supabase
-- SQL editor for the project whose URL is in NEXT_PUBLIC_SUPABASE_URL.
-- Guest Join and Pitch mode (`?pitch=1`) work without this.

create table if not exists invited_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists participants (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  participant_id text unique not null,
  consent_version text not null,
  consent_at timestamptz not null
);

create table if not exists study_sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id text not null references participants (participant_id),
  headline text,
  total numeric,
  source text,
  answers jsonb not null default '[]'::jsonb,
  scores jsonb,
  pushback_count integer not null default 0,
  follow_up_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table invited_emails enable row level security;
alter table participants enable row level security;
alter table study_sessions enable row level security;

-- Magic-link, consent insert, and session save use the service role
-- (bypasses RLS). GET /api/study/me uses the logged-in user, so they
-- must be able to read their own participants row.
drop policy if exists participants_select_own on participants;
create policy participants_select_own
  on participants
  for select
  to authenticated
  using (id = auth.uid());
