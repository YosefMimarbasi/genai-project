import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/verify-user", () => ({ verifyUser: vi.fn() }));
vi.mock("@/lib/supabase/user-client", () => ({ createUserClient: vi.fn() }));
vi.mock("@/lib/anthropic/client", () => ({ createAnthropicClient: vi.fn(() => ({})) }));
vi.mock("@/lib/anthropic/skill-normalizer", () => ({ normalizeSkillTier: vi.fn() }));

import { verifyUser } from "@/lib/supabase/verify-user";
import { createUserClient } from "@/lib/supabase/user-client";
import { normalizeSkillTier } from "@/lib/anthropic/skill-normalizer";
import { POST } from "@/app/api/onboarding/skill-normalize/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/onboarding/skill-normalize", {
    method: "POST",
    headers: { authorization: "Bearer test-token", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/onboarding/skill-normalize", () => {
  beforeEach(() => {
    vi.mocked(verifyUser).mockResolvedValue({
      id: "user-1",
      email: "a@cornell.edu",
      accessToken: "test-token",
    });
  });

  it("does not save and flags a manual tier when confidence is below the threshold", async () => {
    vi.mocked(normalizeSkillTier).mockResolvedValue({
      tier: 3,
      confidence: 0.4,
      rationale: "description was vague",
    });
    const from = vi.fn();
    vi.mocked(createUserClient).mockReturnValue({ from } as never);

    const response = await POST(
      makeRequest({ sport: "tennis", experienceDescription: "I've played a bit" })
    );
    const json = await response.json();

    expect(json).toEqual({
      saved: false,
      requiresManualTier: true,
      suggestion: { tier: 3, confidence: 0.4, rationale: "description was vague" },
    });
    // Below-threshold results must never touch the database.
    expect(from).not.toHaveBeenCalled();
  });

  it("saves the suggested tier when confidence meets the threshold", async () => {
    vi.mocked(normalizeSkillTier).mockResolvedValue({
      tier: 4,
      confidence: 0.9,
      rationale: "clearly advanced",
    });

    const single = vi.fn().mockResolvedValue({ data: { default_skill_tier: {} }, error: null });
    const eqSelect = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq: eqSelect });
    const eqUpdate = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: eqUpdate });
    const from = vi.fn().mockReturnValue({ select, update });
    vi.mocked(createUserClient).mockReturnValue({ from } as never);

    const response = await POST(
      makeRequest({ sport: "tennis", experienceDescription: "varsity player" })
    );
    const json = await response.json();

    expect(json.saved).toBe(true);
    expect(json.requiresManualTier).toBe(false);
    expect(update).toHaveBeenCalledWith({ default_skill_tier: { tennis: 4 } });
  });

  it("preserves other sports already in default_skill_tier when saving a new one", async () => {
    vi.mocked(normalizeSkillTier).mockResolvedValue({ tier: 2, confidence: 0.8, rationale: "beginner" });

    const single = vi
      .fn()
      .mockResolvedValue({ data: { default_skill_tier: { squash: 5 } }, error: null });
    const eqSelect = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq: eqSelect });
    const eqUpdate = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: eqUpdate });
    const from = vi.fn().mockReturnValue({ select, update });
    vi.mocked(createUserClient).mockReturnValue({ from } as never);

    await POST(makeRequest({ sport: "tennis", experienceDescription: "just starting out" }));

    expect(update).toHaveBeenCalledWith({ default_skill_tier: { squash: 5, tennis: 2 } });
  });

  it("returns 401 when the caller isn't authenticated", async () => {
    vi.mocked(verifyUser).mockResolvedValue(null);

    const response = await POST(makeRequest({ sport: "tennis", experienceDescription: "x" }));

    expect(response.status).toBe(401);
    expect(normalizeSkillTier).not.toHaveBeenCalled();
  });

  it("returns 400 for a missing experienceDescription", async () => {
    const response = await POST(makeRequest({ sport: "tennis" }));
    expect(response.status).toBe(400);
  });
});
