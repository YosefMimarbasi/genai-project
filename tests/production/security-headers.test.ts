import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";

/*
 * superpowers/test-driven-development — these were written against the
 * requirement (what a production deployment must send), not against the
 * implementation, so they fail loudly if someone later trims the header
 * list to "clean up the config".
 */
async function headerMap(path: string): Promise<Map<string, string>> {
  const groups = (await nextConfig.headers?.()) ?? [];
  const map = new Map<string, string>();
  for (const group of groups) {
    // Only the catch-all matters here; a narrower source would mean these
    // headers silently stop covering most of the site.
    if (group.source === "/:path*" || group.source === path) {
      for (const h of group.headers) map.set(h.key, h.value);
    }
  }
  return map;
}

describe("security headers", () => {
  it("sends HSTS with a long max-age and subdomains", async () => {
    const value = (await headerMap("/")).get("Strict-Transport-Security");
    expect(value).toBeDefined();
    const maxAge = Number(/max-age=(\d+)/.exec(value!)?.[1] ?? 0);
    expect(maxAge).toBeGreaterThanOrEqual(31536000); // >= 1 year
    expect(value).toContain("includeSubDomains");
  });

  it("refuses MIME sniffing", async () => {
    expect((await headerMap("/")).get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("refuses to be framed", async () => {
    // Clickjacking a "confirm this match" button is the concrete risk.
    expect((await headerMap("/")).get("X-Frame-Options")).toBe("DENY");
  });

  it("does not leak full URLs cross-site", async () => {
    // Match ids live in the path; a full-URL referer would leak one.
    const value = (await headerMap("/")).get("Referrer-Policy");
    expect(["strict-origin-when-cross-origin", "no-referrer", "same-origin"]).toContain(value);
  });

  it("denies camera, microphone and geolocation", async () => {
    const value = (await headerMap("/")).get("Permissions-Policy") ?? "";
    expect(value).toContain("camera=()");
    expect(value).toContain("microphone=()");
    expect(value).toContain("geolocation=()");
  });

  it("does not advertise the framework", async () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});
