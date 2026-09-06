# Supabase — schema & RLS

## Migrations

- `migrations/20260906215300_initial_schema.sql` — tables, enums, indexes
  for `profiles`, `queue_entries`, `proposed_matches`, `confirmed_matches`,
  `messages`.
- `migrations/20260906215301_rls_policies.sql` — RLS policies, ownership
  helper functions, and the `@cornell.edu`-only signup trigger.
- `migrations/20260906223000_matching_functions.sql` — `ready_up()`,
  `respond_to_match()`, `sweep_expired_matches()`: the atomic matching
  logic, as `SECURITY DEFINER` functions restricted to `service_role` (see
  below). Also adds `proposed_matches.entry_a_accepted_at` /
  `entry_b_accepted_at`, needed to track "mutual accept" — the original
  contract's single `status` column can't distinguish "neither has
  responded" from "only one has."

## Running locally (requires Docker)

```bash
npx supabase start
npx supabase db reset      # applies all migrations to the local Postgres
npx supabase test db       # runs the pgTAP tests under supabase/tests/
```

This environment doesn't have Docker installed, so the migrations and
tests above are written and reviewed but not yet executed. Run the three
commands above once Docker is available to verify them end-to-end.

## Design notes for other branches

- **Writes to `proposed_matches` and `confirmed_matches` are not granted
  to authenticated users via RLS.** The matching-engine route handlers
  (`feature/matching-engine`) must use the Supabase **service-role** key
  server-side to perform the atomic cross-user claim UPDATE and the
  accept/decline transitions — the service role bypasses RLS, which is
  required since a single ready-up request needs to update a row owned by
  a *different* user. Never expose the service-role key to the browser;
  it belongs only in server-side route handler code.
- The matching logic (`ready_up`, `respond_to_match`, `sweep_expired_matches`)
  lives in the database as `SECURITY DEFINER` functions, with `EXECUTE`
  explicitly revoked from `public`/`anon`/`authenticated` (Postgres grants
  it by default on function creation). Each function takes `p_user_id` as
  a plain argument rather than deriving it from `auth.uid()`, so leaving
  the default grant in place would let any authenticated client call e.g.
  `respond_to_match` with someone else's user id. Route handlers verify the
  caller's real identity (`lib/supabase/verify-user.ts`) and call these
  only via the service-role client.
- `ready_up` runs the insert + candidate search + claim + proposed_matches
  insert as one PL/pgSQL function in a single transaction, using
  `SELECT ... FOR UPDATE SKIP LOCKED` on the candidate search plus a
  `WHERE status = 'waiting'` guard on both UPDATEs. This is stronger than
  doing the same steps as separate round trips from the route handler:
  the caller's own just-inserted row is invisible to any other
  transaction until commit, and two concurrent callers can never lock the
  same candidate row — see
  `tests/matching/ready-up.concurrency.test.ts` for the scenario this
  actually protects against (two concurrent *new* callers racing to claim
  the same *pre-existing* waiting entry — not two brand-new arrivals
  matching each other, which can't happen in the same call under READ
  COMMITTED and isn't a bug).
- `profiles` RLS is intentionally scoped to "own row only" — there's no
  policy letting a matched counterpart read someone else's `profiles` row
  (e.g. to show a display name in chat). That wasn't in the original
  schema/RLS spec ([docs/schema-contract.md](../docs/schema-contract.md)).
  If a later branch needs it, add a narrowly-scoped policy (mirroring the
  `queue_entries_select_via_proposed_match` pattern) and have
  `security-reviewer` check it rather than widening `profiles` access
  broadly.
- `is_queue_entry_owner` and `is_confirmed_match_participant` are
  `SECURITY DEFINER` helper functions — the standard Supabase pattern for
  writing "indirect access" RLS policies without risking self-referential
  policy recursion. Reuse them rather than inlining the same joins again
  if more policies need the same ownership checks.
