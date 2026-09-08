import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { Chat } from "./chat";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // RLS scopes this to participants, so a non-participant gets no row and
  // lands on the same 404 as a match that doesn't exist — which is the
  // right answer either way: it doesn't leak that the match exists.
  const { data: match } = await supabase
    .from("confirmed_matches")
    .select("id, agreed_time, agreed_location")
    .eq("id", matchId)
    .single();

  if (!match) {
    notFound();
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at")
    .eq("confirmed_match_id", matchId)
    .order("created_at", { ascending: true });

  return (
    <Chat
      matchId={match.id}
      currentUserId={user.id}
      agreedTime={match.agreed_time}
      agreedLocation={match.agreed_location}
      initialMessages={messages ?? []}
    />
  );
}
