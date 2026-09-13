-- Cornell Racket Queue — complete schema, all migrations in order.
--
-- Paste the whole file into the Supabase SQL Editor and press Run. It is
-- the same SQL `supabase db push` would apply, concatenated in migration
-- order, for setups where the CLI's login flow is more trouble than it
-- is worth.
--
-- Order matters: 20260906223000 adds two columns to a table created in
-- 20260906215300, and 20260912000000 replaces a function defined in
-- 20260906223000. Do not reorder or run these piecemeal.
--
-- Safe to run once on a brand-new project. Re-running is NOT safe: the
-- CREATE TABLE and ALTER TABLE ... ADD COLUMN statements will error on a
-- second pass (which is harmless, but stop and read rather than retrying).

begin;

-- ====================================================================
-- 20260906215300_initial_schema.sql
-- ====================================================================

-- Cornell Paddle Match: initial schema
-- Tables, enums, and indexes for profiles, queue_entries, proposed_matches,
-- confirmed_matches, and messages. RLS is added in the next migration.

create extension if not exists pgcrypto;

-- profiles ------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  cornell_email text not null unique,
  default_sports text[] not null default '{}',
  default_skill_tier jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- queue_entries ---------------------------------------------------------

create type public.queue_status as enum ('waiting', 'matched', 'expired');
create type public.intensity_level as enum ('casual', 'competitive');

create table public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  sport text not null,
  skill_tier int not null check (skill_tier between 1 and 5),
  time_window_start timestamptz not null,
  time_window_end timestamptz not null,
  locations text[] not null default '{}',
  intensity public.intensity_level not null default 'casual',
  status public.queue_status not null default 'waiting',
  created_at timestamptz not null default now(),
  constraint queue_entries_time_window_valid check (time_window_end > time_window_start)
);

create index queue_entries_status_sport_idx on public.queue_entries (status, sport);
create index queue_entries_user_id_idx on public.queue_entries (user_id);

-- proposed_matches ------------------------------------------------------

create type public.proposed_match_status as enum ('pending', 'accepted_both', 'declined', 'expired');

create table public.proposed_matches (
  id uuid primary key default gen_random_uuid(),
  entry_a_id uuid not null references public.queue_entries (id) on delete cascade,
  entry_b_id uuid not null references public.queue_entries (id) on delete cascade,
  status public.proposed_match_status not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 seconds'),
  constraint proposed_matches_distinct_entries check (entry_a_id <> entry_b_id)
);

create index proposed_matches_entry_a_idx on public.proposed_matches (entry_a_id);
create index proposed_matches_entry_b_idx on public.proposed_matches (entry_b_id);
create index proposed_matches_status_expires_idx on public.proposed_matches (status, expires_at);

-- confirmed_matches -------------------------------------------------------

create table public.confirmed_matches (
  id uuid primary key default gen_random_uuid(),
  proposed_match_id uuid not null unique references public.proposed_matches (id) on delete cascade,
  agreed_time timestamptz not null,
  agreed_location text not null,
  created_at timestamptz not null default now()
);

create index confirmed_matches_proposed_match_idx on public.confirmed_matches (proposed_match_id);

