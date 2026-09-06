import { describe, expect, it } from "vitest";
import { passesSchedulePrefilter } from "@/lib/anthropic/schedule-prefilter";

describe("passesSchedulePrefilter", () => {
  it.each([
    "want to play tuesday?",
    "how about tmrw at 6pm",
    "let's do 4:30pm",
    "meet at Reis Tennis Center",
    "noon works for me",
  ])("passes on %s", (text) => {
    expect(passesSchedulePrefilter(text)).toBe(true);
  });

  it.each(["sounds fun!", "haha nice", "good game", "see you around"])(
    "rejects %s (no day/time/court signal)",
    (text) => {
      expect(passesSchedulePrefilter(text)).toBe(false);
    }
  );
});
