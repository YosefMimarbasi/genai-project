"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/play", label: "Play" },
  { href: "/matches", label: "Matches" },
  { href: "/profile", label: "Profile" },
];

export function Nav() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);

    if (error) {
      toast.error("Couldn't sign out — try again.");
      return;
    }
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/play" className="font-mono text-sm font-semibold tracking-tight">
          Cornell Paddle Match
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[var(--radius-control)] px-3 py-1.5 text-sm text-[var(--color-muted)] transition-colors duration-150 hover:bg-black/[0.04] hover:text-[var(--color-foreground)]"
            >
              {link.label}
            </Link>
          ))}
          <Button variant="ghost" size="sm" onClick={handleSignOut} loading={signingOut}>
            Sign out
          </Button>
        </nav>
      </div>
    </header>
  );
}
