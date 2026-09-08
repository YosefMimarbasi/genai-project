import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";

/*
 * Legal pages are public: someone must be able to read the privacy policy
 * before deciding to hand over an email address, which is exactly the point
 * at which it has to be reachable.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="neu-e2 mx-auto mt-4 w-full max-w-6xl rounded-[var(--radius-lg)]">
        <div className="flex h-14 items-center justify-between px-5">
          <Link href="/" className="wordmark text-[var(--color-ink)]">
            Cornell Racket Queue
          </Link>
          <div className="flex items-center gap-5">
            <ThemeToggle />
            <Link
              href="/"
              className="label text-[var(--color-gray)] transition-colors duration-150 hover:text-[var(--color-accent)]"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-14">{children}</main>

      <SiteFooter />
    </div>
  );
}
