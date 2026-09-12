import Link from "next/link";
import { CourtDiagram, courtDimensions } from "@/components/court-diagram";
import { SPORTS, TIERS, TIER_LABELS, type Sport } from "@/lib/sports";
import { queueableVenues, reservationVenues, VENUES } from "@/lib/courts";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";

/*
 * Landing pattern: Hero + Features + CTA (products.csv → Sports Team/Club
 * → "Hero-Centric Design + Feature-Rich").
 *   1. Hero with headline      2. Value prop strip
 *   3. Key features (3-5)      4. CTA section        5. Footer
 *
 * The generator's alternate pattern wanted a testimonials carousel with
 * "photo + name + role". This product has not launched, so any testimonial
 * would be invented. Fabricated social proof is worse than none, so the
 * feature-rich variant is used instead — it converts on substance the app
 * actually has (real courts, real hours) rather than on manufactured trust.
 */

const FEATURES = [
  {
    title: "Ready up in ten seconds",
    body: "Pick a sport, how long you're free, and which courts you'd walk to. That's the whole form.",
  },
  {
    title: "Matched at your level",
    body: "You're paired with someone in the same tier whose free window overlaps yours, so neither of you is wasting an afternoon.",
  },
  {
    title: "Ninety seconds to confirm",
    body: "Both of you accept or it's off. No indefinite waiting on someone who already left.",
  },
  {
    title: "Real court hours",
    body: "Open-rec times come from Cornell Recreation, including which game rooms need you to live in the building.",
  },
];

function ValueStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="display tnum text-[clamp(2.5rem,6vw,3.5rem)] text-[var(--color-primary)]">
        {value}
      </p>
      <p className="ui-text mt-1 text-sm text-[var(--color-muted-foreground)]">{label}</p>
    </div>
  );
}

function SportCard({ sport, index }: { sport: Sport; index: number }) {
  const venues = queueableVenues(sport);
  const open = venues.filter((v) => v.access === "open");
  const residents = venues.filter((v) => v.access === "residents");

  return (
    <Reveal as="li" index={index} className="surface neu-lift group flex flex-col p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="title text-xl">{sport}</h3>
        <span className="eyebrow tnum text-[var(--color-muted-foreground)]">
          {courtDimensions(sport)}
        </span>
      </div>

      <CourtDiagram
        sport={sport}
        className="mt-5 w-full text-[var(--color-border)] transition-colors duration-[var(--dur-slow)] group-hover:text-[var(--color-primary)]"
      />

      <dl className="ui-text mt-5 flex flex-col gap-2 text-sm">
        {open.map((venue) => (
          <div key={venue.name} className="flex items-baseline justify-between gap-3">
            <dt className="font-semibold">{venue.name}</dt>
            <dd className="text-right text-[var(--color-muted-foreground)]">
              {venue.hours ?? "Open rec"}
            </dd>
          </div>
        ))}
        {residents.length > 0 ? (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="font-semibold">{residents.map((v) => v.name).join(" · ")}</dt>
            <dd className="shrink-0 text-right text-[var(--color-muted-foreground)]">
              {residents[0].note}
            </dd>
          </div>
        ) : null}
      </dl>
    </Reveal>
  );
}

