import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { isPlaceholderValue } from "@/lib/env";

export const dynamic = "force-dynamic";

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
  "CRON_SECRET",
] as const;

/**
 * Deployment readiness, not a data endpoint. Returns booleans and names
 * that are already public in .env.example — never a value, a prefix, or a
 * length, so this stays safe to leave open.
 */
export async function GET() {
  const missing = REQUIRED.filter((name) => isPlaceholderValue(process.env[name]));

  let database: "ok" | "unreachable" | "not_configured" = "not_configured";
  let schema: "ok" | "missing_functions" | "unknown" = "unknown";

  if (!missing.includes("SUPABASE_URL") && !missing.includes("SUPABASE_SERVICE_ROLE_KEY")) {
    try {
      const client = createServiceClient();

      // head:true — asks for the count only, so no user rows are read.
      const { error } = await client
        .from("profiles")
        .select("id", { count: "exact", head: true });
      database = error ? "unreachable" : "ok";

      if (database === "ok") {
        // Migrations applied? Calling the sweep with service-role is
        // idempotent and side-effect-free when nothing is stale, and it
        // fails loudly if the matching functions were never pushed —
        // the difference between "database connected" and "app works".
        const { error: rpcError } = await client.rpc("sweep_expired_matches");
        schema = rpcError ? "missing_functions" : "ok";
      }
    } catch {
      database = "unreachable";
    }
  }

  const ok = missing.length === 0 && database === "ok" && schema === "ok";

  return NextResponse.json(
    {
      ok,
      configured: missing.length === 0,
      unsetOrPlaceholder: missing,
      database,
      schema,
    },
    { status: ok ? 200 : 503 }
  );
}
