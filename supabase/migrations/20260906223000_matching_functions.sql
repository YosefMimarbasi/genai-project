-- Matching engine: atomic ready-up, accept/decline, and expiry sweep.
--
-- Design note: rather than orchestrating the claim as several separate
-- round trips from the route handler (insert, then a guarded UPDATE, then
-- another guarded UPDATE, then an insert), the whole ready-up flow runs as
-- one PL/pgSQL function inside a single transaction. This is a stronger
-- guarantee than sequential guarded UPDATEs from application code: the
-- newly-inserted row isn't visible to any other transaction until this one
-- commits, and `SELECT ... FOR UPDATE SKIP LOCKED` means two concurrent
-- ready-ups can never even attempt to lock the same candidate row — one
-- of them simply sees it as unavailable and moves on. The `WHERE status =
-- 'waiting'` guard on both UPDATEs remains as a second, independent check.
--
-- proposed_matches gains two columns here (entry_a_accepted_at /
-- entry_b_accepted_at) that weren't in the original schema contract —
-- tracking "mutual accept" requires knowing each side's individual
-- response, not just one shared status column.

alter table public.proposed_matches
  add column entry_a_accepted_at timestamptz,
  add column entry_b_accepted_at timestamptz;

-- ready_up ----------------------------------------------------------------

