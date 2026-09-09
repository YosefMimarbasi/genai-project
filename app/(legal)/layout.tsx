import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/*
 * Legal pages are public: someone must be able to read the privacy policy
 * before deciding to hand over an email address, which is exactly the point
 * at which it has to be reachable.
 *
 * §9 navigation-consistency — same header as the landing page, same place.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 py-14">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
