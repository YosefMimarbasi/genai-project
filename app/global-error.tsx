"use client";

import { useEffect } from "react";

/*
 * The last line of defence: this catches errors thrown by the root layout
 * itself, which app/error.tsx cannot, because that boundary lives inside
 * the layout it would need to render.
 *
 * It replaces the whole document, so it has to supply its own <html> and
 * <body> — and it cannot rely on globals.css having loaded or on any
 * component in this repo, since a failure in the layout may be exactly
 * why we are here. Every style below is therefore inline and every colour
 * is a literal. The contrast is still checked: #16150f on #eae4d8 is
 * 14.45:1, the same pairing the design system uses.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#eae4d8",
          color: "#16150f",
          fontFamily: "Palatino, 'Palatino Linotype', Georgia, serif",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "34rem" }}>
          <h1 style={{ fontSize: "clamp(1.75rem, 6vw, 2.75rem)", lineHeight: 1.1, margin: 0 }}>
            Cornell Racket Queue is down.
          </h1>
          <p style={{ fontSize: "1.0625rem", lineHeight: 1.6, marginTop: "1rem" }}>
            Something failed before the page could start. Reloading is worth a try.
          </p>
          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: "1.5rem",
              minHeight: "44px",
              lineHeight: "44px",
              padding: "0 1.5rem",
              borderRadius: "1rem",
              background: "#b31b1b",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Reload
          </a>
          {error.digest ? (
            <p style={{ fontSize: "0.75rem", marginTop: "2rem", color: "#484338" }}>
              Reference: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
