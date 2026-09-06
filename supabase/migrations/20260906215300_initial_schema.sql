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
