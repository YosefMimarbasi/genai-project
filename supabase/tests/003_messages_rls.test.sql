-- messages RLS: read/write only for participants of the linked
-- confirmed_match.
--
-- Run with: supabase start && supabase test db  (requires Docker)
begin;
select plan(5);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice2@cornell.edu'),
  ('22222222-2222-2222-2222-222222222222', 'bob2@cornell.edu'),
  ('33333333-3333-3333-3333-333333333333', 'carol2@cornell.edu');

insert into public.queue_entries (id, user_id, sport, skill_tier, time_window_start, time_window_end)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'squash', 2, now(), now() + interval '1 hour'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'squash', 2, now(), now() + interval '1 hour');

insert into public.proposed_matches (id, entry_a_id, entry_b_id, status)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'accepted_both');

insert into public.confirmed_matches (id, proposed_match_id, agreed_time, agreed_location)
values ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', now() + interval '1 day', 'Grumman Squash Courts');

-- alice, a participant, can send a message.
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;

select lives_ok(
  $$ insert into public.messages (confirmed_match_id, sender_id, content)
     values ('cccccccc-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'want to play at 4pm?') $$,
  'alice can send a message in her own confirmed_match'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

-- bob, the other participant, can read it.
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
set local role authenticated;

select is(
  (select count(*) from public.messages where confirmed_match_id = 'cccccccc-0000-0000-0000-000000000001')::int,
  1,
  'bob, the other participant, can read the message'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

-- carol, not a participant, cannot read it...
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
set local role authenticated;

select is(
  (select count(*) from public.messages where confirmed_match_id = 'cccccccc-0000-0000-0000-000000000001')::int,
  0,
  'carol, not a participant, cannot read the message'
);

-- ...and cannot insert one either: WITH CHECK failure raises an error on
-- INSERT (unlike the silent-filter behavior of SELECT/UPDATE).
select throws_ok(
  $$ insert into public.messages (confirmed_match_id, sender_id, content)
     values ('cccccccc-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'can i join?') $$,
  '42501',
  null,
  'carol cannot insert a message into a confirmed_match she is not part of'
);

reset role;
select is(
  (select count(*) from public.messages where content = 'can i join?')::int,
  0,
  'carol''s rejected message was not inserted'
);

select * from finish();
rollback;
