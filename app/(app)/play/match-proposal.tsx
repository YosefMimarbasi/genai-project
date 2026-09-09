"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetchJson, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import type { Sport } from "@/lib/sports";

/** Matches the ~90s expiry window the matching functions write. */
const WINDOW_SECONDS = 90;

interface RespondResult {
  status: "pending" | "accepted_both" | "declined" | "expired";
  confirmedMatchId: string | null;
}

export function MatchProposal({
  proposedMatchId,
  sport,
  onDeclined,
}: {
  proposedMatchId: string;
  sport: Sport;
  onDeclined: () => void;
}) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(WINDOW_SECONDS);
  const [submitting, setSubmitting] = useState<"accepted" | "declined" | null>(null);
  const [waitingOnThem, setWaitingOnThem] = useState(false);

  // Callers pass an inline arrow, so `onDeclined` has a new identity every
  // render. Depending on it directly would re-run the expiry effect on each
  // render once the clock hit zero, firing the toast repeatedly. Hold it in
  // a ref and latch the expiry so it runs exactly once.
  const onDeclinedRef = useRef(onDeclined);
  onDeclinedRef.current = onDeclined;
  const expiredRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining === 0 && !waitingOnThem && !expiredRef.current) {
      expiredRef.current = true;
      toast.message("That match expired. You're back in the queue.");
      onDeclinedRef.current();
    }
  }, [remaining, waitingOnThem]);

  async function respond(response: "accepted" | "declined") {
    setSubmitting(response);
    try {
      const result = await apiFetchJson<RespondResult>(
        `/api/matches/${proposedMatchId}/respond`,
        { method: "POST", body: JSON.stringify({ response }) }
      );

      if (response === "declined") {
        toast.message("Declined. You're back in the queue.");
        onDeclined();
        return;
      }

      if (result.status === "accepted_both" && result.confirmedMatchId) {
        router.push(`/matches/${result.confirmedMatchId}`);
        return;
      }

      setWaitingOnThem(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't send that. Try again.");
    } finally {
      setSubmitting(null);
    }
  }

  if (waitingOnThem) {
    return (
      <section>
        <p className="eyebrow text-[var(--color-primary)]">Accepted</p>
        <h1 className="display mt-5 text-[clamp(2.25rem,7vw,4rem)]">Waiting on them.</h1>
        <p className="mt-6 max-w-[46ch] text-lg text-[var(--color-muted-foreground)]">
          You're in. As soon as they accept too, the match is confirmed and you'll be able to
          message each other.
        </p>
      </section>
    );
  }

  const pct = (remaining / WINDOW_SECONDS) * 100;
  const urgent = remaining <= 15;

  return (
    <section>
      <p className="eyebrow text-[var(--color-primary)]">Match found · {sport}</p>

      <h1 className="display mt-5 text-[clamp(2.25rem,7vw,4rem)]">
        Someone's free right now.
      </h1>

      {/*
        §10-adjacent: the countdown is the critical state on this screen, so
        it is announced as well as drawn. aria-live="assertive" is warranted
        here (unlike most live regions) because a missed deadline loses the
        match outright.
      */}
      <div className="mt-8 flex items-center gap-4">
        <span
          className={cn2(
            "display tnum text-[clamp(3rem,12vw,5.5rem)] leading-none transition-colors duration-[var(--dur-base)]",
            urgent ? "text-[var(--color-destructive)]" : "text-[var(--color-foreground)]"
          )}
        >
          {remaining}
        </span>
        <span className="ui-text text-sm font-semibold text-[var(--color-muted-foreground)]">
          seconds
          <br />
          to answer
        </span>
      </div>
      <p className="sr-only" role="status" aria-live="assertive">
        {remaining <= 10 ? `${remaining} seconds left to answer` : ""}
      </p>

      {/* Width is driven by a style transform-free scaleX so it stays off
          the layout path (§7 layout-shift-avoid). */}
      <div className="mt-4 h-2 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-muted)]">
        <div
          className={cn2(
            "h-full origin-left rounded-[var(--radius-pill)] transition-transform duration-1000 ease-linear",
            urgent ? "bg-[var(--color-destructive)]" : "bg-[var(--color-primary)]"
          )}
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </div>

      <p className="mt-8 max-w-[50ch] text-lg text-[var(--color-muted-foreground)]">
        Someone at your tier is free in the same window. Both of you have to accept. If either
        declines or runs out the clock, you both go back in the queue.
      </p>

      {/* §8 destructive-emphasis — decline is visually separated and
          subordinate; accept is the single primary action. */}
      <div className="mt-10 flex flex-wrap gap-3 border-t border-[var(--color-border)] pt-8">
        <Button
          size="lg"
          loading={submitting === "accepted"}
          disabled={submitting !== null}
          onClick={() => respond("accepted")}
        >
          Accept match
        </Button>
        <Button
          size="lg"
          variant="ghost"
          loading={submitting === "declined"}
          disabled={submitting !== null}
          onClick={() => respond("declined")}
        >
          Decline
        </Button>
      </div>
    </section>
  );
}

// Local alias so this file doesn't need the shared helper import twice.
function cn2(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
