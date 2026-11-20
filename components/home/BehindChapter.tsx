"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { useChapter } from "@/hooks/useChapter";
import { useInView } from "@/hooks/useInView";
import { useExperience } from "@/lib/store";
import type { MediaItem } from "@/lib/types";
import styles from "./behind.module.css";

interface Step { key: string; word: string; line: string; media: MediaItem }

/**
 * Scene 06: four pinned chapters (Imagine, Create, Transform, Celebrate) built from the business's own
 * setup footage. Scroll moves the arched frame across the stage, reveals each next video through an
 * arch-shaped mask, swaps the giant word, and finally opens the last video to a full-screen reveal.
 */
export default function BehindChapter({ steps, heading, chapter = 6 }: { steps: Step[]; heading: string; chapter?: number }) {
  const section = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [step, setStep] = useState(0);
  const inView = useInView(section);
  const reduced = useExperience((s) => s.reducedMotion);
  useChapter(section, chapter, "Behind the Magic");

  // Only the active chapter's video decodes.
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (inView && i === step) v.play().catch(() => {}); else v.pause();
    });
  }, [step, inView]);

  useGSAP(() => {
    if (!section.current) return;
    const q = gsap.utils.selector(section);
    if (reduced) return;
    const mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)" }, (ctx) => {
      const { desktop } = ctx.conditions as { desktop: boolean };
      // Frame positions per chapter (xPercent of the viewport) for an asymmetric, travelling composition.
      const xs = desktop ? [-24, 0, 22, 0] : [0, 0, 0, 0];
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: `+=${steps.length * 100}%`,
          pin: true,
          scrub: 0.6,
          onUpdate: (self) => setStep(Math.min(steps.length - 1, Math.floor(self.progress * steps.length * 0.999))),
        },
      });
      tl.set(q("[data-frame]"), { xPercent: xs[0] });
      steps.forEach((_, i) => {
        if (i === 0) return;
        const at = i - 0.5;
        tl.to(q("[data-frame]"), { xPercent: xs[i], rotate: i % 2 ? -1.5 : 1.5, duration: 0.6 }, at - 0.1)
          .fromTo(q(`[data-clip='${i}']`), { clipPath: "inset(100% 0% 0% 0% round 999px 999px 0 0)" }, { clipPath: "inset(0% 0% 0% 0% round 999px 999px 0 0)", duration: 0.6 }, at)
          .to(q(`[data-clip='${i - 1}'] video`), { scale: 1.15, filter: "brightness(0.5)", duration: 0.6 }, at)
          .to(q(`[data-word='${i - 1}']`), { yPercent: -100, duration: 0.45 }, at)
          .fromTo(q(`[data-word='${i}']`), { yPercent: 100 }, { yPercent: 0, duration: 0.45 }, at + 0.1)
          .to(q(`[data-line='${i - 1}']`), { autoAlpha: 0, y: -12, duration: 0.25 }, at)
          .fromTo(q(`[data-line='${i}']`), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.3 }, at + 0.25);
      });
      // Final full-screen reveal of the finished setting.
      tl.to(q("[data-frame]"), { width: "100vw", height: "100svh", xPercent: 0, rotate: 0, borderRadius: 0, duration: 0.7, ease: "power3.inOut" }, steps.length - 0.75)
        .to(q("[data-frame] [data-clip]"), { borderRadius: 0, clipPath: "inset(0% 0% 0% 0% round 0px 0px 0 0)", duration: 0.5 }, "<")
        .to(q("[data-words]"), { autoAlpha: 0.0, duration: 0.3 }, "<")
        .fromTo(q("[data-reveal-shade]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, ">-0.15")
        .fromTo(q("[data-reveal-title]"), { autoAlpha: 0, yPercent: 30 }, { autoAlpha: 1, yPercent: 0, duration: 0.3 }, "<");
    });
    return () => mm.revert();
  }, { dependencies: [reduced, steps.length], scope: section });

  return (
    <section ref={section} className={styles.section} aria-labelledby="behind-heading">
      <div className={styles.top}>
        <h2 id="behind-heading" className="label"><span className="text-gilt">({String(chapter).padStart(2, "0")})</span>&nbsp; {heading}</h2>
        <ol className={styles.steps} aria-label="Chapters">
          {steps.map((s, i) => <li key={s.key} className={i === step ? styles.on : undefined} aria-current={i === step ? "step" : undefined}><span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span> {s.word}</li>)}
        </ol>
      </div>

      <div className={styles.words} data-words aria-hidden>
        {steps.map((s, i) => <span key={s.key} className={styles.wordMask}><span data-word={i} className={`display ${styles.word}`} style={i === 0 || reduced ? undefined : { transform: "translateY(100%)" }}>{s.word}</span></span>)}
      </div>

      <div className={styles.frame} data-frame>
        {steps.map((s, i) => (
          <div key={s.key} data-clip={i} className={styles.clip} style={i === 0 || reduced ? undefined : { clipPath: "inset(100% 0% 0% 0% round 999px 999px 0 0)" }}>
            <video ref={(el) => { videos.current[i] = el; }} src={s.media.src} poster={s.media.poster} muted loop playsInline preload={i === 0 ? "auto" : "metadata"} aria-label={s.media.alt} />
          </div>
        ))}
      </div>

      <div className={styles.scrim} aria-hidden />
      <div className={styles.revealShade} data-reveal-shade aria-hidden />
      <div className={`legible ${styles.lines}`}>
        {steps.map((s, i) => <p key={s.key} data-line={i} className={styles.line} style={i === 0 || reduced ? undefined : { opacity: 0, visibility: "hidden" }}>{s.line}</p>)}
      </div>

      <p className={`display ${styles.revealTitle}`} data-reveal-title aria-hidden>And then, <em>the doors open.</em></p>
    </section>
  );
}
