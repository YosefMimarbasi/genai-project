import { cn } from "@/lib/cn";

/** A raised panel extruded from the ground. No border: the shadow pair is
 *  what separates it, which is the whole point of the style. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("neu-raised rounded-[var(--radius-lg)] p-6", className)} {...props} />;
}
