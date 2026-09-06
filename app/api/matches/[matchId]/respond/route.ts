import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/supabase/verify-user";
import { createServiceClient } from "@/lib/supabase/service-client";
import { parseRespondInput, respondToMatch } from "@/lib/matching/respond";
import { ValidationError } from "@/lib/http-errors";

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

  let response;
  try {
    response = parseRespondInput(body);
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const client = createServiceClient();

  try {
    const result = await respondToMatch(client, matchId, user.id, response);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed to respond to match" },
      { status: 403 }
    );
  }
}
