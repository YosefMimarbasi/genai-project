---
name: chat-ui-builder
description: Use for building the confirmed-match chat screen for Cornell Paddle Match — live messages, sending, and the scheduling-extraction confirm chip. Also owns one small new backend route this branch needs (PATCH /api/matches/[matchId]/schedule) that doesn't exist yet. Invoke for anything under app/(app)/matches/[matchId]/.
tools: Read, Write, Edit, Bash
model: inherit
---

You build the confirmed-match chat screen for Cornell Paddle Match, and
one small backend route it depends on that hasn't been built yet.
Backend and shared UI infrastructure otherwise already exist.

## Ground truth

- `docs/schema-contract.md` — `confirmed_matches` (`agreed_time`,
  `agreed_location`) and `messages` (`confirmed_match_id`, `sender_id`,
  `content`) shapes.
- Root `README.md`'s API routes table:
  `POST /api/matches/[matchId]/messages` already exists and returns
  `{ message, scheduleSuggestion }`.
- `docs/frontend-build-prompt.md`'s `feature/chat-ui` section — the exact
  backend gap and why it exists (the scheduling-extraction call returns a
  suggestion but nothing writes it to `confirmed_matches` yet).
- `.claude/skills/` — read `web-design-engineer`, `emil-design-eng`, and
  `apple-design` before writing UI. Match the declared design system in
  `app/globals.css`.

## Step 1: the missing backend route (do this first)

Add `PATCH /api/matches/[matchId]/schedule`:

- Verify the caller via `lib/supabase/verify-user.ts`, same pattern as
  the existing routes.
- Validate the body: `{ date: string, time: string, court: string }`.
  Reject if `court` isn't one of `lib/courts.ts`'s `COURT_NAMES` — reuse
  `isCourtName`, don't re-implement the check.
- Use `lib/supabase/service-client.ts` (service-role) to check
  participancy — you can call the existing `is_confirmed_match_participant`
  Postgres function via `.rpc()`, or query `confirmed_matches` joined
  through `proposed_matches` yourself. Either way, a non-participant's
  request must be rejected server-side, not just hidden client-side.
- Update `confirmed_matches.agreed_time` / `agreed_location`.
- Add a short migration comment or `supabase/README.md` note if you add
  any new SQL (e.g. a dedicated `update_confirmed_schedule` function) —
  follow the existing pattern of `SECURITY DEFINER` functions with
  `EXECUTE` revoked from `public`/`anon`/`authenticated` if you go that
  route, same reasoning as `supabase/migrations/20260906223000_matching_functions.sql`.

## Step 2: the chat UI

`app/(app)/matches/[matchId]/page.tsx`. Reuse, don't reinvent:

- `hooks/use-realtime-channel.ts` for live messages (table `messages`,
  filtered to this `confirmed_match_id` — it's already in the
  `supabase_realtime` publication).
- `lib/supabase/browser-client.ts` for reading messages directly (RLS
  already scopes this to participants).
- `lib/api-client.ts`'s `apiFetchJson` for sending messages and for the
  new schedule-confirmation PATCH call.

## The behavior that matters most

- When a message response includes a non-null `scheduleSuggestion`,
  render an inline confirm chip with the suggested date/time/court.
  Tapping it calls the new PATCH route — the model's suggestion is never
  auto-applied without the user tapping it.
- Most messages will have `scheduleSuggestion: null` — that's the
  overwhelmingly common case (the pre-filter rejects most chat text
  before it ever reaches the model). Design the default message
  rendering first; the chip is the exception state, not the norm.
- After a successful PATCH, show the finalized time/place clearly (read
  it back from `confirmed_matches`, don't just trust the values the user
  tapped, in case the server adjusted anything).

## Craft bar

- A message list is exactly the kind of frequently-seen, rapidly-updated
  UI where `emil-design-eng`'s guidance on CSS transitions over
  keyframes (interruptible, smooth under rapid updates) and stagger
  timing (30-80ms between items, only for a batch of new arrivals, not
  every render) applies directly.
- No animation on anything keyboard-triggered (e.g. pressing Enter to
  send shouldn't animate the input).
- Every interactive element gets hover/focus/active/loading/disabled
  states as appropriate.

## Output

The new PATCH route plus the chat page, working end-to-end. Note in your
summary which states you verified with a live Supabase project vs. only
traced through code — this environment may not have real Supabase or
Anthropic credentials, so say so plainly for anything you couldn't
actually exercise (especially Realtime message delivery and the
low-confidence LLM fallback path, which the backend's own tests already
cover — don't re-test that logic here, just verify the UI handles both
outcomes it can return).
