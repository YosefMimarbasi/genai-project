import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { hasRealEnv } from "@/lib/env";

// This is a real integration test against a running Supabase instance
// (`supabase start`) — it's the only way to actually exercise the
// atomicity guarantee (SELECT ... FOR UPDATE SKIP LOCKED + the guarded
// UPDATE) in ready_up(), since a mocked client would only prove the mock
// behaves as expected, not that Postgres does. Skipped when SUPABASE_URL /
// SUPABASE_SERVICE_ROLE_KEY aren't set, which is the case in this
// environment (no Docker available) — run with:
//
//   npx supabase start
//   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=<from `supabase status`> npx vitest run tests/matching/ready-up.concurrency.test.ts
//
// Scenario: the race the spec is actually worried about is two concurrent
// *new* ready-ups both finding the same *pre-existing* waiting entry as a
// candidate — not two brand-new arrivals matching each other. (Two
// simultaneous new arrivals can't match each other in the same call
// anyway: each ready_up runs in its own transaction, so under READ
// COMMITTED neither can see the other's not-yet-committed insert. Both
// would just end up 'waiting', which is correct, not a bug.) So: seed one
// waiting entry first (carol), then fire two concurrent ready-ups (alice,
// bob) that are both compatible with it, and assert exactly one of them
// claims it.

// Presence is not enough: CI sets placeholder values so the build can
// import modules that read env at module scope, and a plain truthiness
// check made this suite try to create users against
// https://placeholder.supabase.co. hasRealEnv rejects stand-in values,
// and is the same predicate /api/health uses.
const hasLiveSupabase = hasRealEnv("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY");

describe.skipIf(!hasLiveSupabase)("ready_up concurrency (requires a running local Supabase)", () => {
  let client: SupabaseClient;
  let userAlice: string;
  let userBob: string;
  let userCarol: string;

  const baseInput = {
    p_sport: "tennis",
    p_skill_tier: 3,
    p_time_window_start: new Date().toISOString(),
    p_time_window_end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    p_locations: ["Reis Tennis Center"],
    p_intensity: "casual" as const,
  };

  beforeAll(async () => {
    client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    userAlice = randomUUID();
    userBob = randomUUID();
    userCarol = randomUUID();

    for (const [id, label] of [
      [userAlice, "alice"],
      [userBob, "bob"],
      [userCarol, "carol"],
    ] as const) {
      const { error } = await client.auth.admin.createUser({
        id,
        email: `concurrency-${label}-${id.slice(0, 8)}@cornell.edu`,
        email_confirm: true,
      } as never);
      if (error) throw error;
    }

    // Carol queues first and commits before alice/bob's concurrent
    // ready-ups fire, so she's a genuinely pre-existing 'waiting' row both
    // of them can race to claim.
    const { error: carolError } = await client.rpc("ready_up", {
      ...baseInput,
      p_user_id: userCarol,
    });
    if (carolError) throw carolError;
  });

  afterAll(async () => {
    await client.auth.admin.deleteUser(userAlice);
    await client.auth.admin.deleteUser(userBob);
    await client.auth.admin.deleteUser(userCarol);
  });

  it("only one of two concurrent callers claims the same pre-existing waiting entry", async () => {
    const [resultAlice, resultBob] = await Promise.all([
      client.rpc("ready_up", { ...baseInput, p_user_id: userAlice }),
      client.rpc("ready_up", { ...baseInput, p_user_id: userBob }),
    ]);

    expect(resultAlice.error).toBeNull();
    expect(resultBob.error).toBeNull();

    const rowAlice = resultAlice.data![0];
    const rowBob = resultBob.data![0];

    // Exactly one of the two should have claimed carol; the other finds no
    // candidate (carol was the only compatible waiting entry) and stays
    // 'waiting'.
    const proposedMatchIds = [rowAlice.proposed_match_id, rowBob.proposed_match_id].filter(Boolean);
    expect(proposedMatchIds).toHaveLength(1);

    const winnerRow = rowAlice.proposed_match_id ? rowAlice : rowBob;
    const loserRow = rowAlice.proposed_match_id ? rowBob : rowAlice;

    expect(winnerRow.matched_entry_id).toBeTruthy();
    expect(loserRow.matched_entry_id).toBeNull();

    // Exactly one proposed_matches row exists linking to carol's entry —
    // never two, which would mean she got double-claimed.
    const { data: proposedMatches, error: pmError } = await client
      .from("proposed_matches")
      .select("id")
      .eq("entry_b_id", winnerRow.matched_entry_id);

    expect(pmError).toBeNull();
    expect(proposedMatches).toHaveLength(1);

    // Carol ends up 'matched' exactly once; the losing caller's own new
    // entry stays 'waiting'.
    const { data: entries, error: entriesError } = await client
      .from("queue_entries")
      .select("id, status")
      .in("id", [winnerRow.matched_entry_id, loserRow.queue_entry_id]);

    expect(entriesError).toBeNull();
    const carolEntry = entries?.find((e) => e.id === winnerRow.matched_entry_id);
    const loserEntry = entries?.find((e) => e.id === loserRow.queue_entry_id);
    expect(carolEntry?.status).toBe("matched");
    expect(loserEntry?.status).toBe("waiting");
  });
});
