import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseReadyUpInput, readyUp } from "@/lib/matching/ready-up";
import { ValidationError } from "@/lib/http-errors";

const validBody = {
  sport: "tennis",
  skillTier: 3,
  timeWindowStart: "2026-09-10T18:00:00.000Z",
  timeWindowEnd: "2026-09-10T19:00:00.000Z",
  locations: ["Reis Tennis Center"],
  intensity: "casual" as const,
};

describe("parseReadyUpInput", () => {
  it("accepts a well-formed body", () => {
    expect(parseReadyUpInput(validBody)).toEqual(validBody);
  });

  it.each([
    ["missing sport", { ...validBody, sport: "" }],
    ["skillTier out of range", { ...validBody, skillTier: 6 }],
    ["skillTier not an integer", { ...validBody, skillTier: 2.5 }],
    ["invalid start timestamp", { ...validBody, timeWindowStart: "not-a-date" }],
    ["end before start", { ...validBody, timeWindowEnd: "2026-09-10T17:00:00.000Z" }],
    ["empty locations", { ...validBody, locations: [] }],
    ["invalid intensity", { ...validBody, intensity: "hardcore" }],
  ])("rejects %s", (_label, body) => {
    expect(() => parseReadyUpInput(body)).toThrow(ValidationError);
  });
});

function mockClient(rpcImpl: (fn: string, args: unknown) => Promise<{ data: unknown; error: unknown }>) {
  return { rpc: rpcImpl } as unknown as SupabaseClient;
}

describe("readyUp", () => {
  it("reports 'waiting' when no compatible candidate was found", async () => {
    const client = mockClient(async () => ({
      data: [{ queue_entry_id: "q1", proposed_match_id: null, matched_entry_id: null }],
      error: null,
    }));

    const result = await readyUp(client, "user-1", validBody);

    expect(result).toEqual({
      queueEntryId: "q1",
      status: "waiting",
      proposedMatchId: null,
    });
  });

  it("reports 'matched' when the RPC returns a proposed match", async () => {
    const client = mockClient(async () => ({
      data: [{ queue_entry_id: "q1", proposed_match_id: "pm1", matched_entry_id: "q2" }],
      error: null,
    }));

    const result = await readyUp(client, "user-1", validBody);

    expect(result).toEqual({
      queueEntryId: "q1",
      status: "matched",
      proposedMatchId: "pm1",
    });
  });

  it("throws when the RPC errors", async () => {
    const client = mockClient(async () => ({
      data: null,
      error: { message: "boom" },
    }));

    await expect(readyUp(client, "user-1", validBody)).rejects.toThrow(/boom/);
  });
});
