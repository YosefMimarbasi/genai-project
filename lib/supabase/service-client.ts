import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

/**
 * Server-only Supabase client using the service-role key, which bypasses
 * RLS. Required for route handlers that write across two different users'
 * rows (the atomic queue claim, accept/decline transitions, the expiry
 * sweep) — see supabase/README.md for why RLS intentionally does not grant
 * those writes to authenticated users directly.
 *
 * Never import this from client-side code or expose the service-role key
 * to the browser.
 */
export function createServiceClient(): SupabaseClient {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );
}
