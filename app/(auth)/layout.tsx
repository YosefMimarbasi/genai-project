import Link from "next/link";
import { SPORTS } from "@/lib/sports";
import { ThemeToggle } from "@/components/theme-toggle";

/*
 * The accent panel is an extruded block seated on the ground, not a slab
 * bled to the viewport edge. A hard full-bleed rectangle was the last
 * surface on the site still speaking the old flat language, and the hard
 * vertical seam where it met the form column read as a different system.
 *
 * Text on the panel is white rather than the ground colour: in dark mode
 * the ground is near-black, and near-black on lightened red is a contrast
 * failure.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-6xl gap-6 sm:min-h-[calc(100dvh-3rem)] lg:grid-cols-2">
        <aside className="hidden flex-col justify-between rounded-[var(--radius-lg)] bg-[var(--color-accent)] p-10 text-white shadow-[9px_9px_22px_var(--neu-dark),-9px_-9px_22px_var(--neu-light)] lg:flex">
          <Link href="/" className="wordmark">
            Cornell Racket Queue
          </Link>

          <p className="display -ml-[0.03em] text-[clamp(3rem,6.5vw,5.5rem)]">
            A game.
            <br />
            In the next
            <br />
            hour.
          </p>

          <p className="label opacity-75">{SPORTS.join(" · ")}</p>
        </aside>

        <div className="flex flex-col">
          <header className="neu-e2 flex h-14 shrink-0 items-center justify-between rounded-[var(--radius-lg)] px-5">
            <Link href="/" className="wordmark text-[var(--color-ink)] lg:invisible">
              Cornell Racket Queue
            </Link>
            <ThemeToggle />
          </header>

          <div className="flex flex-1 items-center justify-center py-10 sm:px-6">
            <div className="w-full max-w-sm">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
