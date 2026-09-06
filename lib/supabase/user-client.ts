import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

/**
 * A Supabase client scoped to one user's access token, so PostgREST
 * requests carry their JWT and RLS applies as that user (auth.uid()
 * resolves correctly). Prefer this over the service-role client whenever
 * an operation is something the user is already allowed to do under RLS
 * (e.g. updating their own profile, sending a message in their own
 * confirmed_match) — least privilege, and one less place that needs to
 * re-implement an authorization check RLS already enforces.
 */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false },
    }
  );
}
