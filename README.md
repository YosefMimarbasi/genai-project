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

## Subagents

Defined under `.claude/agents/`: `schema-migrator`,
`matching-engine-builder`, `llm-integration-builder`, `security-reviewer`
(read-only), `test-writer`.
