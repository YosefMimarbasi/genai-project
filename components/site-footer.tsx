import Link from "next/link";
import { CONTACT_EMAIL } from "@/app/(legal)/legal-prose";

/*
 * Legal links belong in the footer of every page (the universal standard),
 * not only on the marketing page. Privacy, Terms and a Cookies/Accessibility
 * statement are expected to be distinct pages rather than one merged
 * document.
 */
const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/accessibility", label: "Accessibility" },
];

export function SiteFooter() {
  return (
    <footer className="neu-e2 mx-auto mb-4 mt-10 w-full max-w-6xl rounded-[var(--radius-lg)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="wordmark text-[var(--color-ink)]">Cornell Racket Queue</span>
          <nav className="flex flex-wrap gap-5">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="label text-[var(--color-gray)] transition-colors duration-150 hover:text-[var(--color-accent)]"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="label text-[var(--color-gray)] transition-colors duration-150 hover:text-[var(--color-accent)]"
            >
              Contact
            </a>
          </nav>
        </div>

        {/*
          Using "Cornell" in the product name and Cornell Red as the accent
          implies affiliation. Universities restrict use of their marks to
          registered organisations, and a plain disclaimer is the standard
          way an unaffiliated student project handles it.
        */}
        <p className="max-w-[68ch] text-xs leading-[1.6] text-[var(--color-gray)]">
          An independent student project. Not affiliated with, endorsed by, or sponsored by Cornell
          University. Court availability is taken from Cornell Recreational Services and can change
          without notice. Always confirm hours before you travel.
        </p>

        <p className="text-xs text-[var(--color-gray)]">
          &copy; {new Date().getFullYear()} Cornell Racket Queue
        </p>
      </div>
    </footer>
  );
}
