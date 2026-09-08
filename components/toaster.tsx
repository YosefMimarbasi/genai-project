"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

/*
 * Sonner's own theme="system" follows prefers-color-scheme, which ignores
 * an explicit choice made with the toggle. Feed it the resolved theme so
 * toasts match the page rather than the OS.
 */
export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      position="bottom-right"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
    />
  );
}
