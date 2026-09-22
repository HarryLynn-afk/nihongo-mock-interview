-- Guest requests for the full Interview.
-- Not applied by `npm run dev` or Netlify. Paste once into the Supabase
-- SQL editor for the project whose URL is in NEXT_PUBLIC_SUPABASE_URL.
-- This app inserts with the service role. The admin project reads the same
-- table. No policy is granted to the public anon key.

create table if not exists full_session_requests (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table full_session_requests enable row level security;
