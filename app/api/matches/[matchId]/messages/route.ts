import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/supabase/verify-user";
import { createUserClient } from "@/lib/supabase/user-client";
import { createAnthropicClient } from "@/lib/anthropic/client";
import { passesSchedulePrefilter } from "@/lib/anthropic/schedule-prefilter";
import { extractSchedule } from "@/lib/anthropic/schedule-extractor";
import { ValidationError } from "@/lib/http-errors";

const SCHEDULE_CONFIDENCE_THRESHOLD = 0.6;

// Single-campus app — Cornell is in Ithaca, NY.
const APP_TIMEZONE = "America/New_York";

function parseInput(body: unknown): { content: string } {
  if (typeof body !== "object" || body === null) {
    throw new ValidationError("request body must be a JSON object");
  }
  const content = (body as Record<string, unknown>).content;
  if (typeof content !== "string" || content.trim() === "") {
    throw new ValidationError("content is required");
  }
  return { content };
}

export async function POST(
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
    input = parseInput(body);
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  // User-scoped client: messages_insert_participant RLS already enforces
  // that the caller is a participant in this confirmed_match and is
  // inserting as themselves — no separate authorization check needed here.
  const supabase = createUserClient(user.accessToken);

  const { data: inserted, error: insertError } = await supabase
    .from("messages")
    .insert({ confirmed_match_id: matchId, sender_id: user.id, content: input.content })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 403 });
  }

  let scheduleSuggestion = null;
  if (passesSchedulePrefilter(input.content)) {
    // The message is already sent at this point — a scheduling-extraction
    // failure (model API error, timeout) is a lost enhancement, not a
    // failed send, so it must not turn this response into a 500 and make
    // the client think the message itself failed to go through.
    try {
      const result = await extractSchedule(createAnthropicClient(), {
        messageText: input.content,
        serverNowIso: new Date().toISOString(),
        timezone: APP_TIMEZONE,
      });

      // Only surface a suggestion above threshold. This never writes to
      // confirmed_matches directly — a human tap on the resulting chip is
      // what calls POST /api/matches/[matchId]/respond.
      if (result.hasProposal && result.confidence >= SCHEDULE_CONFIDENCE_THRESHOLD) {
        scheduleSuggestion = result;
      }
    } catch {
      scheduleSuggestion = null;
    }
  }

  return NextResponse.json({ message: inserted, scheduleSuggestion }, { status: 200 });
}
