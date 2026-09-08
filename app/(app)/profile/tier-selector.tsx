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
                "flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] text-base font-semibold",
                "transition-[transform,box-shadow,background-color,color] duration-[160ms] ease-[var(--ease-out-strong)]",
                "active:scale-[0.94]",
                "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-accent)]",
                // Saved: filled and pressed in.
                selected &&
                  confirmed &&
                  "bg-[var(--color-accent)] text-white shadow-[inset_3px_3px_7px_rgba(0,0,0,0.35),inset_-3px_-3px_7px_rgba(255,255,255,0.15)]",
                // Chosen but not yet saved: pressed in, but still bearing
                // the ground colour and a red ring, so "picked" and "saved"
                // stay tellable apart without relying on shadow alone.
                selected &&
                  !confirmed &&
                  "neu-pressed text-[var(--color-accent)] ring-2 ring-[var(--color-accent)]",
                !selected && "neu-raised-sm text-[var(--color-ink)] hover:text-[var(--color-accent)]"
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
