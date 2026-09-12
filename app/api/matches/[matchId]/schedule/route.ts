import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/supabase/verify-user";
import { createServiceClient } from "@/lib/supabase/service-client";
import { parseScheduleInput, updateMatchSchedule } from "@/lib/matching/schedule";
import { ValidationError } from "@/lib/http-errors";

/**
 * Confirms a time and place into an existing match.
 *
 * The scheduling extractor can read a proposal out of a chat message, but
 * it never writes: a suggestion only becomes the plan when a human taps
 * confirm, which is this route. The caller's identity comes from their
 * access token, never from the body, and participation is checked inside
 * the database function.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;

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
    input = parseScheduleInput(body);
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  try {
    const result = await updateMatchSchedule(createServiceClient(), matchId, user.id, input);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to update schedule";
    // "not found" is what the function raises for a non-participant too —
    // deliberately indistinguishable.
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
