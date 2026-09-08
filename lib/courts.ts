import type { Sport } from "@/lib/sports";

/**
 * Cornell venues, per sport, with how you get in and when you can play.
 *
 * Verified against Cornell Recreational Services (Sept 2026):
 *  - Outdoor tennis / pickleball courts are open rec, first-come
 *    first-served. PE and IM programming takes priority during the
 *    academic year, so a court can be taken without notice.
 *    https://scl.cornell.edu/recreation/recreation-locations/outdoor-locations
 *  - Helen Newman court 2 runs badminton/volleyball priority, and Rec
 *    Services does NOT take reservations for it. Badminton gets Tue, Thu
 *    and Sat, plus Fridays on odd calendar days (volleyball on even).
 *    Courts stay open until 30 minutes before the building closes and can
 *    close without notice for PE classes.
 *    https://scl.cornell.edu/recreation/facility/helen-newman-hall
 *  - Noyes runs badminton priority on Saturdays 10am-2pm only; the lower
 *    lounge game room (table tennis) has no separate hours, so it follows
 *    building hours. The service desk is unstaffed Mon-Fri 7am-3pm, and
 *    the court plus equipment checkout are unavailable then.
 *    https://scl.cornell.edu/recreation/facility/noyes-recreation-center
 *  - Reis takes court reservations by phone or online.
 *    https://cornellbigred.com/facilities/reis-tennis-center/15
 *
 * Anything not confirmed against a source stays out of this file rather
 * than being guessed at. Hours change by semester — re-check the links
 * above before each term.
 */

export type VenueAccess =
  /** Show up and play. */
  | "open"
  /** You need to live in the building, or be let in by someone who does. */
  | "residents"
  /** Needs a booking this app doesn't handle yet. */
  | "reservation";

export interface Venue {
  name: string;
  access: VenueAccess;
  /** When the sport is actually playable there. Omitted when unverified. */
  hours?: string;
  /** Why access is limited — shown next to restricted venues. */
  note?: string;
}

/** Cornell facility codes: McClintock = MCLX Court, Risley = RST. */
export const VENUES: Record<Sport, readonly Venue[]> = {
  Tennis: [
    { name: "McClintock", access: "open" },
    { name: "Jessup", access: "open" },
    { name: "Risley", access: "open" },
    {
      name: "Reis Tennis Center",
      access: "reservation",
      note: "Needs a court reservation",
    },
  ],
  Pickleball: [
    { name: "Jessup", access: "open" },
    { name: "Risley", access: "open" },
  ],
  "Table Tennis": [
    { name: "Noyes", access: "open", hours: "Mon–Fri 7am–1am · Sat–Sun 10am–1am" },
    { name: "Bethe", access: "residents", note: "Residents only, or get let in" },
    { name: "Becker", access: "residents", note: "Residents only, or get let in" },
    { name: "Mews", access: "residents", note: "Residents only, or get let in" },
    { name: "Hu Shih", access: "residents", note: "Residents only, or get let in" },
  ],
  Badminton: [
    {
      name: "Helen Newman",
      access: "open",
      hours: "Tue · Thu · Sat, and Fri on odd-numbered dates",
    },
    { name: "Noyes", access: "open", hours: "Sat 10am–2pm" },
  ],
};

/** Venues you can actually queue for — you can get in without a booking. */
export function queueableVenues(sport: Sport): readonly Venue[] {
  return VENUES[sport].filter((v) => v.access !== "reservation");
}

/** Real venues that need a booking — surfaced as "coming soon". */
export function reservationVenues(sport: Sport): readonly Venue[] {
  return VENUES[sport].filter((v) => v.access === "reservation");
}

/**
 * Every venue name the scheduling extractor may return, as a flat enum.
 * Reservation-only venues are included: a student can still name one in
 * chat, and recognising it beats forcing the model to answer null.
 */
export const COURT_NAMES = [
  ...new Set(
    Object.values(VENUES)
      .flat()
      .map((v) => v.name)
  ),
] as const;

export type CourtName = (typeof COURT_NAMES)[number];

export function isCourtName(value: unknown): value is CourtName {
  return typeof value === "string" && (COURT_NAMES as readonly string[]).includes(value);
}
