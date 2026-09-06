# Cornell Paddle Match — frontend build prompts (parallel branches)

The backend is done and merged to `main` (see [docs/build-prompt.md](build-prompt.md)
for how it was built, and the root [README.md](../README.md) for the API
route reference). This doc breaks the remaining UI/UX work into one shared
setup pass plus three parallel branches, the same shape as the backend
split.

## How this is organized

One person runs **Shared setup** once and merges it to `main` first. After
that, three people can each check out their own branch and paste that
branch's prompt into a separate Claude Code session, working in parallel.

```
main
 ├─ chore/ui-shared-setup      (merge this one first)
 ├─ feature/onboarding-ui
 ├─ feature/queue-ui
 └─ feature/chat-ui
```

Unlike the backend split, none of these three branches are blocked
waiting on each other's data model — the schema and every API route they
call already exists on `main`. The only hard dependency is on
`chore/ui-shared-setup` (auth, layout, shared components, the API-fetch
helper) merging first.

Scope: pages, components, and the client-side calls into the existing
API routes. No new backend routes except the one explicitly called out
under `feature/chat-ui` below.

---

## Shared setup (run once, on its own branch, merge to `main` first)

### Technical decisions (apply to every branch)

- **Styling: Tailwind CSS.** Utility classes keep each branch's markup
  changes local to its own files — no shared stylesheet for three people
  to fight over.
- **Auth/session: `@supabase/ssr`** (not yet installed — add it here).
  Cookie-based sessions for the App Router: a browser client for client
  components, a server client for server components/middleware, and a
  `middleware.ts` that redirects signed-out users to `/sign-in` for any
  route under `/app` (or wherever authenticated pages live) and leaves
  `/sign-in` / `/sign-up` public. `@supabase/ssr` is the current
  Supabase-recommended package for this (superseding the older
  `auth-helpers-nextjs`) — if its API has moved since this was written,
  check current docs via the Context7 MCP rather than guessing.
- **Data fetching: no extra library.** A shared `apiFetch(path, init)`
  helper (in `lib/api-client.ts`) that reads the current Supabase session
  and attaches `Authorization: Bearer <access_token>` automatically, for
  calling this repo's own API routes. For data covered by RLS
  (`profiles`, `queue_entries`, `proposed_matches`, `confirmed_matches`,
  `messages`), read directly with the Supabase browser client — RLS
  already scopes it correctly, so there's no need to round-trip through
  an API route just to read your own data.
- **Realtime: one shared hook**, e.g. `useRealtimeChannel` in
  `hooks/use-realtime-channel.ts`, wrapping
  `supabase.channel(...).on('postgres_changes', ...)` with subscribe/
  cleanup handled once. `feature/queue-ui` (watching for a match) and
  `feature/chat-ui` (watching for new messages) both need this — write it
  once here instead of two slightly-different copies.
- **No component library.** Hand-rolled primitives in `components/ui/`:
  `Button`, `Card`, `TextInput`, `Select`, `Spinner`, `ErrorBanner`. Keep
  them small; the three feature branches should be able to compose them
  without needing to modify them.

### What to build

1. `tailwind.config.ts` + the Tailwind PostCSS setup for Next.js App
   Router.
