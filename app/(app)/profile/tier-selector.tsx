"use client";

import { cn } from "@/lib/cn";
import { TIERS, TIER_LABELS } from "@/lib/sports";

interface TierSelectorProps {
  value: number | null;
  onChange: (tier: number) => void;
  /** Suggested-but-unconfirmed values render as an outline, not a fill —
   * the visual difference between "the model's guess" and "what's actually
   * saved" matters here (see emil-design-eng: state indication is a valid
   * reason to animate/differentiate, not decoration). */
  confirmed: boolean;
}

export function TierSelector({ value, onChange, confirmed }: TierSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        {TIERS.map((tier) => {
          const selected = value === tier;
          return (
            <button
              key={tier}
              type="button"
              onClick={() => onChange(tier)}
              aria-pressed={selected}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] text-sm font-medium",
                "transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-out-strong)]",
                "active:scale-[0.94]",
                selected && confirmed && "bg-[var(--color-accent)] text-white",
                selected &&
                  !confirmed &&
                  "border-2 border-[var(--color-accent)] text-[var(--color-accent)]",
                !selected &&
                  "border border-[var(--color-border)] text-[var(--color-foreground)] hover:border-[var(--color-foreground)]/30"
              )}
            >
              {tier}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-[var(--color-muted)]" aria-live="polite">
        {value ? TIER_LABELS[value as keyof typeof TIER_LABELS] : "Pick the tier that fits"}
      </p>
    </div>
  );
}
