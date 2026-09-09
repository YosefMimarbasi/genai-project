import type { Metadata } from "next";
import { EB_Garamond, Crimson_Text } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/toaster";
import "./globals.css";

/*
 * Pairing comes from the skill's typography reasoning for a university
 * product: EB Garamond for headings, Crimson Text for body — "academic,
 * old-school, university, research".
 *
 * display: swap on both, so text is never invisible while the face loads
 * (§3 font-loading / FOIT).
 */
const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const crimson = Crimson_Text({
  subsets: ["latin"],
  variable: "--font-crimson",
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cornell Racket Queue",
  description: "Find a Cornell student to play with, right now.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // Deliberately no maximum-scale / user-scalable=no — pinch zoom must
  // never be disabled (§5 viewport-meta).
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning is required by next-themes: it stamps the
    // theme class onto <html> before paint, so server and client markup
    // legitimately differ here.
    <html
      lang="en"
      className={`${ebGaramond.variable} ${crimson.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {/* Skip link: first tab stop, visible only when focused (§1). */}
          <a
            href="#main"
            className="ui-text sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1000] focus:rounded-[var(--radius-md)] focus:bg-[var(--color-primary)] focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-[var(--color-on-primary)]"
          >
            Skip to main content
          </a>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
