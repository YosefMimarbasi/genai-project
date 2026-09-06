import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseRespondInput, respondToMatch } from "@/lib/matching/respond";
import { ValidationError } from "@/lib/http-errors";

function mockClient(rpcImpl: (fn: string, args: unknown) => Promise<{ data: unknown; error: unknown }>) {
  return { rpc: rpcImpl } as unknown as SupabaseClient;
}

describe("parseRespondInput", () => {
  it("accepts 'accepted' and 'declined'", () => {
    expect(parseRespondInput({ response: "accepted" })).toBe("accepted");
    expect(parseRespondInput({ response: "declined" })).toBe("declined");
  });

  it("rejects anything else", () => {
    expect(() => parseRespondInput({ response: "maybe" })).toThrow(ValidationError);
    expect(() => parseRespondInput({})).toThrow(ValidationError);
    expect(() => parseRespondInput(null)).toThrow(ValidationError);
  });
});

describe("respondToMatch", () => {
  it("returns accepted_both + confirmedMatchId once both sides accept", async () => {
    const client = mockClient(async () => ({
      data: [{ status: "accepted_both", confirmed_match_id: "cm1" }],
      error: null,
    }));

    const result = await respondToMatch(client, "pm1", "user-1", "accepted");

    expect(result).toEqual({ status: "accepted_both", confirmedMatchId: "cm1" });
  });

  it("returns pending (no confirmed match yet) after only one side accepts", async () => {
    const client = mockClient(async () => ({
      data: [{ status: "pending", confirmed_match_id: null }],
      error: null,
    }));

    const result = await respondToMatch(client, "pm1", "user-1", "accepted");

    expect(result).toEqual({ status: "pending", confirmedMatchId: null });
  });

  it("throws (for the route handler to map to a 403) when the RPC raises", async () => {
    const client = mockClient(async () => ({
      data: null,
      error: { message: "user is not a participant in this proposed match" },
    }));

    await expect(respondToMatch(client, "pm1", "user-1", "accepted")).rejects.toThrow(
      /not a participant/
    );
  });
});