export default function LandingPage() {
  const reservationOnly = Object.keys(VENUES).flatMap((s) =>
    reservationVenues(s as Sport)
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main id="main" className="flex-1">
        {/* ---------- 1. Hero ---------- */}
        <section className="block-section">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <p className="eyebrow text-[var(--color-primary)]">Ithaca, NY</p>
              <h1 className="display mt-5 text-[clamp(2.75rem,9vw,6.5rem)]">
                A game.
                <br />
                In the next{" "}
                {/*
                  The word sets its own colour rather than inheriting the
                  heading's. The highlight block stays lime in both themes,
                  so the text on top of it must stay ink in both themes —
                  inheriting meant it turned light in dark mode and sat at
                  about 1.3:1 on the lime, which is unreadable.
                */}
                <span className="relative inline-block text-[var(--color-on-accent)]">
                  <span
                    aria-hidden
                    className="absolute inset-x-[-0.15em] bottom-[0.08em] top-[0.18em] -z-10 -rotate-1 rounded-[var(--radius-sm)] bg-[var(--color-accent)]"
                  />
                  hour.
                </span>
              </h1>

              <p className="mt-8 max-w-[38ch] text-lg leading-relaxed text-[var(--color-muted-foreground)] sm:text-xl">
                Say you're free. Get paired with another Cornell student at your level who's free
                in the same window. Play the same day.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/sign-up">
                  <Button size="lg">Create an account</Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="secondary">
                    Sign in
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------- 2. Value prop strip ---------- */}
        <section className="border-y border-[var(--color-border)] bg-[var(--color-muted)]">
          <div className="mx-auto max-w-6xl px-5 py-12">
            <Reveal className="grid gap-8 sm:grid-cols-3">
              <ValueStat value={String(SPORTS.length)} label="Racket sports" />
              <ValueStat value={String(TIERS.length)} label="Skill tiers" />
              <ValueStat value="90s" label="To accept a match" />
            </Reveal>
          </div>
        </section>

        {/* ---------- 3. Key features ---------- */}
        <section className="block-section">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <h2 className="display text-[clamp(2rem,5vw,3rem)]">How it works</h2>
            </Reveal>

            <ul className="mt-12 grid gap-6 sm:grid-cols-2">
              {FEATURES.map((feature, i) => (
                <Reveal
                  as="li"
                  key={feature.title}
                  index={i}
                  className="surface p-6"
                >
                  <span
                    aria-hidden
                    className="ui-text tnum inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-sm font-bold text-[var(--color-on-primary)]"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="title mt-4 text-xl">{feature.title}</h3>
                  <p className="mt-2 text-[var(--color-muted-foreground)]">{feature.body}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Courts ---------- */}
        <section className="block-section border-t border-[var(--color-border)]">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <h2 className="display text-[clamp(2rem,5vw,3rem)]">Where you play</h2>
              <p className="mt-4 max-w-[56ch] text-[var(--color-muted-foreground)]">
                Every court below is open rec, first come first served. PE and intramural
                programming takes priority during term, so a court can be taken without notice.
                Diagrams are drawn to real court dimensions.
              </p>
            </Reveal>

            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {SPORTS.map((sport, i) => (
                <SportCard key={sport} sport={sport} index={i} />
              ))}

              {reservationOnly.length > 0 ? (
                <Reveal
                  as="li"
                  index={SPORTS.length}
                  className="flex flex-col justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border)] p-6"
                >
                  <p className="eyebrow text-[var(--color-primary)]">Coming soon</p>
                  {reservationOnly.map((venue) => (
                    <p key={venue.name} className="mt-3 text-[var(--color-muted-foreground)]">
                      <span className="font-semibold text-[var(--color-foreground)]">
                        {venue.name}
                      </span>{": "}
                      {venue.note?.toLowerCase()}
                    </p>
                  ))}
                </Reveal>
              ) : null}
            </ul>
          </div>
        </section>

        {/* ---------- Tiers ---------- */}
        <section className="block-section border-t border-[var(--color-border)]">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <h2 className="display text-[clamp(2rem,5vw,3rem)]">Five tiers</h2>
              <p className="mt-4 max-w-[56ch] text-[var(--color-muted-foreground)]">
                Describe how you play in a sentence and you get a suggested tier. You can override
                it. Nothing is saved to your profile without you confirming it.
              </p>
            </Reveal>

            <dl className="mt-12 grid gap-4 sm:grid-cols-5">
              {TIERS.map((tier, i) => (
                <Reveal
                  key={tier}
                  index={i}
                  className="surface flex flex-col gap-1 p-5"
                >
                  <dt className="display tnum text-4xl text-[var(--color-primary)]">{tier}</dt>
                  <dd className="ui-text text-sm font-medium">{TIER_LABELS[tier]}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        {/* ---------- 4. CTA ---------- *
            Deep CTA on the accent block: ink on lime clears 7:1 easily,
            which is the pattern's contrast requirement for the closing CTA. */}
        <section className="bg-[var(--color-accent)] text-[var(--color-on-accent)]">
          <div className="mx-auto max-w-6xl px-5 py-20 text-center">
            <Reveal>
              <h2 className="display text-[clamp(2rem,6vw,3.5rem)]">Go find a game.</h2>
              <p className="mx-auto mt-4 max-w-[46ch] text-lg opacity-80">
                Open to anyone with a Cornell NetID.
              </p>
              <Link href="/sign-up" className="mt-10 inline-block">
                <Button size="lg">Create an account</Button>
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
