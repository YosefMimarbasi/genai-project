import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { requireEnv } from "@/lib/env";

/**
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` on invocation
 * (Vercel's documented cron-auth pattern) — reject anything else so this
 * endpoint can't be hit publicly to spam the sweep.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${requireEnv("CRON_SECRET")}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const client = createServiceClient();
  const { data, error } = await client.rpc("sweep_expired_matches");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sweptCount: data ?? 0 }, { status: 200 });
}
