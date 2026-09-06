import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/verify-user", () => ({ verifyUser: vi.fn() }));
vi.mock("@/lib/supabase/user-client", () => ({ createUserClient: vi.fn() }));
vi.mock("@/lib/anthropic/client", () => ({ createAnthropicClient: vi.fn(() => ({})) }));
vi.mock("@/lib/anthropic/schedule-extractor", () => ({ extractSchedule: vi.fn() }));

import { verifyUser } from "@/lib/supabase/verify-user";
import { createUserClient } from "@/lib/supabase/user-client";
import { extractSchedule, type ScheduleExtractionResult } from "@/lib/anthropic/schedule-extractor";
import { POST } from "@/app/api/matches/[matchId]/messages/route";

function makeRequest(content: string) {
  return new Request("http://localhost/api/matches/match-1/messages", {
    method: "POST",
    headers: { authorization: "Bearer test-token", "content-type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

function mockUserClientWithInsertedMessage(row: unknown) {
  const single = vi.fn().mockResolvedValue({ data: row, error: null });
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ insert });
  vi.mocked(createUserClient).mockReturnValue({ from } as never);
}

describe("POST /api/matches/[matchId]/messages", () => {
  beforeEach(() => {
    vi.mocked(verifyUser).mockResolvedValue({
      id: "user-1",
      email: "a@cornell.edu",
      accessToken: "test-token",
    });
  });

  it("never calls the model when the message fails the cheap pre-filter", async () => {
    mockUserClientWithInsertedMessage({ id: "m1", content: "sounds fun!" });

    const response = await POST(makeRequest("sounds fun!"), {
      params: Promise.resolve({ matchId: "match-1" }),
    });
    const json = await response.json();

    expect(extractSchedule).not.toHaveBeenCalled();
    expect(json.scheduleSuggestion).toBeNull();
  });

  it("does not surface a confirm chip when the model's confidence is below threshold", async () => {
    mockUserClientWithInsertedMessage({ id: "m2", content: "maybe tuesday?" });
    vi.mocked(extractSchedule).mockResolvedValue({
      hasProposal: true,
      date: "2026-09-15",
      time: "18:00",
      court: "Reis Tennis Center",
      confidence: 0.3,
    });

    const response = await POST(makeRequest("maybe tuesday?"), {
      params: Promise.resolve({ matchId: "match-1" }),
    });
    const json = await response.json();

    expect(extractSchedule).toHaveBeenCalled();
    expect(json.scheduleSuggestion).toBeNull();
  });

  it("still returns the sent message (200, not 500) if the extraction call itself throws", async () => {
    mockUserClientWithInsertedMessage({ id: "m4", content: "tuesday 6pm?" });
    vi.mocked(extractSchedule).mockRejectedValue(new Error("anthropic API timeout"));

    const response = await POST(makeRequest("tuesday 6pm?"), {
      params: Promise.resolve({ matchId: "match-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toEqual({ id: "m4", content: "tuesday 6pm?" });
    expect(json.scheduleSuggestion).toBeNull();
  });

  it("surfaces a confirm chip once the message passes the pre-filter and clears the confidence threshold", async () => {
    mockUserClientWithInsertedMessage({ id: "m3", content: "tuesday 6pm at reis?" });
    const suggestion: ScheduleExtractionResult = {
      hasProposal: true,
      date: "2026-09-15",
      time: "18:00",
      court: "Reis Tennis Center",
      confidence: 0.85,
    };
    vi.mocked(extractSchedule).mockResolvedValue(suggestion);

    const response = await POST(makeRequest("tuesday 6pm at reis?"), {
      params: Promise.resolve({ matchId: "match-1" }),
    });
    const json = await response.json();

    expect(json.scheduleSuggestion).toEqual(suggestion);
  });

  it("returns 401 when the caller isn't authenticated", async () => {
    vi.mocked(verifyUser).mockResolvedValue(null);

    const response = await POST(makeRequest("tuesday 6pm?"), {
      params: Promise.resolve({ matchId: "match-1" }),
    });

    expect(response.status).toBe(401);
  });
});
