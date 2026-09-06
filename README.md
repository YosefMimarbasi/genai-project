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

## Subagents

Defined under `.claude/agents/`: `schema-migrator`,
`matching-engine-builder`, `llm-integration-builder`, `security-reviewer`
(read-only), `test-writer`.
