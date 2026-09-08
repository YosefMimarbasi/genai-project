# Cornell Paddle Match

A Cornell paddle-sports matching app. Next.js App Router (deployed as
Vercel Functions) + Supabase (Postgres, Auth, Realtime — no Edge
Functions, one deploy target).

## Branches

Backend (done, merged to `main`):

```
main
 ├─ feature/schema-rls         (merged)
 ├─ feature/matching-engine    (merged)
 └─ feature/llm-integrations   (merged)
```

See [docs/build-prompt.md](docs/build-prompt.md) for how the backend was
built and [docs/schema-contract.md](docs/schema-contract.md) for the
schema/RLS contract it implements.

Frontend: see [docs/frontend-build-prompt.md](docs/frontend-build-prompt.md).

```
main
 ├─ chore/ui-shared-setup      (merged)
 ├─ feature/onboarding-ui      (PR open — awaiting review)
 ├─ feature/queue-ui           (up for grabs)
 └─ feature/chat-ui            (up for grabs — has a small backend gap to close first, see the doc)
```

## Setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Anthropic credentials
npm run dev
```

- `npm run typecheck` — TypeScript, no emit
- `npm test` — vitest (unit tests under `tests/`)
- `npm run build` — Next.js production build

## Frontend stack

- **Styling**: Tailwind CSS v4 (tokens declared in `app/globals.css` —
  Cornell Red accent, Geist type, hairline borders, restrained shadow).
- **Auth/session**: `@supabase/ssr` — `lib/supabase/browser-client.ts`
  (Client Components), `lib/supabase/server-client.ts` (Server
  Components), `proxy.ts` (session refresh + redirect, Next.js 16's
  renamed `middleware.ts`).
- **UI primitives**: `components/ui/*` (Button via `cva`, Card,
  TextInput and Select via `@base-ui/react`, Spinner). Toasts via
  `sonner` (`<Toaster />` in `app/layout.tsx`, call `toast()` from
  anywhere).
- **Data**: `lib/api-client.ts`'s `apiFetchJson` for this repo's own API
  routes (attaches the session's bearer token, throws a typed `ApiError`
  on failure); read RLS-scoped tables directly via the Supabase browser
  client. `hooks/use-realtime-channel.ts` for live Postgres-change
  subscriptions.
- **Design/animation guidance**: `.claude/skills/web-design-engineer`,
  `emil-design-eng`, `apple-design`, `animate`, `pick-ui-library` — read
  before adding UI or motion to any page.
- Route layout: `app/(auth)/sign-in`, `app/(auth)/sign-up` (no nav
  chrome); `app/(app)/*` (wrapped in `components/nav.tsx` via
  `app/(app)/layout.tsx`) for everything behind sign-in.

## API routes

All routes expect `Authorization: Bearer <supabase access token>` unless
noted otherwise; see `lib/supabase/verify-user.ts`.

| Route | Method | Purpose |
|---|---|---|
| `/api/queue/ready` | POST | Join the queue and atomically match against a compatible waiting entry if one exists. |
| `/api/matches/[matchId]/respond` | POST | Accept or decline a proposed match; creates `confirmed_matches` once both sides accept. |
| `/api/cron/sweep-expired-matches` | GET | Vercel Cron only (`Authorization: Bearer $CRON_SECRET`) — reverts expired proposed matches back to `waiting`. Configured in `vercel.json`, every 5 minutes; tune against the ~90s expiry window and your Vercel plan's cron-frequency limits. |
| `/api/onboarding/skill-normalize` | POST | Forced-tool-use call to classify a free-text experience description into a 1-5 skill tier. Below confidence 0.6, nothing is saved — the client should show a manual tier picker instead. |
| `/api/matches/[matchId]/messages` | POST | Sends a chat message in a confirmed match, then (if the message passes a cheap keyword pre-filter) runs forced-tool-use scheduling extraction and returns a `scheduleSuggestion` above confidence 0.6. Never writes to `confirmed_matches` itself. There's currently no route for a human tap on the resulting chip to call — see the "backend gap" note in [docs/frontend-build-prompt.md](docs/frontend-build-prompt.md) under `feature/chat-ui`. |

**`lib/courts.ts` is a placeholder list of Cornell facility names, not
verified against the current real ones — confirm before shipping.**

## Subagents

Defined under `.claude/agents/`:

- Backend: `schema-migrator`, `matching-engine-builder`,
  `llm-integration-builder`
- Frontend: `onboarding-ui-builder`, `queue-ui-builder`, `chat-ui-builder`
- Cross-cutting: `security-reviewer` (read-only), `test-writer`
