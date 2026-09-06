# Supabase — schema & RLS

## Migrations

- `migrations/20260906215300_initial_schema.sql` — tables, enums, indexes
  for `profiles`, `queue_entries`, `proposed_matches`, `confirmed_matches`,
  `messages`.
- `migrations/20260906215301_rls_policies.sql` — RLS policies, ownership
  helper functions, and the `@cornell.edu`-only signup trigger.

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
