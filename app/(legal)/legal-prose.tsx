/*
 * Shared typography for the legal pages. Body copy sits in a single
 * readable measure (~65 characters) and is left-aligned, never centred.
 */

/*
 * The document sits on its own raised sheet rather than directly on the
 * ground — a long read needs a surface to sit on, and it's the highest
 * elevation on the page because reading it is the only thing to do here.
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
    <article className="neu-e3 rounded-[var(--radius-lg)] px-6 py-10 sm:px-10 sm:py-12">
      <h1 className="display-sm text-[clamp(2rem,6vw,3rem)]">{title}</h1>
      <p className="label mt-4 text-[var(--color-gray)]">Last updated {updated}</p>
      <div className="mt-10 flex flex-col gap-2">{children}</div>
    </article>
  );
}

export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="pt-8">
      {/* The groove is this system's divider: a seam pressed into the
          surface, rather than a hairline drawn across it. */}
      <div className="neu-groove mb-8" aria-hidden />
      <h2 className="text-lg font-bold tracking-[-0.015em]">{heading}</h2>
      {/* Long-form policy text is the one place a reading serif earns its
          place, which is the role Cornell gives Freight Text. */}
      <div className="prose-serif mt-3 flex flex-col gap-3 text-base leading-[1.65] text-[var(--color-gray)]">
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
      className="font-bold text-[var(--color-accent)] hover:underline"
    >
      {CONTACT_EMAIL}
    </a>
  );
}
