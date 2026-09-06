import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/lib/http-errors";

export interface ReadyUpInput {
  sport: string;
  skillTier: number;
  timeWindowStart: string;
  timeWindowEnd: string;
  locations: string[];
  intensity: "casual" | "competitive";
}

export interface ReadyUpResult {
  queueEntryId: string;
  status: "waiting" | "matched";
  proposedMatchId: string | null;
}

export function parseReadyUpInput(body: unknown): ReadyUpInput {
  if (typeof body !== "object" || body === null) {
    throw new ValidationError("request body must be a JSON object");
  }
  const b = body as Record<string, unknown>;

  if (typeof b.sport !== "string" || b.sport.trim() === "") {
    throw new ValidationError("sport is required");
  }
  if (
    typeof b.skillTier !== "number" ||
    !Number.isInteger(b.skillTier) ||
    b.skillTier < 1 ||
    b.skillTier > 5
  ) {
    throw new ValidationError("skillTier must be an integer between 1 and 5");
  }
  if (typeof b.timeWindowStart !== "string" || Number.isNaN(Date.parse(b.timeWindowStart))) {
    throw new ValidationError("timeWindowStart must be an ISO 8601 timestamp");
  }
  if (typeof b.timeWindowEnd !== "string" || Number.isNaN(Date.parse(b.timeWindowEnd))) {
    throw new ValidationError("timeWindowEnd must be an ISO 8601 timestamp");
  }
  if (new Date(b.timeWindowEnd) <= new Date(b.timeWindowStart)) {
    throw new ValidationError("timeWindowEnd must be after timeWindowStart");
  }
  if (
    !Array.isArray(b.locations) ||
    b.locations.length === 0 ||
    !b.locations.every((l) => typeof l === "string" && l.trim() !== "")
  ) {
    throw new ValidationError("locations must be a non-empty array of strings");
  }
  if (b.intensity !== "casual" && b.intensity !== "competitive") {
    throw new ValidationError("intensity must be 'casual' or 'competitive'");
  }

  return {
    sport: b.sport,
    skillTier: b.skillTier,
    timeWindowStart: b.timeWindowStart,
    timeWindowEnd: b.timeWindowEnd,
    locations: b.locations as string[],
    intensity: b.intensity,
  };
}

/**
 * Calls the ready_up() Postgres function, which does the insert, the
 * candidate search, the atomic claim of both rows, and the
 * proposed_matches insert inside a single transaction. See
 * supabase/migrations/20260906223000_matching_functions.sql for why this
 * lives in the database rather than as separate round trips here.
 */
export async function readyUp(
  client: SupabaseClient,
  userId: string,
  input: ReadyUpInput
): Promise<ReadyUpResult> {
  const { data, error } = await client.rpc("ready_up", {
    p_user_id: userId,
    p_sport: input.sport,
    p_skill_tier: input.skillTier,
    p_time_window_start: input.timeWindowStart,
    p_time_window_end: input.timeWindowEnd,
    p_locations: input.locations,
    p_intensity: input.intensity,
  });

  if (error) {
    throw new Error(`ready_up RPC failed: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("ready_up RPC returned no rows");
  }

  return {
    queueEntryId: row.queue_entry_id,
    status: row.proposed_match_id ? "matched" : "waiting",
    proposedMatchId: row.proposed_match_id ?? null,
  };
}
