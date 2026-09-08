"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetchJson, ApiError } from "@/lib/api-client";
import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import { SPORTS, TIERS, TIER_LABELS, type Sport } from "@/lib/sports";
import { queueableVenues, reservationVenues } from "@/lib/courts";
import { CourtDiagram } from "@/components/court-diagram";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { MatchProposal } from "./match-proposal";

interface ReadyUpResult {
  queueEntryId: string;
  status: "waiting" | "matched";
  proposedMatchId: string | null;
}

const WINDOWS = [
  { label: "1 hour", hours: 1 },
  { label: "2 hours", hours: 2 },
  { label: "3 hours", hours: 3 },
] as const;

const INTENSITIES = ["casual", "competitive"] as const;

/** Field rows are numbered like a spec sheet — the recipe's oversized
 *  section numeral, scaled down to field level. */
function Field({
  n,
  label,
  children,
}: {
  n: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 py-6 sm:grid-cols-[3rem_10rem_1fr] sm:gap-6">
      <span className="display-sm text-[1.5rem] text-[var(--color-accent)]">{n}</span>
      <span className="label pt-1.5 text-[var(--color-gray)] sm:pt-2">{label}</span>
      <div>{children}</div>
    </div>
  );
}

/*
 * Selection is carried by colour (a solid Cornell Red fill), with the
 * extrusion flipping from raised to pressed on top of it. Shadow alone
 * would be an invisible selection state for a lot of people, so it is
 * reinforcement here rather than the signal.
 */
function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold",
        "transition-[transform,box-shadow,background-color,color] duration-[160ms] ease-[var(--ease-out-strong)]",
        "active:scale-[0.98]",
        "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-accent)]",
        selected
          ? "bg-[var(--color-accent)] text-white shadow-[inset_3px_3px_7px_rgba(0,0,0,0.35),inset_-3px_-3px_7px_rgba(255,255,255,0.15)]"
          : "neu-e1 text-[var(--color-ink)] hover:text-[var(--color-accent)]"
      )}
    >
      {children}
    </button>
  );
}

