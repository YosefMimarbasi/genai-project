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
import { Spinner } from "@/components/ui/spinner";
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

/*
 * §8 field-grouping — each step is a real <fieldset> with a <legend>, so
 *   screen readers announce which group a chip belongs to instead of
 *   reading a flat wall of buttons.
 */
function Step({
  n,
  legend,
  help,
  children,
}: {
  n: string;
  legend: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-[var(--color-border)] py-7 first:border-t-0 first:pt-0">
      <legend className="sr-only">{legend}</legend>
      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:gap-6">
        <div className="flex items-start gap-3 sm:w-40">
          <span
            aria-hidden
            className="ui-text tnum inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-muted)] text-xs font-bold text-[var(--color-primary)]"
          >
            {n}
          </span>
          <span className="ui-text pt-1 text-sm font-semibold">{legend}</span>
        </div>
        <div>
          {children}
          {help ? (
            <p className="ui-text mt-3 text-sm text-[var(--color-muted-foreground)]">{help}</p>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}

/*
 * §1 color-not-only — selection carries a checkmark as well as the fill,
 *   so it survives for a colour-blind user and in forced-colours mode.
 * §2 touch-target-size — min-h-11 (44px).
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
        "ui-text inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-md)]",
        "border-2 px-4 text-sm font-semibold",
        "transition-[transform,background-color,border-color,color,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out)]",
        "active:scale-[0.97]",
        "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-ring)]",
        // Selected chips are pushed into the ground, unselected ones sit
        // proud of it. The extrusion is the affordance; the fill and the
        // checkmark still carry the state, so selection survives both
        // colour-blindness and forced-colours mode where shadow is gone.
        selected
          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[inset_3px_3px_7px_var(--neu-dark),inset_-3px_-3px_7px_var(--neu-light)]"
          : "border-[var(--color-border-strong)] bg-[var(--color-card)] text-[var(--color-foreground)] shadow-[3px_3px_7px_var(--neu-dark),-3px_-3px_7px_var(--neu-light)] hover:border-[var(--color-foreground)]"
      )}
    >
      {selected ? (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
          <path d="m3 8 3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
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
    // meaningless — clear rather than silently submitting a court that
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

  // --- Waiting state -------------------------------------------------
  if (entryId) {
    return (
      <section>
        <div className="flex items-center gap-3">
          <Spinner />
          <p className="eyebrow text-[var(--color-primary)]">In the queue</p>
        </div>

        <h1 className="display mt-5 text-[clamp(2.25rem,7vw,4rem)]">Waiting for a match.</h1>

        <p className="mt-6 max-w-[46ch] text-lg text-[var(--color-muted-foreground)]">
          You're in for {sport.toLowerCase()} at tier {tier}, for the next {windowHours}{" "}
          {windowHours === 1 ? "hour" : "hours"}. This page updates itself the moment someone
          matches you, so you don't need to refresh.
        </p>

        <CourtDiagram
          sport={sport}
          className="mt-10 w-full max-w-2xl text-[var(--color-border)]"
        />

        <Button
          variant="secondary"
          size="lg"
          className="mt-10"
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

  // --- Form ----------------------------------------------------------
  return (
    <section>
      <h1 className="display text-[clamp(2.25rem,7vw,4rem)]">Find a game.</h1>
      <p className="mt-4 max-w-[48ch] text-lg text-[var(--color-muted-foreground)]">
        Five quick answers, then you're in the queue.
      </p>

      <form
        className="mt-10"
        onSubmit={(e) => {
          e.preventDefault();
          handleReadyUp();
        }}
      >
        <Step n="01" legend="Sport">
          <div className="flex flex-wrap gap-2">
            {SPORTS.map((s) => (
              <Chip key={s} selected={s === sport} onClick={() => selectSport(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </Step>

        <Step
          n="02"
          legend="Your tier"
          help={`${TIER_LABELS[tier as (typeof TIERS)[number]]}${
            savedTiers[sport] === tier ? " · saved on your profile" : ""
          }`}
        >
          <div className="flex flex-wrap gap-2">
            {TIERS.map((t) => (
              <Chip key={t} selected={t === tier} onClick={() => setTier(t)}>
                {t}
              </Chip>
            ))}
          </div>
        </Step>

        <Step n="03" legend="Free for">
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
        </Step>

        <Step
          n="04"
          legend="Where"
          help={venues.length > 0 ? "Pick as many as you'd walk to." : undefined}
        >
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

              {/* Hours decide whether a match can happen at all — badminton
                  at Noyes is Saturdays only. */}
              <dl className="ui-text mt-4 flex flex-col gap-1 text-xs">
                {venues
                  .filter((v) => v.hours || v.note)
                  .map((venue) => (
                    <div key={venue.name} className="flex gap-2">
                      <dt className="font-semibold">{venue.name}</dt>
                      <dd className="text-[var(--color-muted-foreground)]">
                        {venue.hours ?? venue.note}
                      </dd>
                    </div>
                  ))}
              </dl>
            </>
          ) : (
            /* §8 empty-states */
            <p className="ui-text text-sm text-[var(--color-muted-foreground)]">
              No open-play courts are listed for {sport.toLowerCase()} yet.
            </p>
          )}

          {comingSoon.length > 0 ? (
            <div className="ui-text mt-5 flex flex-wrap items-center gap-3">
              {comingSoon.map((venue) => (
                <span
                  key={venue.name}
                  className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-muted-foreground)]"
                >
                  {venue.name}
                </span>
              ))}
              <span className="eyebrow text-[var(--color-muted-foreground)]">
                Coming soon · {comingSoon[0].note?.toLowerCase()}
              </span>
            </div>
          ) : null}
        </Step>

        <Step n="05" legend="Intensity">
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
        </Step>

        <div className="border-t border-[var(--color-border)] pt-8">
          <Button type="submit" size="lg" loading={submitting}>
            Ready up
          </Button>
        </div>
      </form>
    </section>
  );
}
