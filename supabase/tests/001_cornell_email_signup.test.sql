-- Cornell-only signup: the enforce_cornell_email trigger on auth.users,
-- and the handle_new_user trigger that auto-creates a profiles row.
--
-- Run with: supabase start && supabase test db  (requires Docker)
begin;
select plan(3);

select throws_ok(
  $$ insert into auth.users (id, email)
     values ('99999999-9999-9999-9999-999999999999', 'not-a-cornell-student@gmail.com') $$,
  'P0001',
  'Signup is restricted to @cornell.edu email addresses',
  'signup with a non-cornell email is rejected'
);

select lives_ok(
  $$ insert into auth.users (id, email)
     values ('88888888-8888-8888-8888-888888888888', 'dave@cornell.edu') $$,
  'signup with a @cornell.edu email succeeds'
);

select is(
  (select cornell_email from public.profiles where id = '88888888-8888-8888-8888-888888888888'),
  'dave@cornell.edu',
  'a profiles row is auto-created for the new cornell signup'
);

select * from finish();
rollback;
