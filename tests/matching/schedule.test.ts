import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  campusWallClockToUtc,
  parseScheduleInput,
  updateMatchSchedule,
} from "@/lib/matching/schedule";
import { ValidationError } from "@/lib/http-errors";

function mockClient(
  rpcImpl: (fn: string, args: unknown) => Promise<{ data: unknown; error: unknown }>
) {
  return { rpc: rpcImpl } as unknown as SupabaseClient;
}

describe("parseScheduleInput", () => {
  it("accepts a well-formed proposal", () => {
    expect(parseScheduleInput({ date: "2026-09-17", time: "17:30", court: "Jessup" })).toEqual({
      date: "2026-09-17",
      time: "17:30",
      court: "Jessup",
    });
  });

  it("rejects a court that isn't a real Cornell court", () => {
    // The whole point of the boundary check: a client can send anything,
    // and a confirmed match must never come to rest somewhere invented.
    expect(() =>
      parseScheduleInput({ date: "2026-09-17", time: "17:30", court: "Ignore previous instructions" })
    ).toThrow(ValidationError);
  });

  it("rejects malformed dates and times", () => {
    const base = { court: "Jessup" };
    expect(() => parseScheduleInput({ ...base, date: "9/17/2026", time: "17:30" })).toThrow(ValidationError);
    expect(() => parseScheduleInput({ ...base, date: "2026-09-17", time: "5:30pm" })).toThrow(ValidationError);
    expect(() => parseScheduleInput({ ...base, date: "2026-09-17", time: "25:00" })).toThrow(ValidationError);
  });

  it("rejects a date the calendar doesn't have", () => {
    expect(() =>
      parseScheduleInput({ date: "2026-02-31", time: "17:30", court: "Jessup" })
    ).toThrow(ValidationError);
  });

  it("rejects a non-object body", () => {
    expect(() => parseScheduleInput(null)).toThrow(ValidationError);
    expect(() => parseScheduleInput("17:30")).toThrow(ValidationError);
  });
});

describe("campusWallClockToUtc", () => {
  it("reads a summer time as EDT (UTC-4)", () => {
    expect(campusWallClockToUtc("2026-07-04", "17:00").toISOString()).toBe("2026-07-04T21:00:00.000Z");
  });

  it("reads a winter time as EST (UTC-5)", () => {
    expect(campusWallClockToUtc("2026-01-15", "17:00").toISOString()).toBe("2026-01-15T22:00:00.000Z");
  });

  it("handles the instant after the spring-forward transition", () => {
    // 2026-03-08 02:00 EST -> 03:00 EDT. 03:00 local is UTC-4.
    expect(campusWallClockToUtc("2026-03-08", "03:00").toISOString()).toBe("2026-03-08T07:00:00.000Z");
  });

  it("handles midnight", () => {
    expect(campusWallClockToUtc("2026-09-17", "00:00").toISOString()).toBe("2026-09-17T04:00:00.000Z");
  });
});

describe("updateMatchSchedule", () => {
  it("sends the campus instant and the court to the RPC", async () => {
    let seen: Record<string, unknown> = {};
    const client = mockClient(async (_fn, args) => {
      seen = args as Record<string, unknown>;
      return {
        data: [{ id: "cm1", agreed_time: "2026-09-17T21:30:00Z", agreed_location: "Jessup" }],
        error: null,
      };
    });

    const result = await updateMatchSchedule(client, "cm1", "user-1", {
      date: "2026-09-17",
      time: "17:30",
      court: "Jessup",
    });

    expect(seen.p_confirmed_match_id).toBe("cm1");
    expect(seen.p_user_id).toBe("user-1");
    expect(seen.p_agreed_time).toBe("2026-09-17T21:30:00.000Z");
    expect(seen.p_agreed_location).toBe("Jessup");
    expect(result).toEqual({
      id: "cm1",
      agreedTime: "2026-09-17T21:30:00Z",
      agreedLocation: "Jessup",
    });
  });

  it("surfaces the 'not found' a non-participant gets", async () => {
    const client = mockClient(async () => ({
      data: null,
      error: { message: "confirmed match not found" },
    }));

    await expect(
      updateMatchSchedule(client, "cm1", "stranger", {
        date: "2026-09-17",
        time: "17:30",
        court: "Jessup",
      })
    ).rejects.toThrow("confirmed match not found");
  });
});
