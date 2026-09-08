import { cn } from "@/lib/cn";

/*
 * Pentagram "thinks in spreads, not cards" — so this is deliberately not a
 * floating rounded card. It's a ruled block: hairline border, zero radius,
 * no shadow, sitting on paper rather than hovering above it.
 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border border-[color-mix(in_oklab,var(--color-rule)_18%,transparent)] bg-[var(--color-paper)] p-6",
        className
      )}
      {...props}
    />
  );
}
