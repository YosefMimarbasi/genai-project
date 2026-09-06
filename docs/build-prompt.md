# Cornell Paddle Match — Claude Code build prompts (parallel branches)

## How this is organized

One person runs **Shared setup** once and merges it to `main` first. After
that, three people can each check out their own branch and paste that
branch's prompt into a separate Claude Code session, working in parallel.

```
main
 ├─ feature/schema-rls         (merge this one first)
 ├─ feature/matching-engine
 └─ feature/llm-integrations
```

`feature/matching-engine` and `feature/llm-integrations` both read/write
tables `feature/schema-rls` defines, but they don't have to wait to
*start* — the schema below is fully specified, so both branches can
develop against a local copy of the same migration file from day one,
then drop that file from their own PR once they rebase onto `main` after
`feature/schema-rls` merges.

Tests live inside each branch, not as a separate branch — each piece is
best placed to test its own failure modes, and a cross-cutting test
branch would just create merge conflicts touching all three.

Read the whole **Shared setup** section even if you're only running one
branch — it's the schema and LLM I/O contracts every branch builds
against.

Scope reminder for everyone: backend and data layer only. No pages,
components, styling, or design work. Hosting target: Vercel (Next.js App
Router, deployed as Vercel Functions) + Supabase (Postgres, Auth, Realtime
only — no Supabase Edge Functions, so everything ships from one deploy
target).

---

## Shared setup (run once, on its own branch, merge to `main` first)

### Install plugins

```
/plugin install supabase@claude-plugins-official
/plugin install vercel@claude-plugins-official
/plugin install typescript-lsp@claude-plugins-official
/plugin install security-guidance@claude-plugins-official
/plugin install commit-commands@claude-plugins-official

/plugin marketplace add supabase/agent-skills
/plugin install supabase@supabase-agent-skills

/plugin marketplace add vercel/next.js
/plugin install nextjs@nextjs

/plugin marketplace add upstash/context7
/plugin install context7-plugin@context7-marketplace
```

Same set as a single-branch build, plus Context7 — added because the
LLM-integrations branch specifically benefits from live SDK doc lookups.
Each branch section below says which of these it actually leans on; the
rest can be `/plugin disable`d per-session to keep that contributor's
context lean.

### Commit shared config so every teammate's session picks it up automatically

Add to `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "supabase-agent-skills": {
      "source": { "source": "github", "repo": "supabase/agent-skills" }
    },
    "nextjs": {
      "source": { "source": "github", "repo": "vercel/next.js" }
    },
    "context7-marketplace": {
      "source": { "source": "github", "repo": "upstash/context7" }
    }
  },
  "enabledPlugins": [
    "supabase@claude-plugins-official",
    "vercel@claude-plugins-official",
    "typescript-lsp@claude-plugins-official",
    "security-guidance@claude-plugins-official",
    "commit-commands@claude-plugins-official",
    "supabase@supabase-agent-skills",
    "nextjs@nextjs",
    "context7-plugin@context7-marketplace"
  ]
}
```

This registers marketplaces and expected plugins for anyone who trusts the
repo folder. Externally-sourced plugins may still show a one-time install
prompt the first time each teammate opens the repo — that's normal.

### Create all five subagents under `.claude/agents/`

Commit all five now even though any one branch will only actively invoke
two or three of them — this keeps every branch's `.claude/agents/` in
sync so nobody hits a missing-subagent surprise after rebasing.

