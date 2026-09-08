import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

/*
 * One grotesque, used at every size — the `pentagram` recipe forbids
 * multiple type families, and Archivo carries the 900 weight the display
 * scale depends on. (Inter / Roboto / system-ui are explicitly ruled out
 * as display faces.)
 */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Cornell Racket Queue",
  description: "Find a Cornell student to play with, right now.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={archivo.variable}>
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
