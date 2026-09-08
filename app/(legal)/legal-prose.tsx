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
    <section className="border-t border-[color-mix(in_oklab,var(--color-rule)_18%,transparent)] pt-6">
      <h2 className="text-lg font-bold tracking-[-0.015em]">{heading}</h2>
      <div className="mt-3 flex flex-col gap-3 text-[0.9375rem] leading-[1.6] text-[var(--color-gray)]">
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

/** Marks a value only the operator can supply, so it can't ship unnoticed. */
export function Fill({ children }: { children: React.ReactNode }) {
  return (
    <mark className="bg-[var(--color-accent)] px-1 font-bold text-[var(--color-ground)]">
      {children}
    </mark>
  );
}
