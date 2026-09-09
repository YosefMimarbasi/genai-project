"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/play", label: "Play" },
  { href: "/matches", label: "Matches" },
  { href: "/profile", label: "Profile" },
];

/*
 * §9 adaptive-navigation — a top bar on every width; the link row stays
 *   visible on mobile rather than hiding behind a hamburger, since there
 *   are only three destinations.
 * §9 nav-state-active — the current section is marked with weight, colour
 *   AND an underline bar, not colour alone (§1 color-not-only).
 * §9 destructive-nav-separation — sign-out is spaced away from the links.
 */
export function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);

    if (error) {
      toast.error("Couldn't sign out. Try again.");
      return;
    }
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-[var(--z-nav)] border-b border-[var(--color-border)] bg-[var(--color-background)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
        <Link href="/play" className="title flex min-h-11 shrink-0 items-center text-lg">
          <span className="hidden sm:inline">Cornell Racket Queue</span>
          <span className="sm:hidden">CRQ</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
 "ui-text relative flex min-h-11 items-center rounded-[var(--radius-md)] px-3 text-sm",
 "transition-colors duration-[var(--dur-fast)]",
                  active
                    ? "font-bold text-[var(--color-primary)]"
                    : "font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                )}
              >
                {link.label}
                {active ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-[var(--color-primary)]"
                  />
                ) : null}
              </Link>
            );
          })}

          <span aria-hidden className="mx-1 h-6 w-px bg-[var(--color-border)]" />

          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={handleSignOut} loading={signingOut}>
            <span className="hidden sm:inline">Sign out</span>
            <span className="sm:hidden">Out</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
