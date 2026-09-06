import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireEnv } from "@/lib/env";

/**
 * Server Component / Server Action Supabase client, reading the session
 * from the request's cookies. Create a fresh one per render — never share
 * across requests.
 *
 * `setAll` can fail when called from a Server Component (Next.js only
 * allows setting cookies from a Route Handler or Server Action) — that's
 * fine as long as `middleware.ts` is refreshing the session on every
 * request, which it is.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render — no-op, see above.
          }
        },
      },
    }
  );
}
