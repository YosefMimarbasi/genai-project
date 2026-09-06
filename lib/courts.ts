/**
 * Valid court/facility names for the scheduling-extraction tool schema.
 *
 * PLACEHOLDER — not verified against Cornell Recreation's current facility
 * list. Confirm the real, current names before shipping; this exists so
 * the enum-constraint mechanism (see lib/anthropic/schedule-extractor.ts)
 * has something concrete to constrain against.
 */
export const COURT_NAMES = [
  "Helen Newman Courts",
  "Reis Tennis Center",
  "Grumman Squash Courts",
  "Noyes Courts",
] as const;

export type CourtName = (typeof COURT_NAMES)[number];

export function isCourtName(value: unknown): value is CourtName {
  return typeof value === "string" && (COURT_NAMES as readonly string[]).includes(value);
}
