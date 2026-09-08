import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

/*
 * Legal pages are public: someone must be able to read the privacy policy
 * before deciding to hand over an email address, which is exactly the point
 * at which it has to be reachable.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-[color-mix(in_oklab,var(--color-rule)_18%,transparent)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="label text-[var(--color-ink)]">
            Cornell Racket Queue
          </Link>
          <Link
            href="/"
            className="label text-[var(--color-gray)] transition-colors duration-150 hover:text-[var(--color-accent)]"
          >
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-14">{children}</main>

      <SiteFooter />
    </div>
  );
}
