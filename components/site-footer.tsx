import Link from "next/link";
import { CONTACT_EMAIL } from "@/app/(legal)/legal-prose";

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/accessibility", label: "Accessibility" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-muted)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="title text-lg">Cornell Racket Queue</span>
          <nav className="ui-text flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="min-h-11 content-center text-[var(--color-muted-foreground)] transition-colors duration-[var(--dur-fast)] hover:text-[var(--color-primary)]"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="min-h-11 content-center text-[var(--color-muted-foreground)] transition-colors duration-[var(--dur-fast)] hover:text-[var(--color-primary)]"
            >
              Contact
            </a>
          </nav>
        </div>

        {/*
          Using "Cornell" in the name and Big Red as the primary implies
          affiliation; universities restrict their marks, so an unaffiliated
          student project says so plainly.
        */}
        <p className="ui-text max-w-[68ch] text-xs leading-relaxed text-[var(--color-muted-foreground)]">
          An independent student project. Not affiliated with, endorsed by, or sponsored by Cornell
          University. Court availability comes from Cornell Recreational Services and can change
          without notice. Always confirm hours before you travel.
        </p>

        <p className="ui-text text-xs text-[var(--color-muted-foreground)]">
          &copy; {new Date().getFullYear()} Cornell Racket Queue
        </p>
      </div>
    </footer>
  );
}
