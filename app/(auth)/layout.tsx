import Link from "next/link";
import { SPORTS } from "@/lib/sports";

/*
 * Split composition rather than a centred card. A centred stacked form is
 * the default everyone ships; putting a flat accent block of hero-scale type
 * beside it keeps the auth screens inside the same visual language as the
 * landing page (recipe signature: colour block + type as image).
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-[var(--color-accent)] p-10 text-[var(--color-ground)] lg:flex">
        <Link href="/" className="label">
          Cornell Racket Queue
        </Link>

        <p className="display -ml-[0.055em] text-[clamp(3rem,6.5vw,5.5rem)]">
          A game.
          <br />
          In the next
          <br />
          hour.
        </p>

        <p className="label opacity-70">{SPORTS.join(" · ")}</p>
      </aside>

      <div className="flex flex-col">
        <header className="border-b border-[color-mix(in_oklab,var(--color-rule)_18%,transparent)] lg:hidden">
          <div className="flex h-14 items-center px-5">
            <Link href="/" className="label text-[var(--color-ink)]">
              Cornell Racket Queue
            </Link>
          </div>
        </header>
        <div className="flex flex-1 items-center px-5 py-12 sm:px-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
