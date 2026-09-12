import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/lib/http-errors";
import { isCourtName, type CourtName } from "@/lib/courts";

/** Single-campus app — Cornell is in Ithaca, NY. */
export const APP_TIMEZONE = "America/New_York";

export interface ScheduleInput {
  date: string;
  time: string;
  court: CourtName;
}

export interface ScheduleResult {
  id: string;
  agreedTime: string;
  agreedLocation: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseScheduleInput(body: unknown): ScheduleInput {
  if (typeof body !== "object" || body === null) {
    throw new ValidationError("request body must be a JSON object");
  }
  const { date, time, court } = body as Record<string, unknown>;

  if (typeof date !== "string" || !DATE_RE.test(date)) {
    throw new ValidationError("date must be an ISO date (YYYY-MM-DD)");
  }
  if (typeof time !== "string" || !TIME_RE.test(time)) {
    throw new ValidationError("time must be a 24-hour time (HH:MM)");
  }
  // The court is re-validated here even though the extractor already
  // constrained it at the JSON-schema level. This request arrives from a
  // browser and carries whatever the client chose to send, so the model's
  // earlier constraint proves nothing about *this* payload — a confirmed
  // match must never come to rest at a location that isn't a real court.
  if (typeof court !== "string" || !isCourtName(court)) {
    throw new ValidationError("court must be one of the known Cornell courts");
  }

  // Reject a date the calendar doesn't have (2026-02-31 passes the regex
  // but rolls over silently once parsed).
  const [y, m, d] = date.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) {
    throw new ValidationError("date is not a real calendar date");
  }

  return { date, time, court };
}

/**
 * How far the named zone sits from UTC at a given instant, in ms.
 * Derived from Intl rather than hardcoded, so DST is handled by the
 * platform's tz database instead of by an offset constant that goes
 * wrong twice a year.
 */
function zoneOffsetMs(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  const hour = get("hour") % 24; // some ICU versions render midnight as "24"

  const asIfUtc = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
  return asIfUtc - at.getTime();
}

/**
 * Turns a wall-clock date/time ("Thursday the 14th at 5pm") into the exact
 * instant it refers to on campus. Two passes: the first offset is measured
 * at the wrong instant by definition, so re-measuring at the corrected
 * instant settles DST-boundary cases.
 */
export function campusWallClockToUtc(
  date: string,
  time: string,
  timeZone: string = APP_TIMEZONE
): Date {
  const naive = new Date(`${date}T${time}:00Z`);
  const firstPass = new Date(naive.getTime() - zoneOffsetMs(naive, timeZone));
  const settled = zoneOffsetMs(firstPass, timeZone);
  return new Date(naive.getTime() - settled);
}

/**
 * Calls update_match_schedule(). That function verifies participation
 * itself and answers "not found" for a non-participant, so a caller who
 * isn't in the match learns nothing about whether it exists.
 */
export async function updateMatchSchedule(
  client: SupabaseClient,
  confirmedMatchId: string,
  userId: string,
  input: ScheduleInput
): Promise<ScheduleResult> {
  const agreedTime = campusWallClockToUtc(input.date, input.time);

  const { data, error } = await client.rpc("update_match_schedule", {
    p_confirmed_match_id: confirmedMatchId,
    p_user_id: userId,
    p_agreed_time: agreedTime.toISOString(),
    p_agreed_location: input.court,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("update_match_schedule RPC returned no rows");
  }

  return {
    id: row.id,
    agreedTime: row.agreed_time,
    agreedLocation: row.agreed_location,
  };
}
