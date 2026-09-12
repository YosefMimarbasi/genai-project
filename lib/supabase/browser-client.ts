import { createBrowserClient } from "@supabase/ssr";

/*
 * These two reads are written out in full, as static member expressions,
 * and that is load-bearing — not a style choice.
 *
 * Next.js makes NEXT_PUBLIC_* variables available in the browser by
 * substituting them into the bundle at build time, and it can only do
 * that where it can see the name literally in the source. A dynamic
 * lookup like `process.env[name]` — which is what the shared requireEnv()
 * helper does — is invisible to that substitution. Nothing gets inlined,
 * `process.env` is an empty object in the browser, and the lookup returns
 * undefined no matter how correctly the variables are configured.
 *
 * This previously used requireEnv(), so *every* client-side Supabase call
 * threw "Missing required environment variable" on mount: sign-in,
 * sign-up, readying up, and the match chat. Deploying real credentials
 * would not have fixed it. Do not route these through a helper.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Client-component Supabase client, session persisted via cookies (so the
 * server can read it too). Safe to call repeatedly — cheap to construct.
 */
export function createSupabaseBrowserClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase browser client is not configured: NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY must be set at build time. On Vercel, set them " +
        "and redeploy — changing them without a rebuild has no effect on the browser bundle."
    );
  }

  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
