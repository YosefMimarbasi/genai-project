import { cn } from "@/lib/cn";

/** §4 elevation-consistent — cards use one step of the shared scale. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("surface p-6 shadow-[var(--shadow-1)]", className)} {...props} />;
}
