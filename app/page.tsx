import Link from "next/link";
import { CourtDiagram, courtDimensions } from "@/components/court-diagram";
import { SPORTS, TIERS, TIER_LABELS, type Sport } from "@/lib/sports";
import { VENUES, queueableVenues, reservationVenues } from "@/lib/courts";
import { SiteFooter } from "@/components/site-footer";

/*
 * Public landing page. Type is the only graphic — no photography, no
 * illustration, no gradient (all on the `pentagram` recipe's Avoid list).
 * Signed-in visitors never reach this: proxy.ts sends them to /play.
 */

const STEPS = [
  {
    n: "01",
    title: "Ready up",
    body: "Pick a sport, the window you're free, and where you'd play. Takes about ten seconds.",
  },
  {
    n: "02",
    title: "Get matched",
    body: "You're paired with another student at your tier whose window overlaps yours.",
  },
  {
    n: "03",
    title: "Both accept",
    body: "Ninety seconds to confirm. After that it's a match, and you settle the details in chat.",
  },
];

/*
 * Venues that share a restriction collapse into one row. Repeating
 * "residents only, or get let in" once per dorm is noise — the reader only
 * needs the rule stated once, attached to the set it applies to.
 */
function VenueList({ sport }: { sport: Sport }) {
  const venues = queueableVenues(sport);
  const open = venues.filter((v) => v.access === "open");
  const residents = venues.filter((v) => v.access === "residents");

  return (
    <dl className="mt-5 flex flex-col gap-1.5 text-[0.8125rem] leading-[1.4]">
      {open.map((venue) => (
        <div key={venue.name} className="flex items-baseline justify-between gap-3">
          <dt className="font-medium">{venue.name}</dt>
          <dd className="text-right text-[var(--color-gray)]">{venue.hours ?? "Open rec"}</dd>
        </div>
      ))}
      {residents.length > 0 ? (
        <div className="flex items-baseline justify-between gap-3">
          <dt className="font-medium">{residents.map((v) => v.name).join(" · ")}</dt>
          <dd className="shrink-0 text-right text-[var(--color-gray)]">
            {residents[0].note}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function SectionMark({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-stretch">
      <div className="flex w-20 shrink-0 items-end justify-center bg-[var(--color-accent)] px-2 pb-1 pt-6 sm:w-28">
        <span className="display-sm text-[3rem] leading-none text-[var(--color-ground)] sm:text-[4.5rem]">
          {n}
        </span>
      </div>
      <div className="flex items-end border-b border-l-0 border-[color-mix(in_oklab,var(--color-rule)_18%,transparent)] pb-3 pl-4 sm:pl-6">
        <h2 className="display-sm text-[1.75rem] sm:text-[2.5rem]">{title}</h2>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="rule border-t-0 border-b border-[color-mix(in_oklab,var(--color-rule)_18%,transparent)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <span className="label text-[var(--color-ink)]">Cornell Racket Queue</span>
          <Link
            href="/sign-in"
            className="label text-[var(--color-gray)] transition-colors duration-150 hover:text-[var(--color-accent)]"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5">
        {/* ---------- Hero: type as image ---------- */}
        <section className="pb-16 pt-14 sm:pb-24 sm:pt-20">
          <p className="rise rise-1 label text-[var(--color-gray)]">
            Ithaca, NY
          </p>

          {/* Optical alignment: the cap of a 900-weight grotesque sits a hair
              right of the true margin, so pull it back to hang on the rule. */}
          <h1 className="display mt-6 -ml-[0.055em] text-[clamp(3.25rem,13vw,10.5rem)]">
            <span className="rise rise-2 block">A game.</span>
            <span className="rise rise-3 block">In the next</span>
            <span className="rise rise-4 block text-[var(--color-accent)]">hour.</span>
          </h1>

          <div className="rise rise-5 mt-10 flex flex-col gap-8 sm:mt-12 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-[34ch] text-[1.0625rem] leading-[1.5] text-[var(--color-gray)]">
              Say you're free. Get paired with another Cornell student at your level who's free in
              the same window. Play the same day.
            </p>

            <div className="flex shrink-0 gap-3">
              <Link href="/sign-up">
                {/* Label matches the outcome. "Ready up" is the in-app
                    action for joining the queue, so using it for signup
                    promises something this button doesn't do. */}
                <span className="inline-flex h-14 items-center justify-center bg-[var(--color-accent)] px-8 text-base font-bold tracking-[0.02em] text-[var(--color-ground)] transition-[transform,background-color] duration-[160ms] ease-[var(--ease-out-strong)] hover:bg-[var(--color-accent-hover)] active:scale-[0.97]">
                  Create an account
                </span>
              </Link>
              <Link href="/sign-in">
                <span className="inline-flex h-14 items-center justify-center border border-[var(--color-ink)] px-8 text-base font-bold tracking-[0.02em] transition-[transform,background-color,color] duration-[160ms] ease-[var(--ease-out-strong)] hover:bg-[var(--color-ink)] hover:text-[var(--color-ground)] active:scale-[0.97]">
                  Sign in
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- 01 How it works ---------- */}
        <section className="pb-20">
          <SectionMark n="01" title="How it works" />
          <div className="mt-10 grid gap-px bg-[color-mix(in_oklab,var(--color-rule)_18%,transparent)] sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="bg-[var(--color-ground)] px-0 py-6 sm:px-6 sm:first:pl-0">
                <span className="label text-[var(--color-accent)]">{step.n}</span>
                <h3 className="mt-3 text-xl font-bold tracking-[-0.015em]">{step.title}</h3>
                <p className="mt-2 max-w-[38ch] text-[0.9375rem] leading-[1.55] text-[var(--color-gray)]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- 02 Sports ---------- */}
        <section className="pb-20">
          <SectionMark n="02" title="Where you play" />
          <ul className="mt-10 grid gap-px bg-[color-mix(in_oklab,var(--color-rule)_18%,transparent)] sm:grid-cols-2 lg:grid-cols-3">
            {SPORTS.map((sport) => (
              <li key={sport} className="group flex flex-col bg-[var(--color-ground)] p-6">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-lg font-bold tracking-[-0.015em]">{sport}</h3>
                  <span className="label text-[var(--color-gray)]">{courtDimensions(sport)}</span>
                </div>
                <CourtDiagram
                  sport={sport}
                  className="mt-5 w-full text-[color-mix(in_oklab,var(--color-ink)_55%,transparent)] transition-colors duration-200 ease-[var(--ease-out-strong)] group-hover:text-[var(--color-accent)]"
                />
                <VenueList sport={sport} />
              </li>
            ))}
            {/* Spans the remaining column so the grid has no empty cell —
                an unfilled cell shows the gap colour and reads as a bug. */}
            <li className="flex flex-col justify-end bg-[var(--color-ground)] p-6 lg:col-span-2">
              <div className="grid gap-6 sm:grid-cols-2">
                <p className="max-w-[32ch] text-[0.9375rem] leading-[1.55] text-[var(--color-gray)]">
                  No bookings. Every court above is first come, first served, though PE and intramural
                  programming takes priority during the term, so a court can be taken without
                  notice. Courts are drawn to their real dimensions; the net is the dashed line.
                </p>
                <div className="border-t border-[color-mix(in_oklab,var(--color-rule)_18%,transparent)] pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                  <span className="label text-[var(--color-accent)]">Coming soon</span>
                  {Object.keys(VENUES)
                    .flatMap((sport) => reservationVenues(sport as keyof typeof VENUES))
                    .map((venue) => (
                      <p
                        key={venue.name}
                        className="mt-2 max-w-[28ch] text-[0.8125rem] leading-[1.5] text-[var(--color-gray)]"
                      >
                        {venue.name}: {venue.note?.toLowerCase()}
                      </p>
                    ))}
                </div>
              </div>
            </li>
          </ul>
        </section>

        {/* ---------- 03 Tiers ---------- */}
        <section className="pb-24">
          <SectionMark n="03" title="Five tiers" />
          <p className="mt-8 max-w-[52ch] text-[0.9375rem] leading-[1.55] text-[var(--color-gray)]">
            Describe how you play in a sentence and you get a suggested tier. You can override it.
            Nothing is saved to your profile without you confirming it.
          </p>
          <dl className="mt-8">
            {TIERS.map((tier) => (
              <div
                key={tier}
                className="flex items-baseline gap-5 border-t border-[color-mix(in_oklab,var(--color-rule)_18%,transparent)] py-4 last:border-b sm:gap-8"
              >
                <dt className="display-sm w-10 shrink-0 text-[2rem] text-[var(--color-accent)] sm:w-14 sm:text-[2.75rem]">
                  {tier}
                </dt>
                <dd className="text-base font-medium sm:text-lg">{TIER_LABELS[tier]}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
