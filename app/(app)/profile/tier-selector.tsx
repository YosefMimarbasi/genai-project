"use client";

import { cn } from "@/lib/cn";
import { TIERS, TIER_LABELS } from "@/lib/sports";

interface TierSelectorProps {
  value: number | null;
  onChange: (tier: number) => void;
  /** Suggested-but-unconfirmed values render as an outline, not a fill —
   * the visual difference between "the model's guess" and "what's actually
   * saved" matters here (state indication is a valid reason to
   * differentiate; decoration is not). */
  confirmed: boolean;
}

export function TierSelector({ value, onChange, confirmed }: TierSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {TIERS.map((tier) => {
          const selected = value === tier;
          return (
            <button
              key={tier}
              type="button"
              onClick={() => onChange(tier)}
              aria-pressed={selected}
              className={cn(
                "flex h-12 w-12 items-center justify-center text-base font-bold",
                "transition-[transform,background-color,border-color,color] duration-[160ms] ease-[var(--ease-out-strong)]",
                "active:scale-[0.94]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
                selected &&
                  confirmed &&
                  "border border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-ground)]",
                selected &&
                  !confirmed &&
                  "border-2 border-[var(--color-accent)] text-[var(--color-accent)]",
                !selected &&
                  "border border-[color-mix(in_oklab,var(--color-rule)_25%,transparent)] text-[var(--color-ink)] hover:border-[var(--color-ink)]"
              )}
            >
              {tier}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-[var(--color-gray)]" aria-live="polite">
        {value ? TIER_LABELS[value as keyof typeof TIER_LABELS] : "Pick the tier that fits"}
      </p>
    </div>
  );
}
