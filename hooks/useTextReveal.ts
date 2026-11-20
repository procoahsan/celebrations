"use client";
import { type RefObject } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/motion/gsap";
import { useExperience } from "@/lib/store";

export interface TextRevealOptions {
  /** "lines" = masked line rise, "chars" = staggered characters, "words" = masked words. */
  type?: "lines" | "words" | "chars";
  /** Start on scroll (default) or immediately / when `when` becomes true. */
  trigger?: "scroll" | "immediate";
  when?: boolean;
  delay?: number;
  stagger?: number;
  duration?: number;
  start?: string;
  /** Scrub with scroll instead of playing once. */
  scrub?: boolean | number;
}

/**
 * Masked editorial text reveal built on GSAP SplitText (aria-label is applied automatically
 * so screen readers read the original sentence, not fragments). Elements carry data-reveal so they stay
 * hidden until split, avoiding a flash of unanimated text; reduced motion shows them immediately.
 */
export function useTextReveal<T extends HTMLElement>(ref: RefObject<T | null>, options: TextRevealOptions = {}) {
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const { type = "lines", trigger = "scroll", when = true, delay = 0, stagger, duration = 1.25, start = "top 85%", scrub = false } = options;

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion) { el.classList.add("is-split"); gsap.set(el, { autoAlpha: 1 }); return; }
    if (!when) return;
    let split: SplitText | null = null;
    const build = () => {
      split = SplitText.create(el, {
        type: type === "chars" ? "lines,words,chars" : type === "words" ? "lines,words" : "lines",
        mask: type === "lines" ? "lines" : "words",
        linesClass: "split-line",
        autoSplit: true,
        aria: "auto",
        onSplit(self) {
          el.classList.add("is-split");
          const targets = type === "chars" ? self.chars : type === "words" ? self.words : self.lines;
          return gsap.from(targets, {
            yPercent: 118,
            rotate: type === "lines" ? 0 : 4,
            duration,
            delay,
            stagger: stagger ?? (type === "chars" ? 0.022 : type === "words" ? 0.06 : 0.11),
            ease: "expo.out",
            scrollTrigger: trigger === "scroll" ? { trigger: el, start, toggleActions: "play none none none", scrub: scrub || false } : undefined,
          });
        },
      });
    };
    build();
    return () => { split?.revert(); };
  }, { dependencies: [reducedMotion, when, type], scope: ref, revertOnUpdate: true });
}

export { ScrollTrigger };