-- messages ----------------------------------------------------------------

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  confirmed_match_id uuid not null references public.confirmed_matches (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index messages_confirmed_match_idx on public.messages (confirmed_match_id, created_at);


-- ====================================================================
-- 20260906215301_rls_policies.sql
-- ====================================================================

-- Cornell Paddle Match: RLS policies + Cornell-only signup
--
-- Ownership-check helper functions are SECURITY DEFINER so they bypass RLS
-- internally when resolving "is this the current user's row" — this avoids
-- any risk of Postgres RLS self-reference recursion in the policies below,
-- which is the standard Supabase pattern for indirect-access rules.
--
-- Writes to proposed_matches and confirmed_matches are intentionally NOT
-- granted to authenticated users here: the matching-engine route handlers
-- (feature/matching-engine) perform the atomic cross-user claim and the
-- accept/decline transition server-side using the Supabase service-role
-- key, which bypasses RLS. RLS here only needs to protect direct
-- client-side reads. See docs/schema-contract.md.

-- Helper functions --------------------------------------------------------

create or replace function public.is_queue_entry_owner(entry_id uuid, uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.queue_entries qe
    where qe.id = entry_id and qe.user_id = uid
  );
$$;

create or replace function public.is_confirmed_match_participant(match_id uuid, uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.confirmed_matches cm
    join public.proposed_matches pm on pm.id = cm.proposed_match_id
    where cm.id = match_id
      and (
        public.is_queue_entry_owner(pm.entry_a_id, uid)
        or public.is_queue_entry_owner(pm.entry_b_id, uid)
      )
  );
$$;

-- profiles ------------------------------------------------------------

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- queue_entries ---------------------------------------------------------

alter table public.queue_entries enable row level security;

create policy "queue_entries_select_own"
  on public.queue_entries for select
  using (user_id = auth.uid());

-- The other side of a match may read (never write) this row once a
-- proposed_matches row links it to one of the requester's own entries.
create policy "queue_entries_select_via_proposed_match"
  on public.queue_entries for select
  using (
    exists (
      select 1 from public.proposed_matches pm
      where (
        (pm.entry_a_id = queue_entries.id and public.is_queue_entry_owner(pm.entry_b_id, auth.uid()))
        or
        (pm.entry_b_id = queue_entries.id and public.is_queue_entry_owner(pm.entry_a_id, auth.uid()))
      )
    )
  );

create policy "queue_entries_insert_own"
  on public.queue_entries for insert
  with check (user_id = auth.uid());

create policy "queue_entries_update_own"
  on public.queue_entries for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- proposed_matches ------------------------------------------------------

alter table public.proposed_matches enable row level security;

create policy "proposed_matches_select_participant"
  on public.proposed_matches for select
  using (
    public.is_queue_entry_owner(entry_a_id, auth.uid())
    or public.is_queue_entry_owner(entry_b_id, auth.uid())
  );

-- intentionally no insert/update/delete policy: written via service-role
-- by the matching-engine route handlers only.

-- confirmed_matches -------------------------------------------------------

alter table public.confirmed_matches enable row level security;

create policy "confirmed_matches_select_participant"
  on public.confirmed_matches for select
  using (public.is_confirmed_match_participant(id, auth.uid()));

-- intentionally no insert/update/delete policy: written via service-role
-- on mutual accept only.

-- messages ----------------------------------------------------------------

alter table public.messages enable row level security;

create policy "messages_select_participant"
  on public.messages for select
  using (public.is_confirmed_match_participant(confirmed_match_id, auth.uid()));

create policy "messages_insert_participant"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and public.is_confirmed_match_participant(confirmed_match_id, auth.uid())
  );

-- Cornell-only signup -----------------------------------------------------

create or replace function public.enforce_cornell_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or new.email !~* '^[^@]+@cornell\.edu$' then
    raise exception 'Signup is restricted to @cornell.edu email addresses';
  end if;
  return new;
end;
$$;

create trigger enforce_cornell_email_before_insert
  before insert on auth.users
  for each row
  execute function public.enforce_cornell_email();

-- Auto-create a profiles row for every new Cornell signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, cornell_email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- ====================================================================
-- 20260906223000_matching_functions.sql
-- ====================================================================

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


-- ====================================================================
-- 20260906230000_enable_realtime.sql
-- ====================================================================

-- Enable Postgres change broadcasting for the tables the frontend needs to
-- watch live: a queue entry flipping to 'matched', a proposed match's
-- status changing, new chat messages, and the confirmed match itself
-- getting its schedule finalized. Realtime is a separate opt-in from RLS —
-- a table with RLS enabled still sends zero change events until it's added
-- to this publication. RLS still applies per-subscriber once added.
alter publication supabase_realtime add table
  public.queue_entries,
  public.proposed_matches,
  public.confirmed_matches,
  public.messages;


-- ====================================================================
-- 20260912000000_self_healing_expiry_and_schedule.sql
-- ====================================================================

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


commit;
