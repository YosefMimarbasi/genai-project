import type { NextConfig } from "next";

/*
 * Security headers.
 *
 * Deliberately no Content-Security-Policy here. Next's App Router emits
 * inline scripts to hydrate server components, so a CSP without nonce
 * plumbing would need script-src 'unsafe-inline', which buys almost no
 * XSS protection while still being able to break the page. Doing it
 * properly means generating a nonce per request in proxy.ts and
 * threading it through, and the connect-src list has to allow Supabase
 * over both https and wss or realtime silently stops reconnecting. That
 * is a change worth making with a live project to test against, not one
 * to ship blind — so it is left out rather than added in a form that
 * only looks like protection.
 *
 * Everything below is safe to set unconditionally and is verifiable with
 * a single curl -I.
 */
const securityHeaders = [
  // Sent on HTTPS only; Vercel terminates TLS, so this is always true in
  // production and ignored on localhost.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Stops the browser second-guessing a declared Content-Type, which is
  // how a user-uploaded file gets treated as a script.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // This app has no reason to be framed, and clickjacking a "confirm
  // this match" button is exactly the kind of thing framing enables.
  { key: "X-Frame-Options", value: "DENY" },
  // Send the origin cross-site, the full path same-origin. Match ids sit
  // in the path, so leaking a full URL to a third party would leak one.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing here needs a camera, a microphone or a location.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
