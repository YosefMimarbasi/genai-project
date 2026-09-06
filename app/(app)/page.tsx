import Link from "next/link";
import { Card } from "@/components/ui/card";

const SECTIONS = [
  {
    href: "/play",
    title: "Play",
    description: "Ready up and get matched with someone to play right now.",
  },
  {
    href: "/matches",
    title: "Matches",
    description: "Chat with a confirmed match and lock in a time and place.",
  },
  {
    href: "/profile",
    title: "Profile",
    description: "Set your sports and skill level.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {SECTIONS.map((section) => (
        <Link key={section.href} href={section.href} className="group">
          <Card className="h-full transition-[border-color,transform] duration-150 ease-[var(--ease-out-strong)] group-hover:border-[var(--color-accent)] group-active:scale-[0.98]">
            <h2 className="font-medium">{section.title}</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{section.description}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
