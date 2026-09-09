"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/cn";

/*
 * §1 aria-labels — icon-only control, so it carries an explicit label.
 * §2 touch-target-size — 44px hit area around a 20px glyph.
 * §1 color-not-only — sun vs moon is a shape change, so state survives
 *   for a colour-blind user and under forced-colours.
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
 "inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-[var(--radius-md)]",
 "text-[var(--color-muted-foreground)]",
 "transition-[background-color,color,transform] duration-[var(--dur-base)] ease-[var(--ease-out)]",
 "hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] active:scale-[0.94]",
 "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ring)]",
        !mounted && "pointer-events-none opacity-0",
        className
      )}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="4.25" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return (
              <line
                key={i}
                x1={12 + Math.cos(a) * 7.75}
                y1={12 + Math.sin(a) * 7.75}
                x2={12 + Math.cos(a) * 10.5}
                y2={12 + Math.sin(a) * 10.5}
              />
            );
          })}
        </svg>
      )}
    </button>
  );
}
