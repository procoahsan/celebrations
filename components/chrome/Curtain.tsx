"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "@/lib/motion/gsap";
import { useExperience } from "@/lib/store";

type Navigate = (href: string, label?: string) => void;
let navigateImpl: Navigate | null = null;
/** Navigate with the velvet curtain transition (falls back to a normal push). */
export const transitionTo: Navigate = (href, label) => {
  if (navigateImpl) navigateImpl(href, label);
  else window.location.assign(href);
};

/**
 * Page transition: an arch-topped velvet curtain rises over the page, the route changes underneath,
 * and the curtain lifts away. Works with Next's router; back/forward navigation skips the cover phase
 * and simply receives the page's own entrance. Focus moves to <main> afterwards.
 */
export default function Curtain() {
  const router = useRouter();
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLParagraphElement>(null);
  const pending = useRef<string | null>(null);
  const set = useExperience((s) => s.set);

  useEffect(() => {
    navigateImpl = (href, label) => {
      const url = new URL(href, window.location.href);
      const { reducedMotion, curtain } = useExperience.getState();
      if (curtain !== "idle") return;
      if (url.pathname === window.location.pathname) {
        if (url.hash) document.querySelector(url.hash)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
        set({ menuOpen: false });
        return;
      }
      if (reducedMotion || !panel.current) { router.push(url.pathname + url.search + url.hash); return; }
      pending.current = url.pathname;
      if (word.current) word.current.textContent = label ?? "";
      set({ curtain: "covering" });
      router.prefetch(url.pathname);
      gsap.timeline({ defaults: { ease: "curtain" } })
        .set(panel.current, { yPercent: 100, visibility: "visible", "--arch": "100%" })
        .to(panel.current, { yPercent: 0, duration: 0.9 })
        .to(panel.current, { "--arch": "0%", duration: 0.9 }, "<")
        .fromTo(word.current, { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: "expo.out" }, "-=0.45")
        .add(() => {
          set({ curtain: "covered" });
          router.push(url.pathname + url.search + url.hash, { scroll: false });
        });
    };
    return () => { navigateImpl = null; };
  }, [router, set]);

  // Reveal once the new route is mounted.
  useEffect(() => {
    if (!pending.current || pending.current !== pathname) return;
    pending.current = null;
    const id = window.setTimeout(() => {
      set({ curtain: "revealing" });
      gsap.timeline({ defaults: { ease: "curtain" } })
        .to(word.current, { yPercent: -110, duration: 0.5, ease: "power3.in" })
        .to(panel.current, { yPercent: -100, duration: 1, "--arch": "0%" }, "-=0.15")
        .set(panel.current, { visibility: "hidden" })
        .add(() => {
          set({ curtain: "idle" });
          const main = document.getElementById("main");
          main?.focus({ preventScroll: true });
        });
      window.dispatchEvent(new CustomEvent("c06:page-revealed"));
    }, 160);
    return () => window.clearTimeout(id);
  }, [pathname, set]);

  return (
    <div
      ref={panel}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[90] grid place-items-center bg-velvet"
      style={{ visibility: "hidden", clipPath: "inset(0 round var(--arch, 0%) var(--arch, 0%) 0 0 / var(--arch, 0%) var(--arch, 0%) 0 0)", ["--arch" as string]: "100%" }}
    >
      <div className="overflow-hidden">
        <p ref={word} className="display text-[clamp(3rem,9vw,8rem)] italic text-ivory" />
      </div>
      <span className="label absolute bottom-8 left-1/2 -translate-x-1/2 text-gilt">The Celebrations</span>
    </div>
  );
}
