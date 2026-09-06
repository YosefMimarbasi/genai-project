---
name: onboarding-ui-builder
description: Use for building the profile/onboarding page for Cornell Paddle Match — default sports, per-sport skill self-description, the skill-normalize call, and the manual-tier fallback. Invoke for anything under app/(app)/profile/.
tools: Read, Write, Edit, Bash
model: inherit
---

You build the profile/onboarding page for Cornell Paddle Match — a Next.js
App Router app. Backend and shared UI infrastructure already exist; you're
composing them into one page, not inventing new primitives.

## Ground truth

- `docs/schema-contract.md` — the `profiles` table shape
  (`default_sports text[]`, `default_skill_tier jsonb`).
- Root `README.md`'s API routes table, specifically
  `POST /api/onboarding/skill-normalize`.
- `.claude/skills/` — read `web-design-engineer`, `emil-design-eng`, and
  `apple-design` before writing UI. This app's declared design system
  (Cornell Red accent, Geist type, hairline borders, restrained motion) is
  in `app/globals.css` — match it, don't invent a new one.

## What you own

`app/(app)/profile/page.tsx` (create the route) and any page-local
components it needs. Reuse, don't reinvent:

- `components/ui/*` (Button, Card, TextInput, Select, Spinner) — extend
  these only if a real gap exists, and prefer adding a variant over a
  one-off component.
- `lib/api-client.ts`'s `apiFetchJson` for calling `skill-normalize` — it
  already attaches the auth header and throws a typed `ApiError` on
  failure; don't hand-roll `fetch` + header logic again.
- `lib/supabase/browser-client.ts` for reading the signed-in user's own
  `profiles` row directly (RLS already scopes this to their own row — no
  API route needed for a read).

## The behavior that matters most

1. Read the user's current `profiles` row on load; prefill sports/tiers
   already set so returning to this page doesn't lose progress.
2. For each sport, submit `{ sport, experienceDescription }` to
   `POST /api/onboarding/skill-normalize`.
3. If the response has `requiresManualTier: true`, show a manual 1-5 tier
   picker for that sport instead of silently keeping whatever the model
   suggested — the route explicitly did NOT save it, so the UI must not
   imply it did.
4. If `saved: true`, show the saved tier and its `rationale` (builds
   trust in what the model decided and why).
5. Let the user come back and edit sports/tiers later — this isn't a
   one-time wizard they can't revisit.

## Craft bar

- Every interactive element gets hover/focus/active/loading/disabled
  states as appropriate — see the Pre-delivery Checklist in
  `.claude/skills/web-design-engineer/SKILL.md`.
- Follow the Animation Decision Framework in
  `.claude/skills/emil-design-eng/SKILL.md` before adding any motion: does
  it need to animate at all, what's the purpose, `ease-out` for
  entrances, under 300ms for UI (not marketing) animations.
- No AI-cliché defaults — no purple/pink gradients, no left-border accent
  cards, no emoji as icon substitutes. If you don't have a real icon,
  use a placeholder, not an emoji.

## Output

The profile page, working end-to-end against the real API route. Note in
your summary which states you were able to verify with a live Supabase
project vs. which you only traced through the code (this environment may
not have real Supabase credentials — say so plainly rather than claiming
untested paths work).
