"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/motion/gsap";
import { useExperience } from "@/lib/store";

/**
 * Branded preloader: shown only on a first, cold visit to the homepage and only while the hero's
 * critical assets (fonts, first frames of the portal videos) load, capped at a few seconds.
 * The arch outline draws with real load progress.
 */
export default function Preloader({ critical }: { critical: string[] }) {
  const root = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);
  const set = useExperience((s) => s.set);

  useEffect(() => {
    if (useExperience.getState().ready) { setDone(true); return; }
    window.scrollTo(0, 0);
    document.documentElement.style.overflow = "hidden";
    const unlock = useExperience.subscribe((s) => { if (s.ready) { document.documentElement.style.overflow = ""; window.dispatchEvent(new Event("resize")); } });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shown = { value: 0 };
    let loaded = 0;
    const total = critical.length + 1;
    const length = path.current?.getTotalLength() ?? 1000;
    if (path.current) gsap.set(path.current, { strokeDasharray: length, strokeDashoffset: length });

    const render = () => {
      if (counter.current) counter.current.textContent = String(Math.round(shown.value * 100)).padStart(3, "0");
      if (path.current) path.current.style.strokeDashoffset = String(length * (1 - shown.value));
    };
    const bump = () => {
      loaded += 1;
      gsap.to(shown, { value: loaded / total, duration: 0.6, ease: "power2.out", onUpdate: render, onComplete: () => { if (loaded >= total) finish(); } });
    };

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      gsap.to(shown, { value: 1, duration: 0.3, onUpdate: render });
      const tl = gsap.timeline({ delay: 0.25, onComplete: () => setDone(true) });
      tl.add(() => set({ ready: true }), reduced ? 0 : 0.55);
      if (reduced) { tl.to(root.current, { autoAlpha: 0, duration: 0.3 }); return; }
      tl.to("[data-pre-word]", { yPercent: -110, duration: 0.8, ease: "power3.in", stagger: 0.04 }, 0)
        .to(path.current, { scale: 7, transformOrigin: "50% 60%", opacity: 0, duration: 1.4, ease: "expo.in" }, 0.05)
        .to(root.current, { clipPath: "inset(0% 0% 100% 0% round 0 0 50% 50%)", duration: 1.2, ease: "curtain" }, 0.45);
    };

    // Fonts
    (document.fonts?.ready ?? Promise.resolve()).then(bump);
    // Video first frames / images
    const media = critical.map((src) => new Promise<void>((resolve) => {
      if (src.endsWith(".mp4")) {
        const v = document.createElement("video");
        v.muted = true; v.preload = "auto"; v.src = src;
        const ok = () => { resolve(); v.removeAttribute("src"); v.load(); };
        v.addEventListener("loadeddata", ok, { once: true });
        v.addEventListener("error", ok, { once: true });
      } else {
        const img = new Image();
        img.onload = img.onerror = () => resolve();
        img.src = src;
      }
    }).then(bump));
    const cap = window.setTimeout(finish, 4200);
    Promise.all(media).then(() => window.clearTimeout(cap));
    return () => { window.clearTimeout(cap); unlock(); document.documentElement.style.overflow = ""; };
  }, [critical, set]);

  if (done) return null;
  return (
    <div ref={root} className="fixed inset-0 z-[95] grid place-items-center bg-nocturne text-ivory" role="status" aria-label="Loading The Celebrations">
      <svg viewBox="0 0 200 300" className="absolute h-[52vh] w-auto text-gilt" aria-hidden>
        <path ref={path} d="M10 300 V100 A90 90 0 0 1 190 100 V300" fill="none" stroke="currentColor" strokeWidth="0.8" />
      </svg>
      <div className="relative flex flex-col items-center gap-5">
        <div className="overflow-hidden"><p data-pre-word className="display text-[clamp(2.6rem,7vw,5.5rem)]"><em className="text-gilt">The</em> Celebrations</p></div>
        <div className="overflow-hidden"><p data-pre-word className="label flex items-center gap-3 text-gilt"><span>Event design</span><span className="h-px w-10 bg-gilt/50" /><span ref={counter} className="tabular-nums">000</span></p></div>
      </div>
    </div>
  );
}
