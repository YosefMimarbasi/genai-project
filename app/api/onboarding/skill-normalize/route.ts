import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/supabase/verify-user";
import { createUserClient } from "@/lib/supabase/user-client";
import { createAnthropicClient } from "@/lib/anthropic/client";
import { normalizeSkillTier } from "@/lib/anthropic/skill-normalizer";
import { ValidationError } from "@/lib/http-errors";

const CONFIDENCE_THRESHOLD = 0.6;

function parseInput(body: unknown): { sport: string; experienceDescription: string } {
  if (typeof body !== "object" || body === null) {
    throw new ValidationError("request body must be a JSON object");
  }
  const b = body as Record<string, unknown>;
  if (typeof b.sport !== "string" || b.sport.trim() === "") {
    throw new ValidationError("sport is required");
  }
  if (typeof b.experienceDescription !== "string" || b.experienceDescription.trim() === "") {
    throw new ValidationError("experienceDescription is required");
  }
  return { sport: b.sport, experienceDescription: b.experienceDescription };
}

export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  let input;
  try {
    input = parseInput(body);
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const result = await normalizeSkillTier(createAnthropicClient(), input);

  if (result.confidence < CONFIDENCE_THRESHOLD) {
    // Below threshold: don't save anything. The client should surface a
    // manual tier picker instead of trusting this suggestion.
    return NextResponse.json(
      { saved: false, requiresManualTier: true, suggestion: result },
      { status: 200 }
    );
  }

  // Own-row update — use the user-scoped client so RLS (profiles_update_own)
  // enforces this rather than a service-role bypass.
  const supabase = createUserClient(user.accessToken);

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("default_skill_tier")
    .eq("id", user.id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const existingTiers = (profile?.default_skill_tier as Record<string, number> | null) ?? {};
  const updatedTiers = { ...existingTiers, [input.sport]: result.tier };

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ default_skill_tier: updatedTiers })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(
    { saved: true, requiresManualTier: false, suggestion: result },
    { status: 200 }
  );
}