1. **`schema-migrator`** — designs Postgres migrations and RLS policies.
   Tools: Read, Write, Edit, Bash. Model: default (correctness-critical,
   don't route to a cheaper model).
2. **`matching-engine-builder`** — ready-up route, claim logic, accept/
   decline route, expiry sweep. Tools: Read, Write, Edit, Bash. Model:
   default.
3. **`llm-integration-builder`** — the two Anthropic API integrations,
   forced structured/tool-use output only, never free-form generation
   parsed after the fact. Tools: Read, Write, Edit, Bash. Model: default.
4. **`security-reviewer`** — read-only. Checks RLS gaps that would leak
   one user's data to another, the queue race condition, and prompt-
   injection exposure where user-authored chat text reaches an LLM call.
   Tools: Read, Grep, Glob only — no Write/Edit/Bash. Model: default.
5. **`test-writer`** — RLS enforcement tests, the queue race-condition
   test, LLM fallback-path tests. Tools: Read, Write, Edit, Bash. Model:
   a cheaper/faster model is fine for the mechanical parts; use default
   if a test needs to reason carefully about the race condition.

Write a full system prompt yourself for each — don't just copy the
one-line descriptions above into the prompt field. Subagents can't spawn
their own subagents, and `.claude/agents/` loads at session start, so
restart the session after creating these before continuing.

### Schema (shared contract — all three branches build against this)

Tables, as Postgres migrations with RLS enabled on every table:

- `profiles` — user id (references `auth.users`), cornell email, default
  sport(s), default skill tier per sport.
- `queue_entries` — user id, sport, skill tier (snapshot from profile,
  overridable), time window, location preference(s), intensity
  (casual/competitive), status (`waiting` / `matched` / `expired`),
  created_at.
- `proposed_matches` — entry_a id, entry_b id, status (`pending` /
  `accepted_both` / `declined` / `expired`), created_at, expires_at
  (~90 seconds out).
- `confirmed_matches` — proposed_match id, agreed time, agreed location,
  created_at.
- `messages` — confirmed_match id, sender id, content, created_at.

RLS: a user can read/write their own `queue_entries` row; can read (not
write) the other side's row only once a `proposed_matches` row links
them; can read/write `messages` only for a `confirmed_match` they're part
of. Restrict signup/auth to `@cornell.edu` addresses.

---

## Branch 1 — `feature/schema-rls`

**Merge this one first.** Owns the actual migrations and RLS policies —
the other two branches build against a local copy of the same schema but
shouldn't duplicate the migration file in their own PR.

Paste into Claude Code after `git checkout -b feature/schema-rls`:

> Using the `schema-migrator` subagent, write the Postgres migrations and
> RLS policies for the schema above. Restrict signup to `@cornell.edu`.
> Have `security-reviewer` check the RLS policies once written —
> specifically confirm a user cannot read another user's `queue_entries`
> row before a `proposed_matches` link exists, and cannot read `messages`
> from a `confirmed_match` they're not part of. Then have `test-writer`
> add RLS enforcement tests.

**Plugins this branch leans on most:** `supabase@claude-plugins-official`
(MCP — inspect/apply schema directly against the live project),
`supabase-postgres-best-practices` skill, `security-guidance`. The
`vercel` and `nextjs` skills aren't very relevant here — feel free to
`/plugin disable` them for this session.

---

## Branch 2 — `feature/matching-engine`

Depends on the schema above (use the same migration file locally; drop it
from your own PR once you rebase onto `main` after Branch 1 merges).

Paste into Claude Code after `git checkout -b feature/matching-engine`:

> Using the `matching-engine-builder` subagent, build one route handler
> (e.g. `POST /api/queue/ready`) that, in a single request: inserts the
> caller's `queue_entries` row; searches for a compatible `waiting` entry
> (sport match, skill proximity, time-window overlap, shared location);
> if found, atomically claims both rows with an `UPDATE ... WHERE status =
> 'waiting'` guard so a concurrent request can't double-claim, then
> creates the `proposed_matches` row. Also build an accept/decline route
> (creates `confirmed_matches` on mutual accept, reverts both to `waiting`
> on any decline or on expiry) and a Vercel Cron job that sweeps any
> `proposed_matches` past `expires_at` back to `waiting` on both linked
> entries. Have `security-reviewer` check the claim-update logic for the
> race condition specifically — two simultaneous ready-ups should never
> double-match the same entry. Then have `test-writer` add a test that
> fires concurrent ready-ups and asserts only one match forms.

**Plugins this branch leans on most:** `vercel@claude-plugins-official`
(Cron config, deploying route handlers), `nextjs@nextjs` (App Router route
handler conventions), `typescript-lsp` (this piece has the most nontrivial
TypeScript logic of the three), `security-guidance`. The Supabase
best-practices skill matters less here — you're mostly writing queries
and one atomic update, not designing schema.

---

## Branch 3 — `feature/llm-integrations`

Also depends on the schema above (same note as Branch 2 — local copy now,
drop from your PR after rebasing post-merge).

Paste into Claude Code after `git checkout -b feature/llm-integrations`:

> Using the `llm-integration-builder` subagent, build two routes with
> `@anthropic-ai/sdk`, both using forced tool-use/JSON output on a
> fast/cheap model (Claude Haiku) — never free-form generation parsed
> after the fact.
>
> Skill normalizer (one call per sport at onboarding): input is a free-text
> experience description plus sport name; output schema is
> `{ tier: 1-5, confidence: 0-1, rationale: string }`. If confidence is
> below ~0.6, don't save the suggested tier — surface a manual tier picker
> instead.
>
> Scheduling extraction (fires on messages in a confirmed match's chat):
> gate it with a cheap regex/keyword pre-filter first (day names, times,
> "tmrw", known court names) and only call the model on messages that pass.
> Input is the message text, current server date/time in the user's
> timezone, and the enum of valid court names. Output schema is
> `{ has_proposal: bool, date: string|null, time: string|null,
> court: enum|null, confidence: 0-1 }` — `court` must be constrained to the
> valid enum so it can never return a made-up location. Only surface a
> confirm chip above a reasonable confidence threshold; the model never
> writes to `confirmed_matches` directly — a human tap on the chip calls
> the accept route from Branch 2.
>
> If you need current syntax for the SDK or tool-use forcing, use Context7
> rather than guessing. Have `security-reviewer` check specifically for
> prompt-injection exposure — the scheduling-extraction call processes
> arbitrary user-authored chat text, so confirm the system prompt can't be
> overridden by message content and that `court` is genuinely constrained
> to the enum, not just requested to be. Then have `test-writer` add tests
> for both calls' low-confidence fallback paths.

**Plugins this branch leans on most:** the Context7 MCP (this is the one
piece pulling from a fast-moving SDK — worth checking current docs
instead of relying on training data), `typescript-lsp`, `security-guidance`
(the highest actual risk surface of the three branches, since it's the
one ingesting free-form user text into a model call). The `supabase` and
`nextjs` skills matter less here — these routes barely touch the schema
beyond reading a couple of fields.

---

## Explicitly out of scope for all three branches

No page layouts, component styling, or design polish. Route handlers,
schema, RLS, the matching logic, and the two LLM integrations only. Stub
UI-adjacent behavior (like the "confirm chip") as a plain API contract the
frontend will consume later, not as an actual rendered element.

## Merge order and coordination

1. Merge `feature/schema-rls` first.
2. Rebase `feature/matching-engine` and `feature/llm-integrations` onto
   updated `main`, dropping each branch's local copy of the migration file
   if it now conflicts with the merged one.
3. `feature/matching-engine` and `feature/llm-integrations` touch
   different route files and shouldn't conflict with each other — merge
   in either order.
