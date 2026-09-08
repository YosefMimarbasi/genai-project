import { Nav } from "@/components/nav";
import { SiteFooter } from "@/components/site-footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
