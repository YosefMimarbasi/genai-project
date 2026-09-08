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
    <section className="py-6">
      <h1 className="display -ml-[0.03em] text-[clamp(2.75rem,8vw,6rem)]">Matches.</h1>

      {matches && matches.length > 0 ? (
        <ul className="mt-12">
          {matches.map((match) => (
            <li key={match.id}>
              <Link
                href={`/matches/${match.id}`}
                className="group grid items-baseline gap-2 py-6 transition-colors duration-150  sm:grid-cols-[1fr_auto] sm:gap-6"
              >
                <span className="text-lg font-bold tracking-[-0.015em] group-hover:text-[var(--color-accent)]">
                  {match.agreed_location}
                </span>
                <span className="label text-[var(--color-gray)]">
                  {formatWhen(match.agreed_time)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-12 pt-10">
          <p className="max-w-[42ch] text-[1.0625rem] leading-[1.5] text-[var(--color-gray)]">
            No confirmed matches yet. Ready up and you'll see them here once both of you accept.
          </p>
          <Link href="/play">
            <Button size="lg" className="mt-8">
              Ready up
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
}
