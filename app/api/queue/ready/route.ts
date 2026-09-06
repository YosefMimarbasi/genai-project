import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/supabase/verify-user";
import { createServiceClient } from "@/lib/supabase/service-client";
import { parseReadyUpInput, readyUp } from "@/lib/matching/ready-up";
import { ValidationError } from "@/lib/http-errors";

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
    input = parseReadyUpInput(body);
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const client = createServiceClient();
  const result = await readyUp(client, user.id, input);

  return NextResponse.json(result, { status: 200 });
}
