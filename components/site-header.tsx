import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

/*
 * §9 navigation-consistency — the public header is identical on every
 *   public page (landing, legal), so its position never shifts.
 * Landing pattern requires a sticky nav CTA, which is what the sign-up
 * button here is.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-[var(--z-nav)] border-b border-[var(--color-border)] bg-[var(--color-background)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link
          href="/"
          className="title flex min-h-11 items-center text-lg text-[var(--color-foreground)] transition-colors duration-[var(--dur-fast)] hover:text-[var(--color-primary)]"
        >
          Cornell Racket Queue
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/sign-in" className="hidden sm:block">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
