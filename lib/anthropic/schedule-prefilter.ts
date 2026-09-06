import { COURT_NAMES } from "@/lib/courts";

// Cheap keyword/regex gate so every chat message doesn't hit the model —
// only ones that plausibly propose a day, time, or court do.
const DAY_WORDS =
  /\b(mon(day)?|tue(s(day)?)?|wed(nesday)?|thu(r(s(day)?)?)?|fri(day)?|sat(urday)?|sun(day)?|today|tomorrow|tmrw|tmr)\b/i;
const TIME_WORDS = /\b(\d{1,2}(:\d{2})?\s*(am|pm)|\d{1,2}\s*o'?clock|noon|midnight)\b/i;

export function passesSchedulePrefilter(text: string): boolean {
  if (DAY_WORDS.test(text) || TIME_WORDS.test(text)) return true;
  const lower = text.toLowerCase();
  return COURT_NAMES.some((court) => lower.includes(court.toLowerCase()));
}
