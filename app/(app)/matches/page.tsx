import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { Button } from "@/components/ui/button";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function MatchesPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // RLS (confirmed_matches_select_participant) already scopes this to the
  // two linked users — no explicit user filter needed here.
  const { data: matches } = await supabase
    .from("confirmed_matches")
    .select("id, agreed_time, agreed_location")
    .order("agreed_time", { ascending: true });

  return (
    <section>
      <h1 className="display text-[clamp(2.25rem,7vw,4rem)]">Matches</h1>

      {matches && matches.length > 0 ? (
        <ul className="mt-10 flex flex-col gap-3">
          {matches.map((match) => (
            <li key={match.id}>
              <Link
                href={`/matches/${match.id}`}
                className="surface group flex min-h-16 flex-wrap items-center justify-between gap-3 p-5 shadow-[var(--shadow-1)] transition-[box-shadow,border-color] duration-[var(--dur-base)] ease-[var(--ease-out)] hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-2)]"
              >
                <span className="title text-lg group-hover:text-[var(--color-primary)]">
                  {match.agreed_location}
                </span>
                <span className="ui-text tnum text-sm text-[var(--color-muted-foreground)]">
                  {formatWhen(match.agreed_time)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        /* §8 empty-states — say what's missing and give the action. */
        <div className="surface mt-10 flex flex-col items-start p-8">
          <h2 className="title text-xl">No confirmed matches yet</h2>
          <p className="mt-2 max-w-[46ch] text-[var(--color-muted-foreground)]">
            Ready up and you'll see them here once both of you accept.
          </p>
          <Link href="/play" className="mt-6">
            <Button size="lg">Ready up</Button>
          </Link>
        </div>
      )}
    </section>
  );
}
