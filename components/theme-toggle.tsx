"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/cn";

/*
 * Neumorphic 3D switch: the track is carved into the ground (inset pair)
 * and the knob is extruded out of it (raised pair), so the control reads
 * as a real object seated in the surface.
 *
 * The knob is a sun in light mode and a moon in dark. That shape change is
 * doing real work, not decoration: it replaces the text label that used to
 * sit beside this control, and it is the only state signal that survives
 * for a colour-blind user or under forced-colours, where both the red fill
 * and the extrusion disappear.
 *
 * Also: a real <button role="switch"> with aria-checked, so it is keyboard
 * operable and announced properly, and the hit area is padded past 44px
 * even though the track is only 32px tall.
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
        "inline-flex items-center rounded-[var(--radius-pill)] p-2",
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
            "flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-paper)]",
            "shadow-[2px_2px_5px_var(--neu-dark),-2px_-2px_5px_var(--neu-light)]",
            // Only transform animates — compositor-friendly, and it stays
            // correct if the track is ever resized.
            "transition-transform duration-200 ease-[var(--ease-out-strong)]",
            isDark ? "translate-x-[1.5rem]" : "translate-x-0"
          )}
        >
          {isDark ? <MoonGlyph /> : <SunGlyph />}
        </span>
      </span>
    </button>
  );
}

function SunGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px] text-[var(--color-accent)]"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4.25" />
      {/* Eight rays, generated so the spacing is exact rather than eyeballed. */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i * Math.PI) / 4;
        const inner = 7.75;
        const outer = 10.5;
        return (
          <line
            key={i}
            x1={12 + Math.cos(angle) * inner}
            y1={12 + Math.sin(angle) * inner}
            x2={12 + Math.cos(angle) * outer}
            y2={12 + Math.sin(angle) * outer}
          />
        );
      })}
    </svg>
  );
}

function MoonGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px] text-[var(--color-accent)]"
      fill="currentColor"
      aria-hidden
    >
      {/* A crescent cut from one disc by another — a filled shape reads
          more clearly than an outline at this size. */}
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  );
}
