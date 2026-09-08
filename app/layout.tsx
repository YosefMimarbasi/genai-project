import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/toaster";
import "./globals.css";

/*
 * Stand-ins for Cornell's licensed Freight families (see the note in
 * globals.css). Source Sans 3 and Source Serif 4 are a matched pair filling
 * the same humanist-sans / contemporary-serif roles. Palatino is a system
 * font and needs no loading.
 */
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  weight: ["400", "600", "700"],
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Cornell Racket Queue",
  description: "Find a Cornell student to play with, right now.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning is required by next-themes: it writes the
    // theme class onto <html> before paint (which is what prevents the
    // flash), so the server and client markup legitimately differ here.
    <html
      lang="en"
      className={`${sourceSans.variable} ${sourceSerif.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
