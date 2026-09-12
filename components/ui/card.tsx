import { cn } from "@/lib/cn";

/*
 * §4 elevation-consistent — cards use one step of the shared scale.
 *
 * The shadow comes from .surface alone. This previously also carried
 * shadow-[var(--shadow-1)], which stacked a second extrusion on top of
 * the first: harmless when shadows were flat drop-shadows, but under
 * neumorphism two offset light sources on one edge read as a printing
 * misregistration rather than depth.
 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("surface p-6", className)} {...props} />;
}
