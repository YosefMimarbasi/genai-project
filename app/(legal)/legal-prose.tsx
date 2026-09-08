/*
 * Shared typography for the legal pages. Body copy sits in a single
 * readable measure (~65 characters) and is left-aligned, never centred.
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
      <h1 className="display-sm text-[clamp(2rem,6vw,3rem)]">{title}</h1>
      <p className="label mt-4 text-[var(--color-gray)]">Last updated {updated}</p>
      <div className="mt-10 flex flex-col gap-8">{children}</div>
    </article>
  );
}

export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="pt-6">
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
