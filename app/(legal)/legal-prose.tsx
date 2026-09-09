/*
 * Shared typography for the legal pages.
 * §6 line-length — the measure is capped at ~68ch so long-form policy text
 *   stays readable rather than running edge to edge.
 */

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <article>
      <h1 className="display text-[clamp(2rem,6vw,3rem)]">{title}</h1>
      <p className="eyebrow mt-4 text-[var(--color-muted-foreground)]">Last updated {updated}</p>
      <div className="mt-10 flex flex-col">{children}</div>
    </article>
  );
}

export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[var(--color-border)] py-8 first:border-t-0 first:pt-0">
      <h2 className="title text-xl">{heading}</h2>
      <div className="mt-3 flex max-w-[68ch] flex-col gap-3 text-[var(--color-muted-foreground)]">
        {children}
      </div>
    </section>
  );
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2 pl-5">
      {items.map((item, i) => (
        <li key={i} className="list-disc">
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Single source of truth for the contact address across all legal pages. */
export const CONTACT_EMAIL = "ym583@cornell.edu";

export function ContactEmail() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="font-semibold text-[var(--color-primary)] underline underline-offset-2"
    >
      {CONTACT_EMAIL}
    </a>
  );
}
