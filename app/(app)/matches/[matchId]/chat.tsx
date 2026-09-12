"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { apiFetchJson, ApiError } from "@/lib/api-client";
import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface ScheduleSuggestion {
  hasProposal: boolean;
  date: string | null;
  time: string | null;
  court: string | null;
  confidence: number;
}

interface SendResult {
  message: Message;
  scheduleSuggestion: ScheduleSuggestion | null;
}

interface ScheduleResult {
  id: string;
  agreedTime: string;
  agreedLocation: string;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** A suggestion is only confirmable when all three parts are present. */
function isComplete(
  s: ScheduleSuggestion | null
): s is ScheduleSuggestion & { date: string; time: string; court: string } {
  return Boolean(s?.hasProposal && s.date && s.time && s.court);
}

export function Chat({
  matchId,
  currentUserId,
  agreedTime,
  agreedLocation,
  initialMessages,
}: {
  matchId: string;
  currentUserId: string;
  agreedTime: string;
  agreedLocation: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [suggestion, setSuggestion] = useState<ScheduleSuggestion | null>(null);
  // The server handed us the plan as it stands; confirming a new one
  // updates it in place rather than forcing a reload.
  const [plan, setPlan] = useState({ time: agreedTime, location: agreedLocation });
  const listRef = useRef<HTMLDivElement>(null);

  // scrollIntoView breaks scrolling in embedded preview frames — set
  // scrollTop directly instead.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useRealtimeChannel({
    channelName: `messages-${matchId}`,
    table: "messages",
    filter: `confirmed_match_id=eq.${matchId}`,
    onChange: (payload) => {
      const row = payload.new as Message | null;
      if (!row?.id) return;
      setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
    },
  });

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;

    setSending(true);
    try {
      const result = await apiFetchJson<SendResult>(`/api/matches/${matchId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });

      setDraft("");
      setMessages((prev) =>
        prev.some((m) => m.id === result.message.id) ? prev : [...prev, result.message]
      );
      setSuggestion(result.scheduleSuggestion);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't send that. Try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleConfirm() {
    if (!isComplete(suggestion)) return;

    setConfirming(true);
    try {
      const result = await apiFetchJson<ScheduleResult>(`/api/matches/${matchId}/schedule`, {
        method: "PATCH",
        body: JSON.stringify({
          date: suggestion.date,
          time: suggestion.time,
          court: suggestion.court,
        }),
      });

      setPlan({ time: result.agreedTime, location: result.agreedLocation });
      setSuggestion(null);
      toast.success("Locked in.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't confirm that. Try again.");
    } finally {
      setConfirming(false);
    }
  }

  const complete = isComplete(suggestion);

  return (
    <section className="flex min-h-[calc(100dvh-8.5rem)] flex-col py-6">
      <header className="pb-6">
        <Link
          href="/matches"
          className="eyebrow text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          All matches
        </Link>
        <h1 className="title mt-4 text-[clamp(1.75rem,5vw,2.75rem)]">{plan.location}</h1>
        {/* aria-live so a confirmed change is announced, not just repainted. */}
        <p className="eyebrow mt-2 text-[var(--color-primary)]" aria-live="polite">
          {formatWhen(plan.time)}
        </p>
      </header>

      {/*
        role="log" + aria-live: messages arrive over a realtime channel
        with no user action behind them, so without this a screen-reader
        user simply never learns the other person replied.
      */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Messages"
        className="flex-1 overflow-y-auto py-8"
      >
        {messages.length === 0 ? (
          <p className="max-w-[40ch] text-[1.0625rem] leading-[1.5] text-[var(--color-muted-foreground)]">
            You matched. Say hi and sort out exactly when and where.
          </p>
        ) : (
          <ul className="flex flex-col gap-5">
            {messages.map((message) => {
              const mine = message.sender_id === currentUserId;
              return (
                <li
                  key={message.id}
                  className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}
                >
                  <span className="eyebrow text-[var(--color-muted-foreground)]">
                    {mine ? "You" : "Them"} · {formatTime(message.created_at)}
                  </span>
                  <p
                    className={cn(
                      "max-w-[46ch] rounded-[var(--radius-lg)] px-4 py-3 text-[0.9375rem] leading-[1.5]",
                      mine
                        ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                        : "surface"
                    )}
                  >
                    {message.content}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {suggestion?.hasProposal ? (
        <div
          role="status"
          className="surface mb-4 rounded-[var(--radius-lg)] border-2 border-[var(--color-border-strong)] p-4"
        >
          <p className="eyebrow text-[var(--color-primary)]">Detected in that message</p>
          <p className="mt-2 text-[0.9375rem] font-bold">
            {[suggestion.date, suggestion.time, suggestion.court].filter(Boolean).join(" · ")}
          </p>

          {complete ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button size="sm" onClick={handleConfirm} loading={confirming}>
                Confirm this plan
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSuggestion(null)}
                disabled={confirming}
              >
                Not this
              </Button>
            </div>
          ) : (
            /* Partial reads stay read-only: confirming needs a date, a
               time and a court, and guessing the missing one would put a
               plan on the match that neither person agreed to. */
            <p className="ui-text mt-2 text-xs text-[var(--color-muted-foreground)]">
              Say the day, the time and the court in one message and you can confirm it here.
            </p>
          )}
        </div>
      ) : null}

      <form onSubmit={handleSend} className="flex gap-3 pt-5">
        <label htmlFor="chat-message" className="sr-only">
          Message
        </label>
        <input
          id="chat-message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Say when works…"
          autoComplete="off"
          className={cn(
            "h-12 flex-1 rounded-[var(--radius-md)] px-4 text-base",
            "bg-[var(--color-card)] text-[var(--color-foreground)]",
            // The border *is* the affordance here, so it uses the
            // 3:1 token (WCAG 1.4.11), not the decorative one.
            "border-2 border-[var(--color-border-strong)]",
            "transition-colors duration-[var(--dur-base)] ease-[var(--ease-out)]",
            "hover:border-[var(--color-foreground)]",
            "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ring)]",
            "placeholder:text-[var(--color-muted-foreground)]"
          )}
        />
        <Button type="submit" loading={sending} disabled={!draft.trim()}>
          Send
        </Button>
      </form>
    </section>
  );
}
