"use client";

import { cn } from "@/lib/cn";
import { TIERS, TIER_LABELS } from "@/lib/sports";

interface TierSelectorProps {
  value: number | null;
  onChange: (tier: number) => void;
  /**
   * Suggested-but-unsaved renders differently from saved. The distinction
   * matters: one is the model's guess, the other is what's actually on your
   * profile, and confusing them would let someone believe a tier was stored
   * when it wasn't.
   */
  confirmed: boolean;
}

export function TierSelector({ value, onChange, confirmed }: TierSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Skill tier" className="flex flex-wrap gap-2">
        {TIERS.map((tier) => {
          const selected = value === tier;
          return (
            <button
              key={tier}
              type="button"
              onClick={() => onChange(tier)}
              aria-pressed={selected}
              className={cn(
                "ui-text flex h-12 w-12 cursor-pointer items-center justify-center",
                "rounded-[var(--radius-md)] border-2 text-base font-bold",
                "transition-[transform,background-color,border-color,color,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out)]",
                "active:scale-[0.95]",
                "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-ring)]",
                // Saved: filled and pushed in — the tier is settled.
                selected && confirmed &&
                  "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[inset_3px_3px_7px_var(--neu-dark),inset_-3px_-3px_7px_var(--neu-light)]",
                // Picked but unsaved: outlined, not filled. §1 color-not-only
                // is satisfied by the fill/outline shape difference plus the
                // "not saved yet" text below.
                // Picked but unsaved: still raised, because nothing has
                // been committed yet. The outline-not-fill difference plus
                // the "not saved yet" text below carry the distinction.
                selected && !confirmed &&
                  "border-[var(--color-primary)] bg-[var(--color-card)] text-[var(--color-primary)] shadow-[3px_3px_7px_var(--neu-dark),-3px_-3px_7px_var(--neu-light)]",
                !selected &&
                  "border-[var(--color-border-strong)] bg-[var(--color-card)] text-[var(--color-foreground)] shadow-[3px_3px_7px_var(--neu-dark),-3px_-3px_7px_var(--neu-light)] hover:border-[var(--color-foreground)]"
              )}
            >
              {tier}
            </button>
          );
        })}
      </div>

      <p className="ui-text text-sm text-[var(--color-muted-foreground)]" aria-live="polite">
        {value ? (
          <>
            {TIER_LABELS[value as keyof typeof TIER_LABELS]}
            {!confirmed ? (
              <span className="font-semibold text-[var(--color-primary)]"> · not saved yet</span>
            ) : null}
          </>
        ) : (
          "Pick the tier that fits"
        )}
      </p>
    </div>
  );
}
