export const SPORTS = ["Tennis", "Squash", "Pickleball", "Table Tennis", "Badminton"] as const;

export type Sport = (typeof SPORTS)[number];

export const TIERS = [1, 2, 3, 4, 5] as const;

export const TIER_LABELS: Record<(typeof TIERS)[number], string> = {
  1: "New to it",
  2: "Casual",
  3: "Solid rec player",
  4: "Competitive",
  5: "Highly competitive",
};
