-- Apply after 004_atomic_join_enrollment.sql, before deploying the consent route.
create or replace function public.enroll_allowlisted_participant(
  google_user_id uuid,
  google_email text,
  version text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_id text;
  next_number integer;
  new_id text;
begin
  -- Both enrollment paths use this lock for participant lookup and allocation.
  perform pg_advisory_xact_lock(hashtext('nihongo.participant.id'));
  select participant_id into existing_id
  from participants where id = google_user_id;
  if existing_id is not null then
    return jsonb_build_object('status', 'ok', 'participant_id', existing_id);
  end if;

  if not exists (
    select 1 from invited_emails where email = lower(trim(google_email))
  ) then
    return jsonb_build_object('status', 'not_invited');
  end if;

  select coalesce(max(substring(participant_id from 2)::integer), 0) + 1
    into next_number
  from participants where participant_id ~ '^P[0-9]+$';
  new_id := 'P' || lpad(next_number::text, greatest(3, length(next_number::text)), '0');

  insert into participants (id, email, participant_id, consent_version, consent_at)
  values (google_user_id, lower(trim(google_email)), new_id, version, now());
  return jsonb_build_object('status', 'ok', 'participant_id', new_id);
end;
$$;

revoke all on function public.enroll_allowlisted_participant(uuid, text, text) from public;
grant execute on function public.enroll_allowlisted_participant(uuid, text, text) to service_role;

-- Keep join-link enrollment in the same critical section.
create or replace function public.enroll_join_participant(
  google_user_id uuid,
  google_email text,
  invite_code text,
  version text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  link_row invite_links%rowtype;
  existing_id text;
  next_number integer;
  new_id text;
begin
  -- Lock before checking existing participants so concurrent retries reuse enrollment.
  perform pg_advisory_xact_lock(hashtext('nihongo.participant.id'));
  select participant_id into existing_id
  from participants
  where id = google_user_id;
  if existing_id is not null then
    return jsonb_build_object('status', 'ok', 'participant_id', existing_id);
  end if;

  select * into link_row
  from invite_links
  where code = invite_code
  for update;
  if not found then
    return jsonb_build_object('status', 'unknown');
  end if;
  if link_row.signup_count >= link_row.max_signups then
    return jsonb_build_object('status', 'full');
  end if;

  select coalesce(max(substring(participant_id from 2)::integer), 0) + 1
    into next_number
  from participants
  where participant_id ~ '^P[0-9]+$';
  new_id := 'P' || lpad(next_number::text, greatest(3, length(next_number::text)), '0');

  insert into invited_emails (email)
  values (lower(trim(google_email)))
  on conflict (email) do nothing;

  insert into participants (id, email, participant_id, consent_version, consent_at)
  values (
    google_user_id,
    lower(trim(google_email)),
    new_id,
    version,
    now()
  );

  update invite_links
  set signup_count = signup_count + 1
  where code = invite_code;

  return jsonb_build_object('status', 'ok', 'participant_id', new_id);
end;
$$;

revoke all on function public.enroll_join_participant(uuid, text, text, text) from public;
grant execute on function public.enroll_join_participant(uuid, text, text, text) to service_role;
