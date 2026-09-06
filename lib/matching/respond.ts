import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/lib/http-errors";

export type MatchResponse = "accepted" | "declined";

export interface RespondResult {
  status: "pending" | "accepted_both" | "declined" | "expired";
  confirmedMatchId: string | null;
}

export function parseRespondInput(body: unknown): MatchResponse {
  if (typeof body !== "object" || body === null) {
    throw new ValidationError("request body must be a JSON object");
  }
  const response = (body as Record<string, unknown>).response;
  if (response !== "accepted" && response !== "declined") {
    throw new ValidationError("response must be 'accepted' or 'declined'");
  }
  return response;
}

/**
 * Calls the respond_to_match() Postgres function. Raises (as a thrown
 * error) if the proposed match doesn't exist or the caller isn't a
 * participant — the route handler maps that to a 403/404, not a 500.
 */
export async function respondToMatch(
  client: SupabaseClient,
  proposedMatchId: string,
  userId: string,
  response: MatchResponse
): Promise<RespondResult> {
  const { data, error } = await client.rpc("respond_to_match", {
    p_proposed_match_id: proposedMatchId,
    p_user_id: userId,
    p_response: response,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("respond_to_match RPC returned no rows");
  }

  return {
    status: row.status,
    confirmedMatchId: row.confirmed_match_id ?? null,
  };
}
