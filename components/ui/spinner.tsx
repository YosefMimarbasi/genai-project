import { cn } from "@/lib/cn";

// A fast-spinning indicator reads as faster loading than a slow one at
// identical load time — keep the duration short.
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block h-5 w-5 animate-spin rounded-full border-2",
        "border-[var(--neu-dark)] border-t-[var(--color-accent)]",
        className
      )}
      style={{ animationDuration: "600ms" }}
    />
  );
}
