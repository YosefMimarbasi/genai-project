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
  // render once the clock hit zero — firing the toast repeatedly. Hold it in
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
      <section className="py-10">
        <h1 className="display -ml-[0.045em] text-[clamp(2.75rem,8vw,6rem)]">
          Waiting on
          <br />
          them.
        </h1>
        <p className="mt-8 max-w-[40ch] text-[1.0625rem] leading-[1.5] text-[var(--color-gray)]">
          You're in. As soon as they accept too, the match is confirmed and you'll be able to
          message each other.
        </p>
      </section>
    );
  }

  return (
    <section className="py-10">
      <p className="label text-[var(--color-accent)]">Match found: {sport}</p>

      {/* A single oversized numeral carrying the block, per the recipe. */}
      <div className="mt-4 flex items-baseline gap-6">
        <span className="display text-[clamp(5rem,20vw,13rem)] tabular-nums">{remaining}</span>
        <span className="label text-[var(--color-gray)]">seconds to answer</span>
      </div>

      {/*
        Constant, measured motion → linear easing, and it runs as a CSS
        animation so it stays smooth while the page is busy. Draining to
        zero is a measurement, not an entrance, so scaleX(0) is correct here.
      */}
      <div className="mt-2 h-1 w-full overflow-hidden bg-[color-mix(in_oklab,var(--color-rule)_15%,transparent)]">
        <div
          className="h-full origin-left bg-[var(--color-accent)] motion-reduce:hidden"
          style={{ animation: `drain ${WINDOW_SECONDS}s linear forwards` }}
        />
      </div>
      <style>{`@keyframes drain { from { transform: scaleX(1) } to { transform: scaleX(0) } }`}</style>

      <p className="mt-10 max-w-[44ch] text-[1.0625rem] leading-[1.5] text-[var(--color-gray)]">
        Someone at your tier is free in the same window. Both of you have to accept. If either
        declines or runs out the clock, you both go back in the queue.
      </p>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-[color-mix(in_oklab,var(--color-rule)_18%,transparent)] pt-8">
        <Button
          size="lg"
          loading={submitting === "accepted"}
          disabled={submitting !== null}
          onClick={() => respond("accepted")}
        >
          Accept
        </Button>
        <Button
          variant="secondary"
          size="lg"
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
