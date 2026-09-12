"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/*
 * Route-segment error boundary. Without this file, an unhandled render
 * error anywhere under app/ falls through to Next's built-in screen,
 * which in production is a bare "Application error: a client-side
 * exception has occurred" with no way back into the app.
 *
 * The real message is deliberately not shown. It can contain a Supabase
 * error string or a column name, and the person reading it can do nothing
 * with either. It goes to the console for whoever is debugging, and the
 * digest — which is the id that ties this render to the server log — is
 * shown, because that is the one thing worth quoting in a bug report.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60dvh] max-w-2xl flex-col items-start justify-center px-5">
      <p className="eyebrow text-[var(--color-primary)]">Something broke</p>
      <h1 className="display mt-5 text-[clamp(2rem,6vw,3.5rem)]">That didn&apos;t load.</h1>
      <p className="mt-5 max-w-[46ch] text-lg text-[var(--color-muted-foreground)]">
        The page hit an error on its way in. Trying again usually works; if it doesn&apos;t, the
        rest of the app is still fine.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/play">
          <Button variant="secondary">Go to the queue</Button>
        </Link>
      </div>

      {error.digest ? (
        <p className="ui-text tnum mt-8 text-xs text-[var(--color-muted-foreground)]">
          Reference: {error.digest}
        </p>
      ) : null}
    </main>
  );
}
