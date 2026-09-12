# Cornell Racket Queue

Say you're free, get matched with another Cornell student at your level
who's free in the same window, play the same day.

Next.js 16 App Router (deployed as Vercel Functions) + Supabase
(Postgres, Auth, Realtime — no Edge Functions, one deploy target).

Live: https://cornell-paddle-match.vercel.app

## Status

The app is built and deployed. It is **not yet functional in production**:
all six environment variables on Vercel are still literal
`placeholder-*` strings, so every signed-in feature fails on submit. The
public pages (landing, privacy, terms, accessibility) work.

Check at any time:

```bash
curl -s https://cornell-paddle-match.vercel.app/api/health
```

`{"ok":true}` means configured, reachable, and migrated. Anything else
says which of the three is missing.

### Going live

1. Create a Supabase project. From Settings → API take the project URL,
   the `anon` key and the `service_role` key.
2. Push the schema (works over the network, no Docker needed):
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```
3. Set all six variables on Vercel (`SUPABASE_URL` is the same value as
   `NEXT_PUBLIC_SUPABASE_URL`; `CRON_SECRET` is any long random string):
   ```bash
   npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
   # ...and the other five
   ```
4. **Redeploy.** This is not optional: `NEXT_PUBLIC_*` values are baked
   into the browser bundle at build time, so changing them without
   rebuilding leaves the old values shipping to browsers.
   ```bash
   npx vercel deploy --prod
   ```

Supabase turns on email confirmation by default, with a rate-limited
built-in SMTP (a few messages an hour). For demos, turn off
Auth → Providers → Email → "Confirm email", or sign-ups will stall.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Anthropic credentials
npm run dev
```

| Command | What it does |
|---|---|
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | vitest (unit tests under `tests/`) |
| `npm run build` | Next.js production build |

All three run on every push and pull request — see
[.github/workflows/ci.yml](.github/workflows/ci.yml).

## Stack notes

- **Styling**: Tailwind CSS v4, all tokens in `app/globals.css`.
  Neumorphic surfaces on a warm ground; Cornell Big Red and a court-lime
  accent; Palatino display with EB Garamond / Crimson Text standing in
  for Cornell's commercial Freight faces. Shadow carries affordance,
  colour and borders carry state, so nothing depends on an effect that
  vanishes under forced-colours.
- **Auth/session**: `@supabase/ssr` — `lib/supabase/browser-client.ts`
  (Client Components), `lib/supabase/server-client.ts` (Server
  Components), `proxy.ts` (session refresh + guarding the signed-in
  area; Next 16's renamed `middleware.ts`).

  `browser-client.ts` reads its two `NEXT_PUBLIC_*` values as literal
  static expressions on purpose. Next can only inline them into the
  browser bundle where the name appears literally, so routing them
  through a `requireEnv(name)` helper makes every client-side Supabase
  call throw. Don't refactor those two lines.
- **UI primitives**: `components/ui/*` (Button via `cva`, Card, TextInput
  and Select via `@base-ui/react`, Spinner, Skeleton). Toasts via
  `sonner`.
- **Data**: `lib/api-client.ts`'s `apiFetchJson` for this repo's own API
  routes (attaches the session's bearer token, throws a typed
  `ApiError`); read RLS-scoped tables directly via the Supabase browser
  client. `hooks/use-realtime-channel.ts` for live Postgres-change
  subscriptions.
- **Routes**: `app/(auth)/sign-in`, `app/(auth)/sign-up` (no nav chrome);
  `app/(app)/*` behind sign-in, wrapped in `components/nav.tsx`; legal
  pages under `app/(legal)/*`.

## API routes

All routes expect `Authorization: Bearer <supabase access token>` unless
noted; see `lib/supabase/verify-user.ts`. `/api/*` is excluded from the
proxy matcher — these authenticate from the token, not a cookie.

| Route | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Deployment readiness. Distinguishes an unset variable from a placeholder, and a reachable database from a migrated one. Booleans and names only, never a value. No auth. |
| `/api/queue/ready` | POST | Join the queue and atomically match against a compatible waiting entry. Sweeps expired proposals first, so the pool heals itself without a scheduler. |
| `/api/matches/[matchId]/respond` | POST | Accept or decline a proposed match; creates `confirmed_matches` once both sides accept. Expiry is handled inline, so a stale proposal cannot be accepted. |
| `/api/matches/[matchId]/messages` | POST | Send a chat message, then (if it passes a cheap keyword pre-filter) run forced-tool-use scheduling extraction and return a `scheduleSuggestion` above confidence 0.6. Never writes to `confirmed_matches` itself. |
| `/api/matches/[matchId]/schedule` | PATCH | Confirm a time and court into the match. The court is re-validated against `lib/courts.ts` here, because the extractor's schema constraint says nothing about what a browser chose to send. |
| `/api/onboarding/skill-normalize` | POST | Forced-tool-use call classifying a free-text experience description into a 1–5 tier. Below confidence 0.6 nothing is saved and the client shows a manual picker. |
| `/api/cron/sweep-expired-matches` | GET | Vercel Cron only (`Authorization: Bearer $CRON_SECRET`). Runs daily as a janitor. Correctness does not depend on it — `ready_up()` sweeps opportunistically — which is what makes this work on a Hobby plan that cannot run sub-daily crons. |

## Data

`lib/courts.ts` holds the real venue list: which courts host which sport,
which are open-rec, which are residents-only, and which need a
reservation. It was researched against Cornell recreation pages and
corrected against on-the-ground knowledge. Sources are cited in the file
header. Treat it as verified, and re-check hours each semester.

## Schema

Five tables, RLS on all of them, plus `SECURITY DEFINER` functions for
the operations that legitimately cross users (`ready_up`,
`respond_to_match`, `update_match_schedule`, `sweep_expired_matches`),
each revoked from `anon`/`authenticated` and callable only by the service
role. See [supabase/README.md](supabase/README.md) and
[docs/schema-contract.md](docs/schema-contract.md).

## Known gaps

- No CSP. The App Router emits inline hydration scripts, so a CSP worth
  having needs per-request nonce plumbing, and a wrong `connect-src`
  silently stops Supabase realtime from reconnecting. Left out rather
  than shipped as something that only looks like protection. Other
  security headers are set in `next.config.ts`.
- Auto-deploy is off — the Vercel GitHub App is not authorised for this
  repo, so deploys are manual (`npx vercel deploy --prod`).
- The legal pages describe the app's real data flows accurately, but
  have had no legal review.
