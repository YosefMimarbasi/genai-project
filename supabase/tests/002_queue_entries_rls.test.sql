-- queue_entries RLS: owner can read/write their own row; the other side of
-- a match can read (never write) it, but only once a proposed_matches row
-- links the two entries.
--
-- Run with: supabase start && supabase test db  (requires Docker)
begin;
select plan(5);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@cornell.edu'),
  ('22222222-2222-2222-2222-222222222222', 'bob@cornell.edu');

insert into public.queue_entries (id, user_id, sport, skill_tier, time_window_start, time_window_end)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'tennis', 3, now(), now() + interval '1 hour'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'tennis', 3, now(), now() + interval '1 hour');

-- Before any proposed_matches link: bob cannot see alice's entry.
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
set local role authenticated;

select is(
  (select count(*) from public.queue_entries where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int,
  0,
  'bob cannot read alice''s queue_entries row before a proposed_matches link exists'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

-- alice can always read her own row.
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;

select is(
  (select count(*) from public.queue_entries where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int,
  1,
  'alice can read her own queue_entries row'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

-- Link the two entries via a proposed_matches row.
insert into public.proposed_matches (id, entry_a_id, entry_b_id)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Now bob can read alice's row...
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
set local role authenticated;

select is(
  (select count(*) from public.queue_entries where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int,
  1,
  'bob can read alice''s queue_entries row once linked via proposed_matches'
);

-- ...but still cannot write it: the UPDATE runs without error but matches
-- zero rows, because alice's row is invisible to bob under the update
-- policy's USING clause.
select lives_ok(
  $$ update public.queue_entries set status = 'expired' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  'bob''s update statement against alice''s row runs without a hard error'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

select is(
  (select status::text from public.queue_entries where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'waiting',
  'alice''s queue_entries row is unchanged after bob''s attempted update'
);

select * from finish();
rollback;
