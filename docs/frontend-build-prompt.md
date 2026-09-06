# Cornell Paddle Match — frontend build prompts (parallel branches)

The backend is done and merged to `main` (see [docs/build-prompt.md](build-prompt.md)
for how it was built, and the root [README.md](../README.md) for the API
route reference). This doc breaks the remaining UI/UX work into one shared
setup pass plus three parallel branches, the same shape as the backend
split.

## How this is organized

**`chore/ui-shared-setup` is done and merged to `main`.** Two more
branches are up for grabs — check out one and paste its prompt into a
Claude Code session.

```
main
 ├─ chore/ui-shared-setup      (merged)
 ├─ feature/onboarding-ui      (in progress)
 ├─ feature/queue-ui           (up for grabs)
 └─ feature/chat-ui            (up for grabs)
```

The design/animation skills used while building shared setup — and worth
loading for these branches too — are installed under `.claude/skills/`:
`web-design-engineer`, `emil-design-eng`, `apple-design`, `animate`,
`pick-ui-library`.

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

### What got built (as-built, supersedes the plan above where they differ)

1. Tailwind v4 — no `tailwind.config.ts` needed (v4 auto-detects content
   and takes tokens via the `@theme` block in `app/globals.css` instead
   of a JS config). `postcss.config.mjs` wires in `@tailwindcss/postcss`.
2. `lib/supabase/browser-client.ts` and `lib/supabase/server-client.ts`,
   via `@supabase/ssr`'s current `getAll`/`setAll` cookie API (its older
   `get`/`set`/`remove` shape is deprecated — checked against the
   installed package's own types rather than assumed).
3. `proxy.ts`, not `middleware.ts` — Next.js 16 renamed the convention
   (`middleware.ts` now builds with a deprecation warning; the exported
   function must be named `proxy`, not `middleware`). Redirects signed-out
   requests to `/sign-in`, signed-in requests away from `/sign-in`
   `/sign-up`.
4. `app/(auth)/sign-in`, `app/(auth)/sign-up` — a route group with no nav
   chrome, separate from `app/(app)/*` which gets `components/nav.tsx`
   via `app/(app)/layout.tsx`. Sign-up does a client-side `@cornell.edu`
   format check as a nudge (real enforcement is still the server-side
   trigger from `feature/schema-rls`) and surfaces whatever error
   Supabase Auth returns otherwise.
5. `app/(app)/page.tsx` — a minimal 3-card hub (Play / Matches / Profile)
   so there's a real landing point at `/`; not a placeholder to delete,
   just don't expect it to grow beyond a nav hub.
6. `components/ui/button.tsx` (variants via `cva`), `card.tsx`,
   `text-input.tsx` and `select.tsx` (via `@base-ui/react`'s `Field` and
   `Select`, not hand-rolled — accessible focus/dismiss/keyboard handling
   for free), `spinner.tsx`. Toasts are `sonner`'s `<Toaster />` (wired
   in `app/layout.tsx`) + its `toast()` function — no custom
   `ErrorBanner`, per `pick-ui-library`'s own recommendation.
7. `lib/api-client.ts` — `apiFetch` (raw) and `apiFetchJson` (throws a
   typed `ApiError` on non-2xx) helpers.
8. `hooks/use-realtime-channel.ts` — the Realtime subscription helper.
   Requires the target table to be in the `supabase_realtime`
   publication; added `supabase/migrations/20260906230000_enable_realtime.sql`
   for `queue_entries`, `proposed_matches`, `confirmed_matches`,
   `messages` — RLS still applies per-subscriber on top of that.
9. `app/globals.css` declares the actual design system (Design Read +
   five dials reasoning lives in the commit message): Cornell Red
   (`#B31B1B`) as the single accent, Geist Sans/Mono (via the `geist`
   npm package — Vercel's own type, a natural fit for a Vercel-hosted
   app), warm off-white background, hairline borders over shadow,
   custom `ease-out`/`ease-in-out` curves per `emil-design-eng`.
10. `motion` (npm: `motion`, formerly Framer Motion) installed but not
    yet used anywhere — reach for it only for springs/gestures/layout
    animation; plain CSS transitions cover buttons, cards, and popups
    (see `components/ui/select.tsx`'s origin-aware popup transition for
    the pattern).

Verified: `npm run typecheck`, `npm run build`, and a real dev-server
pass in a browser (sign-in redirect, sign-up form + validation, hover/
focus/press states) — not just "it compiles." No live Supabase project in
this environment, so auth calls themselves weren't exercised end-to-end;
placeholder env values were enough to verify rendering and client-side
logic.

### Three subagents under `.claude/agents/` (done)

`onboarding-ui-builder`, `queue-ui-builder`, `chat-ui-builder` — full
system prompts, not one-liners. `security-reviewer` and `test-writer`
from the backend work are reused as-is; their job here is smaller (no
service-role key in client code, no form trusting a client-supplied user
id, Realtime scoped to the signed-in user's own rows) but the roles are
the same. UI tests are lower-stakes than the backend's RLS/race-condition
tests — a manual pass via the `/run` skill is enough unless a contributor
wants Playwright/RTL as a stretch goal.

**Restart your session before starting a feature branch** — `.claude/agents/`
only loads at session start, so a session opened before this merged won't
see the three new subagents.

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
