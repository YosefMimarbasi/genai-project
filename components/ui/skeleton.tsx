import { cn } from "@/lib/cn";

/*
 * §3 progressive-loading — a skeleton beats a blocking spinner for
 *   anything over ~1s, because it also reserves the space the real content
 *   will take (§3 content-jumping / CLS).
 * §7 excessive-motion — the pulse is the one continuous animation in the
 *   system, and it exists only while loading. It stops under
 *   prefers-reduced-motion via the global rule in globals.css.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-[var(--radius-md)] bg-[var(--color-muted)]",
        className
      )}
    />
  );
}

/**
 * Wraps a skeleton screen so assistive tech is told the page is working
 * rather than reading out a pile of empty boxes.
 */
export function SkeletonScreen({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
