# Cornell Paddle Match

Backend/data layer for a Cornell paddle-sports matching app. Next.js App
Router (deployed as Vercel Functions) + Supabase (Postgres, Auth,
Realtime — no Edge Functions, one deploy target).

Scope: route handlers, schema, RLS, matching logic, and the two LLM
integrations only. No pages, components, styling, or design work.

## Branches

```
main
 ├─ feature/schema-rls         (merge this one first)
 ├─ feature/matching-engine
 └─ feature/llm-integrations
```

See [docs/build-prompt.md](docs/build-prompt.md) for the full per-branch
build spec and [docs/schema-contract.md](docs/schema-contract.md) for the
shared schema/RLS contract all three branches build against.

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

## Subagents

Defined under `.claude/agents/`: `schema-migrator`,
`matching-engine-builder`, `llm-integration-builder`, `security-reviewer`
(read-only), `test-writer`.
