import { describe, expect, it } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { normalizeSkillTier } from "@/lib/anthropic/skill-normalizer";

function mockClient(toolInput: unknown): Anthropic {
  return {
    messages: {
      create: async () => ({
        content: [{ type: "tool_use", id: "t1", name: "report_skill_tier", input: toolInput }],
      }),
    },
  } as unknown as Anthropic;
}

describe("normalizeSkillTier", () => {
  it("returns the tool_use block's structured input", async () => {
    const client = mockClient({ tier: 4, confidence: 0.9, rationale: "plays varsity" });

    const result = await normalizeSkillTier(client, {
      sport: "tennis",
      experienceDescription: "I played varsity in high school",
    });

    expect(result).toEqual({ tier: 4, confidence: 0.9, rationale: "plays varsity" });
  });

  it("throws if the response has no tool_use block (forced tool-use should prevent this)", async () => {
    const client = {
      messages: { create: async () => ({ content: [{ type: "text", text: "sorry, I can't" }] }) },
    } as unknown as Anthropic;

    await expect(
      normalizeSkillTier(client, { sport: "tennis", experienceDescription: "..." })
    ).rejects.toThrow(/tool_use/);
  });
});
