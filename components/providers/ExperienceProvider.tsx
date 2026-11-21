"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { detectTier, detectWebGL } from "@/lib/device";
import { scrollState, useExperience } from "@/lib/store";

let lenisInstance: Lenis | null = null;
export const getLenis = () => lenisInstance;

/** Routes where smooth scrolling conflicts with direct manipulation (canvas dragging) or simply isn't wanted. */
const NATIVE_SCROLL = [/^\/design-your-event/, /^\/admin/];

export default function ExperienceProvider() {
  const pathname = usePathname();
  const set = useExperience((s) => s.set);
  const reducedMotion = useExperience((s) => s.reducedMotion);

  // Capability detection, once.
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      set({ reducedMotion: motionQuery.matches });
      document.documentElement.classList.toggle("reduced-motion", motionQuery.matches);
    };
    apply();
    motionQuery.addEventListener("change", apply);
    const webgl = detectWebGL();
    set({ webgl, tier: detectTier(), touch: window.matchMedia("(pointer: coarse)").matches });
    document.documentElement.classList.toggle("no-webgl", !webgl);
    // The branded preloader belongs to a cold homepage visit only.
    if (window.location.pathname !== "/") set({ ready: true });
    return () => motionQuery.removeEventListener("change", apply);
  }, [set]);

  // Lenis smooth scroll wired into GSAP's ticker so ScrollTrigger and Lenis share a single frame.
  const native = NATIVE_SCROLL.some((re) => re.test(pathname));
  useEffect(() => {
    if (native || reducedMotion) return;
    const lenis = new Lenis({ autoRaf: false, lerp: 0.085, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
    lenisInstance = lenis;
    const onScroll = (instance: Lenis) => {
      scrollState.velocity = instance.velocity;
      scrollState.progress = instance.progress;
      ScrollTrigger.update();
    };
    lenis.on("scroll", onScroll);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisInstance = null;
      scrollState.velocity = 0;
    };
  }, [native, reducedMotion]);

  // Native-scroll velocity for WebGL when Lenis is off.
  useEffect(() => {
    if (!native && !reducedMotion) return;
    let last = window.scrollY;
    let raf = 0;
    const loop = () => {
      const y = window.scrollY;
      scrollState.velocity = scrollState.velocity * 0.85 + (y - last) * 0.15;
      last = y;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [native, reducedMotion]);

  // Route change: reset scroll, close menu, refresh triggers once the new page has laid out.
  useEffect(() => {
    set({ menuOpen: false, chapter: null });
    const hash = window.location.hash;
    lenisInstance?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    // Deep links (e.g. /portfolio#archive) land on their section once pins and media have settled;
    // re-aligned a few times because pin spacers and lazy media change the page height while loading.
    let userMoved = false;
    const stop = () => { userMoved = true; };
    if (hash) ["wheel", "touchstart", "keydown"].forEach((e) => window.addEventListener(e, stop, { once: true, passive: true }));
    const jump = () => {
      ScrollTrigger.refresh();
      const target = hash ? document.querySelector<HTMLElement>(hash) : null;
      if (!target || userMoved) return;
      const top = target.getBoundingClientRect().top + window.scrollY;
      if (lenisInstance) lenisInstance.scrollTo(top, { immediate: true, force: true });
      else window.scrollTo(0, top);
    };
    const timers = hash ? [600, 1500, 3000].map((t) => window.setTimeout(jump, t)) : [window.setTimeout(() => ScrollTrigger.refresh(), 120)];
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      ["wheel", "touchstart", "keydown"].forEach((e) => window.removeEventListener(e, stop));
    };
  }, [pathname, set]);

  // Refresh after fonts settle (avoids pin offsets computed with fallback metrics).
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);

  return null;
}
