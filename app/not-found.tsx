import Link from "next/link";
import { Button } from "@/components/ui/button";

/*
 * A 404 that stays inside the app. notFound() is called deliberately in
 * app/(app)/matches/[matchId]/page.tsx when a match row comes back empty,
 * which is also what a non-participant gets — so this page is on the path
 * someone hits by mistyping a URL *and* the path someone hits by probing
 * for a match that isn't theirs. It says the same thing to both, and in
 * particular never confirms that the id exists.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60dvh] max-w-2xl flex-col items-start justify-center px-5">
      <p className="eyebrow tnum text-[var(--color-primary)]">404</p>
      <h1 className="display mt-5 text-[clamp(2rem,6vw,3.5rem)]">Nothing here.</h1>
      <p className="mt-5 max-w-[46ch] text-lg text-[var(--color-muted-foreground)]">
        That page doesn&apos;t exist, or it isn&apos;t yours to see.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/play">
          <Button>Find a game</Button>
        </Link>
        <Link href="/">
          <Button variant="secondary">Back to the start</Button>
        </Link>
      </div>
    </main>
  );
}
