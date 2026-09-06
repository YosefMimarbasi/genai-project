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