export function ReadyUp({ savedTiers }: { savedTiers: Record<string, number> }) {
  const router = useRouter();

  const [sport, setSport] = useState<Sport>(SPORTS[0]);
  const [tier, setTier] = useState<number>(savedTiers[SPORTS[0]] ?? 3);
  const [windowHours, setWindowHours] = useState<number>(2);
  const [locations, setLocations] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<(typeof INTENSITIES)[number]>("casual");

  const [submitting, setSubmitting] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [proposedMatchId, setProposedMatchId] = useState<string | null>(null);

  const venues = queueableVenues(sport);
  const comingSoon = reservationVenues(sport);

  function selectSport(next: Sport) {
    setSport(next);
    // A saved tier for that sport is a better default than carrying the
    // previous sport's tier across.
    setTier(savedTiers[next] ?? 3);
    // Venues are sport-specific, so a selection from the previous sport is
    // meaningless here — clear rather than silently submitting a court that
    // doesn't host this sport.
    setLocations([]);
  }

  function toggleLocation(name: string) {
    setLocations((prev) =>
      prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]
    );
  }

  // While waiting, the match arrives as a Postgres change on our own queue
  // entry (status flips waiting → matched) rather than by polling.
  useRealtimeChannel({
    channelName: `queue-entry-${entryId}`,
    table: "queue_entries",
    filter: `id=eq.${entryId}`,
    enabled: Boolean(entryId) && !proposedMatchId,
    onChange: (payload) => {
      const next = payload.new as Record<string, unknown> | null;
      if (next?.status === "matched") {
        // The proposed match id isn't on the queue row, so refresh to let
        // the server hand us the live proposal.
        router.refresh();
      }
    },
  });

  async function handleReadyUp() {
    if (locations.length === 0) {
      toast.error("Pick at least one place you'd play.");
      return;
    }

    const start = new Date();
    const end = new Date(start.getTime() + windowHours * 60 * 60 * 1000);

    setSubmitting(true);
    try {
      const result = await apiFetchJson<ReadyUpResult>("/api/queue/ready", {
        method: "POST",
        body: JSON.stringify({
          sport,
          skillTier: tier,
          timeWindowStart: start.toISOString(),
          timeWindowEnd: end.toISOString(),
          locations,
          intensity,
        }),
      });

      setEntryId(result.queueEntryId);
      setProposedMatchId(result.proposedMatchId);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't join the queue. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (proposedMatchId) {
    return (
      <MatchProposal
        proposedMatchId={proposedMatchId}
        sport={sport}
        onDeclined={() => {
          setProposedMatchId(null);
          setEntryId(null);
        }}
      />
    );
  }

  if (entryId) {
    return (
      <section className="py-10">
        <h1 className="display -ml-[0.03em] text-[clamp(2.75rem,8vw,6rem)]">
          Waiting for
          <br />
          a match.
        </h1>
        <p className="mt-8 max-w-[40ch] text-[1.0625rem] leading-[1.5] text-[var(--color-gray)]">
          You're in for {sport.toLowerCase()} at tier {tier}, next {windowHours}{" "}
          {windowHours === 1 ? "hour" : "hours"}. This page updates itself the moment someone
          matches you, so you don't need to refresh.
        </p>

        <CourtDiagram
          sport={sport}
          className="neu-engraved mt-12 w-full max-w-2xl text-[color-mix(in_oklab,var(--color-ink)_30%,transparent)]"
        />

        <Button
          variant="secondary"
          size="lg"
          className="mt-12"
          onClick={() => {
            setEntryId(null);
            toast.message("Left the queue view. Your entry expires on its own.");
          }}
        >
          Back
        </Button>
      </section>
    );
  }

  return (
    <section className="py-6">
      <h1 className="display -ml-[0.03em] text-[clamp(2.75rem,8vw,6rem)]">Find a game.</h1>

      <div className="mt-12">
        <Field n="01" label="Sport">
          <div className="flex flex-wrap gap-2">
            {SPORTS.map((s) => (
              <Chip key={s} selected={s === sport} onClick={() => selectSport(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </Field>

        <Field n="02" label="Your tier">
          <div className="flex flex-wrap gap-2">
            {TIERS.map((t) => (
              <Chip key={t} selected={t === tier} onClick={() => setTier(t)}>
                {t}
              </Chip>
            ))}
          </div>
          <p className="mt-3 text-sm text-[var(--color-gray)]">
            {TIER_LABELS[tier as (typeof TIERS)[number]]}
            {savedTiers[sport] === tier ? " (saved on your profile)" : ""}
          </p>
        </Field>

        <Field n="03" label="Free for">
          <div className="flex flex-wrap gap-2">
            {WINDOWS.map((w) => (
              <Chip
                key={w.hours}
                selected={w.hours === windowHours}
                onClick={() => setWindowHours(w.hours)}
              >
                {w.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field n="04" label="Where">
          {venues.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {venues.map((venue) => (
                  <Chip
                    key={venue.name}
                    selected={locations.includes(venue.name)}
                    onClick={() => toggleLocation(venue.name)}
                  >
                    {venue.name}
                    {venue.access === "residents" ? (
                      <span className="text-xs font-medium opacity-70">residents</span>
                    ) : null}
                  </Chip>
                ))}
              </div>

              {/* Hours are the difference between a match that can happen and
                  one that can't — badminton at Noyes is Saturdays only. */}
              <dl className="mt-4 flex flex-col gap-1">
                {venues
                  .filter((venue) => venue.hours || venue.note)
                  .map((venue) => (
                    <div key={venue.name} className="flex gap-2 text-xs leading-[1.5]">
                      <dt className="font-bold">{venue.name}</dt>
                      <dd className="text-[var(--color-gray)]">{venue.hours ?? venue.note}</dd>
                    </div>
                  ))}
              </dl>

              <p className="mt-3 text-sm text-[var(--color-gray)]">
                Pick as many as you'd travel to.
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--color-gray)]">
              No open-play courts listed for {sport.toLowerCase()} yet.
            </p>
          )}

          {comingSoon.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {comingSoon.map((venue) => (
                <span
                  key={venue.name}
                  title={venue.note}
                  className="neu-pressed rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold text-[var(--color-gray)]"
                >
                  {venue.name}
                </span>
              ))}
              <span className="label text-[var(--color-gray)]">
                Coming soon: {comingSoon[0].note?.toLowerCase()}
              </span>
            </div>
          ) : null}
        </Field>

        <Field n="05" label="Intensity">
          <div className="flex flex-wrap gap-2">
            {INTENSITIES.map((option) => (
              <Chip
                key={option}
                selected={option === intensity}
                onClick={() => setIntensity(option)}
              >
                {option === "casual" ? "Casual" : "Competitive"}
              </Chip>
            ))}
          </div>
        </Field>
      </div>

      <div className="pt-8">
        <Button size="lg" loading={submitting} onClick={handleReadyUp}>
          Ready up
        </Button>
      </div>
    </section>
  );
}
