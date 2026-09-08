"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/cn";

/*
 * Neumorphic 3D switch: the track is carved into the ground (inset pair)
 * and the knob is extruded out of it (raised pair), so the control reads
 * as a real object seated in the surface.
 *
 * Accessibility notes, per the skill's own "flag conflicts and prioritise
 * accessibility" rule:
 *  - It is a real <button role="switch"> with aria-checked, not a styled
 *    div, so it is keyboard operable and announced correctly.
 *  - The visible text label is not decoration. Neumorphism encodes state
 *    in shadow and colour, both of which fail for a colour-blind user and
 *    vanish under forced-colours; the word is what actually carries state.
 *  - The hit area is padded past 44px even though the track is 32px tall.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // The server cannot know a stored preference, so the state is only
  // correct after hydration. Reserve the space and stay inert until then
  // rather than rendering a switch that flips on load.
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark mode"
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "group flex items-center gap-3 rounded-[var(--radius-pill)] p-2",
        "transition-opacity duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
        !mounted && "pointer-events-none opacity-0",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "relative flex h-8 w-14 shrink-0 items-center rounded-[var(--radius-pill)] px-1",
          "transition-[background-color,box-shadow] duration-200 ease-[var(--ease-out-strong)]",
          isDark
            ? "bg-[var(--color-accent)] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.45),inset_-2px_-2px_6px_rgba(255,255,255,0.18)]"
            : "bg-[var(--color-ground)] shadow-[inset_3px_3px_6px_var(--neu-dark),inset_-3px_-3px_6px_var(--neu-light)]"
        )}
      >
        <span
          className={cn(
            "h-6 w-6 rounded-full bg-[var(--color-paper)]",
            "shadow-[2px_2px_5px_var(--neu-dark),-2px_-2px_5px_var(--neu-light)]",
            // Only transform animates — it is compositor-friendly, and a
            // percentage keeps the travel correct if the track resizes.
            "transition-transform duration-200 ease-[var(--ease-out-strong)]",
            isDark ? "translate-x-[1.5rem]" : "translate-x-0"
          )}
        />
      </span>

      <span className="label w-9 text-left text-[var(--color-gray)] transition-colors duration-150 group-hover:text-[var(--color-ink)]">
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}
