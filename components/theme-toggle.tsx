"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/cn";

/*
 * The neumorphic 3D switch: a track carved into the ground with a knob
 * extruded out of it, so the two halves of the control are lit from the
 * same source in opposite directions. The knob slides rather than the
 * track recolouring, because in a style with no hard edges, position is
 * easier to read at a glance than hue.
 *
 * State is carried three ways over: knob position, knob shape (sun vs
 * crescent), and colour. That redundancy is deliberate — colour alone
 * fails for a colour-blind user, and the shadows that sell the effect
 * disappear entirely under forced-colours, where only the glyph and the
 * outline survive.
 *
 * §1 aria-labels — icon-only control, so it carries an explicit label.
 * §2 touch-target-size — the button is 44px tall; the track is smaller
 *   but the hit area is not.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // The server cannot know a stored preference; stay inert until hydrated
  // rather than rendering a state that flips on load.
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
        "inline-flex h-11 cursor-pointer items-center px-1",
        "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-ring)]",
        "rounded-[var(--radius-pill)]",
        !mounted && "pointer-events-none opacity-0",
        className
      )}
    >
      {/* Track: pressed into the ground. */}
      <span
        aria-hidden
        className={cn(
          "relative flex h-8 w-14 items-center rounded-[var(--radius-pill)]",
          "shadow-[inset_3px_3px_6px_var(--neu-dark),inset_-3px_-3px_6px_var(--neu-light)]",
          "transition-colors duration-[var(--dur-base)] ease-[var(--ease-out)]",
          isDark ? "bg-[var(--color-primary)]/25" : "bg-[var(--color-card)]"
        )}
      >
        {/* Knob: extruded out of the track, and the thing that moves. */}
        <span
          className={cn(
            "absolute flex h-6 w-6 items-center justify-center rounded-full",
            "bg-[var(--color-card)]",
            "shadow-[2px_2px_5px_var(--neu-dark),-2px_-2px_5px_var(--neu-light)]",
            "transition-transform duration-[var(--dur-base)] ease-[var(--ease-out)]",
            isDark ? "translate-x-[1.875rem]" : "translate-x-1"
          )}
        >
          {isDark ? (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[var(--color-primary)]" fill="currentColor">
              <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-[var(--color-primary)]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="4" />
              {/* Rays generated from the angle so they stay evenly spaced
                  rather than being eight hand-placed line elements. */}
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i * Math.PI) / 4;
                return (
                  <line
                    key={i}
                    x1={12 + Math.cos(a) * 7.5}
                    y1={12 + Math.sin(a) * 7.5}
                    x2={12 + Math.cos(a) * 10}
                    y2={12 + Math.sin(a) * 10}
                  />
                );
              })}
            </svg>
          )}
        </span>
      </span>
    </button>
  );
}
