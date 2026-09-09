"use client";

import { useEffect, useRef, type ReactNode } from "react";

/*
 * Motion-Driven scroll entrance, per the style's spec: IntersectionObserver
 * rather than a scroll listener, transform/opacity only, GPU friendly.
 *
 * Progressive-enhancement order matters here. The element renders visible;
 * this component only *arms* it (adding [data-armed], which hides it) once
 * JS has run and an observer is attached. If the script never loads, or the
 * observer is unsupported, the content simply stays visible instead of
 * being stranded at opacity 0 — a common way scroll-reveal breaks a page.
 *
 * §7 stagger-sequence — index drives a 30-50ms cascade, capped so a long
 * list never leaves the last item waiting.
 */
export function Reveal({
  children,
  index = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  index?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Users who asked for less motion get the content immediately.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") return;

    el.dataset.armed = "";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.visible = "";
            observer.unobserve(entry.target); // reveal once, not on every pass
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      data-reveal=""
      className={className}
      style={{ transitionDelay: `${Math.min(index, 6) * 45}ms` }}
    >
      {children}
    </Tag>
  );
}
