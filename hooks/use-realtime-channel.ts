"use client";

import { useEffect, useRef } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";

interface UseRealtimeChannelOptions {
  /** Unique per-subscription name, e.g. `queue-entry-${entryId}`. */
  channelName: string;
  table: string;
  schema?: string;
  /** PostgREST-style filter, e.g. `id=eq.${entryId}`. */
  filter?: string;
  onChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  /** Set false to skip subscribing (e.g. while an id isn't known yet). */
  enabled?: boolean;
}

/**
 * Subscribes to Postgres change events on one table for the lifetime of
 * the component, and cleans up on unmount. Requires the table to be added
 * to the `supabase_realtime` publication (see
 * supabase/migrations/20260906230000_enable_realtime.sql) — RLS still
 * applies per-subscriber on top of that.
 *
 * The callback is stored in a ref so passing a new inline function each
 * render doesn't resubscribe the channel.
 */
export function useRealtimeChannel({
  channelName,
  table,
  schema = "public",
  filter,
  onChange,
  enabled = true,
}: UseRealtimeChannelOptions) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!enabled) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema, table, filter },
        (payload) => onChangeRef.current(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, table, schema, filter, enabled]);
}
