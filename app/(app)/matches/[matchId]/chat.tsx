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
  const [suggestion, setSuggestion] = useState<ScheduleSuggestion | null>(null);
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

  return (
    <section className="flex min-h-[calc(100dvh-8.5rem)] flex-col py-6">
      <header className="pb-6">
        <Link href="/matches" className="label text-[var(--color-gray)] hover:text-[var(--color-ink)]">
          All matches
        </Link>
        <h1 className="display-sm mt-4 text-[clamp(1.75rem,5vw,2.75rem)]">{agreedLocation}</h1>
        <p className="label mt-2 text-[var(--color-accent)]">{formatWhen(agreedTime)}</p>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto py-8">
        {messages.length === 0 ? (
          <p className="max-w-[40ch] text-[1.0625rem] leading-[1.5] text-[var(--color-gray)]">
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
                  <span className="label text-[var(--color-gray)]">
                    {mine ? "You" : "Them"} · {formatTime(message.created_at)}
                  </span>
                  <p
                    className={cn(
                      "max-w-[46ch] rounded-[var(--radius-lg)] px-4 py-3 text-[0.9375rem] leading-[1.5]",
                      mine
                        ? "bg-[var(--color-accent)] text-white shadow-[3px_3px_7px_var(--neu-dark),-3px_-3px_7px_var(--neu-light)]"
                        : "neu-raised-sm"
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
        <div className="neu-raised mb-4 rounded-[var(--radius-lg)] p-4">
          <p className="label text-[var(--color-accent)]">Detected in that message</p>
          <p className="mt-2 text-[0.9375rem] font-bold">
            {[suggestion.date, suggestion.time, suggestion.court].filter(Boolean).join(" · ")}
          </p>
          {/*
            Honest placeholder, not a fake control: confirming a suggestion
            needs PATCH /api/matches/[matchId]/schedule, which doesn't exist
            yet (see docs/frontend-build-prompt.md). A button that 404s
            would be worse than saying so.
          */}
          <p className="mt-2 text-xs text-[var(--color-gray)]">
            Confirming this into the match isn't wired up yet; the backend route is still to be
            built. For now, agree in the thread.
          </p>
        </div>
      ) : null}

      <form onSubmit={handleSend} className="flex gap-3 pt-5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Say when works…"
          aria-label="Message"
          className={cn(
            "neu-pressed h-12 flex-1 rounded-[var(--radius-md)] px-4 text-sm text-[var(--color-ink)]",
            "outline-none transition-shadow duration-150 ease-[var(--ease-out-strong)]",
            "focus:ring-2 focus:ring-[var(--color-accent)]",
            "placeholder:text-[color-mix(in_oklab,var(--color-gray)_70%,transparent)]"
          )}
        />
        <Button type="submit" loading={sending} disabled={!draft.trim()}>
          Send
        </Button>
      </form>
    </section>
  );
}
