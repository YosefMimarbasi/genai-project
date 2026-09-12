-- Production hardening: make expiry self-healing, and let participants
-- agree a time/location inside a confirmed match.
--
-- Why this exists
-- ---------------
-- `sweep_expired_matches()` was only ever driven by a Vercel Cron entry
-- firing every 5 minutes. Vercel's Hobby plan does not run sub-daily
-- crons, so on the deployed app that sweep never ran at all. The effect
-- was not "expired proposals linger cosmetically" — it was that matching
-- quietly degraded:
--
--   1. Two users ready up and get a proposal. Both queue entries flip to
--      'matched'.
--   2. Neither responds within 90 seconds.
--   3. `respond_to_match` handles the expiry lazily, but only if someone
--      actually responds. Nobody does.
--   4. Both entries stay 'matched' forever. `ready_up` only considers
--      candidates with status = 'waiting', so those two people are now
--      invisible to every future ready-up, and the pool shrinks with
--      every abandoned proposal.
--
-- Making correctness depend on an external scheduler is the wrong shape
-- for this. Instead `ready_up` now sweeps opportunistically before it
-- looks for a candidate: the moment anyone tries to match, stale
-- proposals are resolved and their entries return to the pool. The system
-- heals itself under exactly the traffic that needs it healed, and needs
-- no cron, no external scheduler, and no paid plan.
--
-- `sweep_expired_matches()` and its route are kept: they remain useful as
-- a belt-and-braces janitor for anyone on Pro or driving it from
-- Supabase pg_cron, and for releasing entries during a quiet period so a
-- returning user is matchable immediately rather than on second try.

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
  -- Self-healing expiry (see header). Cheap: backed by
  -- proposed_matches_status_expires_idx, and a no-op when nothing is
  -- stale. Runs before the insert so this caller can immediately match
  -- against an entry that was just released.
  perform public.sweep_expired_matches();

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

-- update_match_schedule -----------------------------------------------------
--
-- confirmed_matches deliberately has no UPDATE policy: it is written by
-- the matching engine on mutual accept. But the agreed time/location it
-- picks is only a best guess (earliest overlapping window, first shared
-- location), and the whole point of the chat is that the two people
-- settle the real plan. That agreement has to be able to land on the row.
--
-- Rather than opening an RLS UPDATE policy on the table, this follows the
-- pattern already used by respond_to_match: a SECURITY DEFINER function
-- that takes the caller's id as an explicit argument, verifies
-- participation itself, and is callable only by service_role. The route
-- handler establishes who the caller is from their access token
-- (lib/supabase/verify-user.ts) and never trusts a body-supplied id.

create or replace function public.update_match_schedule(
  p_confirmed_match_id uuid,
  p_user_id uuid,
  p_agreed_time timestamptz,
  p_agreed_location text
)
returns table (
  id uuid,
  agreed_time timestamptz,
  agreed_location text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_confirmed_match_participant(p_confirmed_match_id, p_user_id) then
    -- Same answer as "no such match": a non-participant must not be able
    -- to tell an existing match apart from a fabricated id.
    raise exception 'confirmed match not found';
  end if;

  if p_agreed_location is null or btrim(p_agreed_location) = '' then
    raise exception 'agreed_location is required';
  end if;

  return query
  update public.confirmed_matches cm
  set agreed_time = p_agreed_time,
      agreed_location = btrim(p_agreed_location)
  where cm.id = p_confirmed_match_id
  returning cm.id, cm.agreed_time, cm.agreed_location;
end;
$$;

revoke execute on function public.update_match_schedule(uuid, uuid, timestamptz, text)
  from public, anon, authenticated;