2. `lib/supabase/browser-client.ts` and `lib/supabase/server-client.ts`
   (via `@supabase/ssr`'s `createBrowserClient` / `createServerClient`).
3. `middleware.ts` — redirect unauthenticated requests to `/sign-in`.
4. `app/sign-in/page.tsx` and `app/sign-up/page.tsx` — email/password
   (or magic link) forms against Supabase Auth. Hint in the UI that
   signup is Cornell-only, but don't try to re-implement the domain
   check client-side beyond a simple format nudge — the `@cornell.edu`
   restriction is already enforced server-side by the `auth.users`
   trigger from `feature/schema-rls`; a rejected signup just needs a
   readable error message surfaced from Supabase Auth's response.
5. `app/layout.tsx` — root layout with the nav shell (app name, sign-out
   button). Define the full nav structure now (even placeholder links to
   `/profile`, `/play`, and a matches list) so the three feature branches
   don't all need to edit the same nav component later.
6. `components/ui/*` — the primitives listed above.
7. `lib/api-client.ts` — the `apiFetch` helper.
8. `hooks/use-realtime-channel.ts` — the Realtime subscription helper.

### Create three subagents under `.claude/agents/`

Mirrors the backend pattern — commit all three now so every branch's
`.claude/agents/` stays in sync.

1. **`onboarding-ui-builder`** — profile/onboarding page. Tools: Read,
   Write, Edit, Bash. Model: default.
2. **`queue-ui-builder`** — ready-up form, waiting screen, proposed-match
   accept/decline screen. Tools: Read, Write, Edit, Bash. Model: default.
3. **`chat-ui-builder`** — confirmed-match chat screen and the
   schedule-confirmation flow, including the one new backend route this
   branch needs (see below). Tools: Read, Write, Edit, Bash. Model:
   default.

Reuse the existing `security-reviewer` (read-only) and `test-writer`
subagents from the backend work rather than creating new ones — their
job here is smaller (no service-role key ever reaches client code, no
form trusts a client-supplied user id where the session should be used
instead, Realtime subscriptions are scoped to the signed-in user's own
rows) but the roles are the same. UI tests are lower-stakes than the
backend's RLS/race-condition tests; a quick manual pass with the `/run`
skill is enough unless a contributor wants to add Playwright/RTL as a
stretch goal — don't block on it.

Write a full system prompt for each new subagent — don't just copy the
one-line descriptions above into the prompt field. Restart the session
after creating these before continuing, since `.claude/agents/` only
loads at session start.

**Plugins this branch leans on most:** `vercel@claude-plugins-official`,
`nextjs@nextjs`, `typescript-lsp`, `security-guidance`. The `supabase`
skill matters for the auth/RLS-aware reads; Context7 matters specifically
for `@supabase/ssr`'s current API.

---

## Branch — `feature/onboarding-ui`

Depends only on `chore/ui-shared-setup` being merged.

Paste into Claude Code after `git checkout -b feature/onboarding-ui`:

> Using the `onboarding-ui-builder` subagent, build the profile/onboarding
> page (`app/profile/page.tsx` or similar). Read the signed-in user's
> `profiles` row directly via the Supabase browser client (RLS already
> scopes this to their own row). Let them pick one or more default
> sports, and for each sport enter a free-text experience description.
> On submit, call `POST /api/onboarding/skill-normalize` via `apiFetch`
> for each sport. If the response has `requiresManualTier: true`, show a
> manual 1-5 tier picker instead of the suggested tier — don't silently
> drop the sport. If `saved: true`, show the saved tier with its
> `rationale` so the user can see why the model picked it. Let the user
> revisit this page later to edit their sports/tiers. Have
> `security-reviewer` confirm the page never sends a `userId` field of
> its own in the request body (the route derives identity from the
> session) and that the manual-tier fallback path is reachable and
> actually renders when confidence is low.

**Plugins this branch leans on most:** `nextjs@nextjs`, `typescript-lsp`.
The `supabase` skill matters less here — the only Supabase interaction is
a simple own-row read.

---

## Branch — `feature/queue-ui`

Depends only on `chore/ui-shared-setup` being merged.

Paste into Claude Code after `git checkout -b feature/queue-ui`:

> Using the `queue-ui-builder` subagent, build the "ready up" flow
> (`app/play/page.tsx` or similar):
>
> 1. A form — sport (prefill from the user's `default_sports`/
>    `default_skill_tier` if set, otherwise require a pick), skill tier
>    (editable, 1-5), a time-window start/end picker, a location
>    multi-select, and a casual/competitive toggle. On submit, call
>    `POST /api/queue/ready` via `apiFetch`.
> 2. If the response comes back `status: "waiting"`, show a waiting
>    screen with a cancel option, and use `useRealtimeChannel` to watch
>    the user's own `queue_entries` row (read directly via the Supabase
>    browser client) for its `status` flipping to `"matched"`.
> 3. Once matched (either immediately from the ready-up response, or via
>    the Realtime update), fetch and show the linked `proposed_matches`
>    row plus the counterpart's `queue_entries` row (RLS allows reading
>    it once linked) — sport, skill tier, time window, location overlap —
>    with a visible countdown to `expires_at` (~90 seconds) and
>    Accept/Decline buttons that call
>    `POST /api/matches/[matchId]/respond`.
> 4. On `accepted_both`, navigate to the confirmed-match chat page (from
>    `feature/chat-ui`) using the returned `confirmedMatchId`. On
>    `declined` or `expired`, return to the ready-up form.
>
> Have `security-reviewer` confirm the countdown/expiry UI can't be used
> to bypass the server-side expiry check — i.e. the Accept button calling
> a match past `expires_at` should show the server's `expired` response,
> not a client-side-only "too late" message that never actually calls the
> route. Then have `test-writer` add a smoke test for the accept/decline
> button states (disabled while a request is in flight, so a double-click
> can't fire two respond calls).

**Plugins this branch leans on most:** `nextjs@nextjs`, `typescript-lsp`,
`supabase@claude-plugins-official` (the Realtime subscription and the
RLS-scoped reads are the trickiest part of this branch).

---

## Branch — `feature/chat-ui`

Depends on `chore/ui-shared-setup` being merged. Also needs one small
backend addition that doesn't exist yet — see below.

**Backend gap to close first (or as the first step of this branch):**
`feature/llm-integrations`'s scheduling-extraction call
(`POST /api/matches/[matchId]/messages`) returns a `scheduleSuggestion`,
but there's currently no route that writes a confirmed date/time/court
back to `confirmed_matches` — `respond_to_match` already created that row
with a default (earliest overlapping time, first shared location) when
the match was accepted. Add `PATCH /api/matches/[matchId]/schedule`:
verify the caller is a participant (reuse the pattern from
`respond_to_match` / `is_confirmed_match_participant`), validate
`{ date, time, court }` (`court` constrained to `lib/courts.ts`'s enum,
same defense-in-depth check as the scheduling-extraction code), and
update `confirmed_matches.agreed_time` / `agreed_location` via the
service-role client — authenticated users have no direct write policy on
that table, same reasoning as everywhere else in this schema. This is
backend work, not UI, but it's small and this branch is the only one
blocked on it.

Paste into Claude Code after `git checkout -b feature/chat-ui`:

> Using the `chat-ui-builder` subagent: first, add the
> `PATCH /api/matches/[matchId]/schedule` route described above (small,
> backend-only — reuse `lib/supabase/service-client.ts` and
> `lib/courts.ts` from the existing backend code, don't reinvent them).
>
> Then build the confirmed-match chat page (`app/matches/[matchId]/page.tsx`
> or similar): a message list read via the Supabase browser client
> (`messages`, RLS-scoped) kept live with `useRealtimeChannel`, and a send
> box that calls `POST /api/matches/[matchId]/messages`. When a response
> includes a non-null `scheduleSuggestion`, render an inline "confirm
> chip" with the suggested date/time/court; tapping it calls the new
> `PATCH /api/matches/[matchId]/schedule` route, then shows a confirmation
> banner with the finalized time/place read back from `confirmed_matches`.
> The chip must never write to `confirmed_matches` on its own without the
> user tapping it — the model's suggestion is a suggestion, not an
> auto-applied change.
>
> Have `security-reviewer` check the new PATCH route specifically —
> confirm it verifies participancy server-side (not just that the button
> was reachable in the UI) and that `court` really is constrained to the
> enum, not just whatever string the client sent. Then have `test-writer`
> add a test for the new route's participant check (a non-participant's
> request should be rejected) and a fallback-path test for what the chat
> UI shows when `scheduleSuggestion` is null (i.e., most messages).

**Plugins this branch leans on most:** `supabase@claude-plugins-official`
(Realtime messages, the new route's RLS-adjacent check),
`typescript-lsp`, `security-guidance` (this branch, uniquely among the
three, also touches a privileged backend route).

---

## If you have more than three people

Each of the three branches above can split further without much
coordination overhead:

- `feature/queue-ui` → **ready-up form** (step 1 above) vs. **match
  response screen** (steps 2-4) — they share types (the `ReadyUpResult`
  shape) but not files.
- `feature/chat-ui` → **messages** (list + send) vs. **schedule
  confirmation** (the chip + the new PATCH route) — the chip only needs
  the shape of a `scheduleSuggestion`, not the message-list
  implementation.

Don't split `feature/onboarding-ui` further — it's small enough that
splitting it would create more coordination overhead than it saves.

## Explicitly out of scope for all three branches

Visual design polish beyond "usable and not broken" — spacing, color
choices, and animation are each contributor's call, but a full design
pass (design tokens, illustration, marketing polish) isn't the goal here.
Mobile-native anything — this is a responsive web app only.

## Merge order and coordination

1. Merge `chore/ui-shared-setup` first — everything else depends on its
   layout, auth, and shared components.
2. `feature/onboarding-ui`, `feature/queue-ui`, and `feature/chat-ui`
   touch different page directories and shouldn't conflict with each
   other on files — merge in any order. The one likely friction point is
   the nav in `app/layout.tsx`: shared setup should define its final
   structure (including placeholder links) up front specifically so the
   three branches don't each need to edit it.
