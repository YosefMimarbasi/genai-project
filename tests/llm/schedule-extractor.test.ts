import { describe, expect, it } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { extractSchedule } from "@/lib/anthropic/schedule-extractor";

function mockClient(toolInput: unknown): Anthropic {
  return {
    messages: {
      create: async () => ({
        content: [{ type: "tool_use", id: "t1", name: "report_schedule_proposal", input: toolInput }],
      }),
    },
  } as unknown as Anthropic;
}

const baseInput = {
  messageText: "want to play tuesday at 6pm at reis?",
  serverNowIso: "2026-09-08T12:00:00.000Z",
  timezone: "America/New_York",
};

describe("extractSchedule", () => {
  it("returns the extracted proposal when the court is a valid enum value", async () => {
    const client = mockClient({
      has_proposal: true,
      date: "2026-09-09",
      time: "18:00",
      court: "Reis Tennis Center",
      confidence: 0.85,
    });

    const result = await extractSchedule(client, baseInput);

    expect(result).toEqual({
      hasProposal: true,
      date: "2026-09-09",
      time: "18:00",
      court: "Reis Tennis Center",
      confidence: 0.85,
    });
  });

  it("treats a court name outside the enum as no valid proposal, even though the model claimed a match (defense in depth)", async () => {
    const client = mockClient({
      has_proposal: true,
      date: "2026-09-09",
      time: "18:00",
      court: "Some Made Up Court The Model Invented",
      confidence: 0.9,
    });

    const result = await extractSchedule(client, baseInput);

    expect(result).toEqual({ hasProposal: false, date: null, time: null, court: null, confidence: 0 });
  });

  it("allows a null court alongside has_proposal: false", async () => {
    const client = mockClient({
      has_proposal: false,
      date: null,
      time: null,
      court: null,
      confidence: 0.95,
    });

    const result = await extractSchedule(client, baseInput);

    expect(result.hasProposal).toBe(false);
    expect(result.court).toBeNull();
  });
});
