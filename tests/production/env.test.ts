import { afterEach, describe, expect, it } from "vitest";
import { hasRealEnv, isPlaceholderValue } from "@/lib/env";

/*
 * Regression cover for the failure that broke CI: a presence-only check
 * treated CI's deliberate placeholder values as a configured Supabase,
 * so an integration suite tried to create users against
 * https://placeholder.supabase.co.
 */
describe("isPlaceholderValue", () => {
  it("treats missing and empty as unconfigured", () => {
    expect(isPlaceholderValue(undefined)).toBe(true);
    expect(isPlaceholderValue("")).toBe(true);
  });

  it("recognises the stand-ins CI and .env.example use", () => {
    expect(isPlaceholderValue("https://placeholder.supabase.co")).toBe(true);
    expect(isPlaceholderValue("placeholder-anon-key")).toBe(true);
    expect(isPlaceholderValue("your-key-here")).toBe(true);
    expect(isPlaceholderValue("admin@example.com")).toBe(true);
    expect(isPlaceholderValue("<paste-me>")).toBe(true);
    expect(isPlaceholderValue("CHANGEME")).toBe(true);
  });

  it("accepts values that look real", () => {
    expect(isPlaceholderValue("https://abcdefghijklm.supabase.co")).toBe(false);
    expect(isPlaceholderValue("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc")).toBe(false);
    // A local Supabase is a legitimate target for the integration suite.
    expect(isPlaceholderValue("http://127.0.0.1:54321")).toBe(false);
  });
});

describe("hasRealEnv", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it("is false when a variable holds a placeholder", () => {
    process.env.TEST_A = "https://placeholder.supabase.co";
    process.env.TEST_B = "eyJhbGciOiJIUzI1NiJ9.real";
    expect(hasRealEnv("TEST_A", "TEST_B")).toBe(false);
  });

  it("is false when a variable is absent", () => {
    process.env.TEST_A = "eyJhbGciOiJIUzI1NiJ9.real";
    delete process.env.TEST_B;
    expect(hasRealEnv("TEST_A", "TEST_B")).toBe(false);
  });

  it("is true only when every variable looks real", () => {
    process.env.TEST_A = "http://127.0.0.1:54321";
    process.env.TEST_B = "eyJhbGciOiJIUzI1NiJ9.real";
    expect(hasRealEnv("TEST_A", "TEST_B")).toBe(true);
  });
});
