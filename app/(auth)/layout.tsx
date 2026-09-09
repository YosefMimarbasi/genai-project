import Link from "next/link";
import { SPORTS } from "@/lib/sports";
import { ThemeToggle } from "@/components/theme-toggle";

/*
 * Block-based split: a full accent block beside the form. The block uses
 * the primary rather than the lime, since it carries display type and
 * white-on-Big-Red is 7:1 while ink-on-lime would fight the form column
 * for attention.
 *
 * §5 mobile-first — the block is hidden below lg and the form goes
 * full width, rather than shrinking into an unreadable sliver.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col lg:grid lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-[var(--color-primary)] p-12 text-[var(--color-on-primary)] lg:flex">
        <Link href="/" className="title flex min-h-11 items-center text-lg">
          Cornell Racket Queue
        </Link>

        <p className="display text-[clamp(3rem,6vw,5rem)]">
          A game.
          <br />
          In the next
          <br />
          hour.
        </p>

        <p className="eyebrow opacity-80">{SPORTS.join(" · ")}</p>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between px-5">
          <Link href="/" className="title flex min-h-11 items-center text-lg lg:invisible">
            Cornell Racket Queue
          </Link>
          <ThemeToggle />
        </header>

        <div id="main" className="flex flex-1 items-center justify-center px-5 py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
