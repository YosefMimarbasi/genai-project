import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

export interface VerifiedUser {
  id: string;
  email: string | undefined;
  accessToken: string;
}

/**
 * Verifies the caller's Supabase access token (sent as
 * `Authorization: Bearer <token>`) and returns their user id. Route
 * handlers use this to get a trustworthy user id for privileged
 * operations, rather than trusting a user_id supplied in the request body.
 * Also returns the token itself so callers can build an RLS-respecting
 * per-user client (see lib/supabase/user-client.ts) without re-parsing
 * the header.
 */
export async function verifyUser(request: Request): Promise<VerifiedUser | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const accessToken = authHeader.slice("Bearer ".length).trim();
  if (!accessToken) return null;

  const client = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );

  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) return null;

  return { id: data.user.id, email: data.user.email, accessToken };
}