create or replace function public.ready_up(
  p_user_id uuid,
  p_sport text,
  p_skill_tier int,
  p_time_window_start timestamptz,
  p_time_window_end timestamptz,
  p_locations text[],
  p_intensity public.intensity_level
)
returns table (
  queue_entry_id uuid,
  proposed_match_id uuid,
  matched_entry_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_own_id uuid;
  v_candidate_id uuid;
  v_proposed_id uuid;
begin
  insert into public.queue_entries (
    user_id, sport, skill_tier, time_window_start, time_window_end, locations, intensity
  ) values (
    p_user_id, p_sport, p_skill_tier, p_time_window_start, p_time_window_end, p_locations, p_intensity
  )
  returning id into v_own_id;

  select qe.id into v_candidate_id
  from public.queue_entries qe
  where qe.status = 'waiting'
    and qe.id <> v_own_id
    and qe.user_id <> p_user_id
    and qe.sport = p_sport
    and qe.intensity = p_intensity
    and abs(qe.skill_tier - p_skill_tier) <= 1
    and qe.time_window_start < p_time_window_end
    and qe.time_window_end > p_time_window_start
    and qe.locations && p_locations
  order by abs(qe.skill_tier - p_skill_tier) asc, qe.created_at asc
  for update skip locked
  limit 1;

  if v_candidate_id is null then
    return query select v_own_id, null::uuid, null::uuid;
    return;
  end if;

  update public.queue_entries
  set status = 'matched'
  where id = v_candidate_id and status = 'waiting';

  if not found then
    -- Shouldn't happen given the lock above, but never assume: fail safe
    -- and leave both entries waiting rather than claim only one side.
    return query select v_own_id, null::uuid, null::uuid;
    return;
  end if;

  update public.queue_entries
  set status = 'matched'
  where id = v_own_id and status = 'waiting';

  insert into public.proposed_matches (entry_a_id, entry_b_id)
  values (v_own_id, v_candidate_id)
  returning id into v_proposed_id;

  return query select v_own_id, v_proposed_id, v_candidate_id;
end;
$$;

-- respond_to_match ----------------------------------------------------------

create or replace function public.respond_to_match(
  p_proposed_match_id uuid,
  p_user_id uuid,
  p_response text
)
returns table (
  status public.proposed_match_status,
  confirmed_match_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.proposed_matches%rowtype;
  v_is_a boolean;
  v_is_b boolean;
  v_entry_a public.queue_entries%rowtype;
  v_entry_b public.queue_entries%rowtype;
  v_agreed_time timestamptz;
  v_agreed_location text;
  v_confirmed_id uuid;
begin
  if p_response not in ('accepted', 'declined') then
    raise exception 'invalid response: %', p_response;
  end if;

  select * into v_row
  from public.proposed_matches
  where id = p_proposed_match_id
  for update;

  if not found then
    raise exception 'proposed match not found';
  end if;

  v_is_a := public.is_queue_entry_owner(v_row.entry_a_id, p_user_id);
  v_is_b := public.is_queue_entry_owner(v_row.entry_b_id, p_user_id);

  if not (v_is_a or v_is_b) then
    raise exception 'user % is not a participant in this proposed match', p_user_id;
  end if;

  if v_row.status <> 'pending' then
    -- Already resolved — idempotent no-op rather than an error, since a
    -- retried/duplicate client request shouldn't blow up.
    return query select v_row.status, null::uuid;
    return;
  end if;

  if now() > v_row.expires_at then
    update public.proposed_matches set status = 'expired' where id = p_proposed_match_id;
    update public.queue_entries set status = 'waiting'
      where id in (v_row.entry_a_id, v_row.entry_b_id) and status = 'matched';
    return query select 'expired'::public.proposed_match_status, null::uuid;
    return;
  end if;

  if p_response = 'declined' then
    update public.proposed_matches set status = 'declined' where id = p_proposed_match_id;
    update public.queue_entries set status = 'waiting'
      where id in (v_row.entry_a_id, v_row.entry_b_id) and status = 'matched';
    return query select 'declined'::public.proposed_match_status, null::uuid;
    return;
  end if;

  if v_is_a then
    update public.proposed_matches set entry_a_accepted_at = now() where id = p_proposed_match_id;
  end if;
  if v_is_b then
    update public.proposed_matches set entry_b_accepted_at = now() where id = p_proposed_match_id;
  end if;

  select * into v_row from public.proposed_matches where id = p_proposed_match_id;

  if v_row.entry_a_accepted_at is null or v_row.entry_b_accepted_at is null then
    return query select 'pending'::public.proposed_match_status, null::uuid;
    return;
  end if;

  -- Both sides accepted: pick a sensible default time/location so
  -- confirmed_matches' NOT NULL columns are satisfiable immediately —
  -- the earliest mutually-available time, and the first location both
  -- sides listed. Refinable later (e.g. via the scheduling-extraction
  -- chat flow); this is a starting point, not the final word.
  select * into v_entry_a from public.queue_entries where id = v_row.entry_a_id;
  select * into v_entry_b from public.queue_entries where id = v_row.entry_b_id;

  v_agreed_time := greatest(v_entry_a.time_window_start, v_entry_b.time_window_start);

  select loc into v_agreed_location
  from unnest(v_entry_a.locations) as loc
  where loc = any (v_entry_b.locations)
  limit 1;

  if v_agreed_location is null then
    v_agreed_location := coalesce(v_entry_a.locations[1], v_entry_b.locations[1], 'TBD');
  end if;

  update public.proposed_matches set status = 'accepted_both' where id = p_proposed_match_id;

  insert into public.confirmed_matches (proposed_match_id, agreed_time, agreed_location)
  values (p_proposed_match_id, v_agreed_time, v_agreed_location)
  returning id into v_confirmed_id;

  return query select 'accepted_both'::public.proposed_match_status, v_confirmed_id;
end;
$$;

-- sweep_expired_matches -----------------------------------------------------

create or replace function public.sweep_expired_matches()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expired_ids uuid[];
begin
  select array_agg(id) into v_expired_ids
  from public.proposed_matches
  where status = 'pending' and expires_at < now();

  if v_expired_ids is null then
    return 0;
  end if;

  update public.proposed_matches
  set status = 'expired'
  where id = any (v_expired_ids);

  update public.queue_entries
  set status = 'waiting'
  where status = 'matched'
    and id in (
      select entry_a_id from public.proposed_matches where id = any (v_expired_ids)
      union
      select entry_b_id from public.proposed_matches where id = any (v_expired_ids)
    );

  return array_length(v_expired_ids, 1);
end;
$$;

-- Lock these down to service_role only ------------------------------------
--
-- Each function takes p_user_id (or acts on all users, for the sweep) as a
-- plain argument rather than deriving it from auth.uid() internally.
-- Postgres grants EXECUTE on new functions to PUBLIC by default, which
-- would let any authenticated client call e.g. respond_to_match with an
-- arbitrary p_user_id and accept/decline a match as someone else. The
-- route handlers verify the caller's identity themselves (see
-- lib/supabase/verify-user.ts) and call these only via the service-role
-- client, so revoke the default grants explicitly.

revoke execute on function public.ready_up(
  uuid, text, int, timestamptz, timestamptz, text[], public.intensity_level
) from public, anon, authenticated;

revoke execute on function public.respond_to_match(uuid, uuid, text)
  from public, anon, authenticated;

revoke execute on function public.sweep_expired_matches()
  from public, anon, authenticated;
