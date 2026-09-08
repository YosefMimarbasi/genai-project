"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/play", label: "Play" },
  { href: "/matches", label: "Matches" },
  { href: "/profile", label: "Profile" },
];

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
    <header className="border-b border-[color-mix(in_oklab,var(--color-rule)_18%,transparent)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/play" className="label text-[var(--color-ink)]">
          Cornell Racket Queue
        </Link>
        <nav className="flex items-center gap-5">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "label transition-colors duration-150",
                  active
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-gray)] hover:text-[var(--color-ink)]"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="label text-[var(--color-gray)] transition-[color,transform] duration-150 ease-[var(--ease-out-strong)] hover:text-[var(--color-ink)] active:scale-[0.97] disabled:opacity-40"
          >
            {signingOut ? "Signing out" : "Sign out"}
          </button>
        </nav>
      </div>
    </header>
  );
}
