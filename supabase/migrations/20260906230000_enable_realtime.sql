-- Enable Postgres change broadcasting for the tables the frontend needs to
-- watch live: a queue entry flipping to 'matched', a proposed match's
-- status changing, new chat messages, and the confirmed match itself
-- getting its schedule finalized. Realtime is a separate opt-in from RLS —
-- a table with RLS enabled still sends zero change events until it's added
-- to this publication. RLS still applies per-subscriber once added.
alter publication supabase_realtime add table
  public.queue_entries,
  public.proposed_matches,
  public.confirmed_matches,
  public.messages;
