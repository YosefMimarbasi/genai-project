# Cornell Paddle Match

Backend/data layer for a Cornell paddle-sports matching app. Next.js App
Router (deployed as Vercel Functions) + Supabase (Postgres, Auth,
Realtime — no Edge Functions, one deploy target).

Scope: route handlers, schema, RLS, matching logic, and the two LLM
integrations only. No pages, components, styling, or design work.

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

Frontend (not started): see
[docs/frontend-build-prompt.md](docs/frontend-build-prompt.md) for the
`chore/ui-shared-setup` + `feature/onboarding-ui` / `feature/queue-ui` /
`feature/chat-ui` breakdown.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Anthropic credentials
npm run dev
```

- `npm run typecheck` — TypeScript, no emit
- `npm test` — vitest (unit tests under `tests/`)
- `npm run build` — Next.js production build

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

Defined under `.claude/agents/`: `schema-migrator`,
`matching-engine-builder`, `llm-integration-builder`, `security-reviewer`
(read-only), `test-writer`.
