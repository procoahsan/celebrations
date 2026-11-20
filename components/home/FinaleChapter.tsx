"use client";
import { useEffect, useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/motion/gsap";
import { useChapter } from "@/hooks/useChapter";
import { useInView } from "@/hooks/useInView";
import { useExperience } from "@/lib/store";
import type { MediaItem } from "@/lib/types";
import TransitionLink from "@/components/chrome/TransitionLink";
import styles from "./finale.module.css";

/** Scene 08: a small arch opens into a full-bleed candlelit curtain; the closing invitation rises through it. */
export default function FinaleChapter({ title, media, instagramUrl, chapter = 8 }: { title: string; media: MediaItem; instagramUrl: string; chapter?: number | null }) {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const inView = useInView(section);
  const reduced = useExperience((s) => s.reducedMotion);
  useChapter(section, chapter ?? 0, "The Invitation");

  useEffect(() => {
    if (!video.current) return;
    if (inView) video.current.play().catch(() => {}); else video.current.pause();
  }, [inView]);

  useGSAP(() => {
    if (!section.current || reduced) return;
    const q = gsap.utils.selector(section);
    const split = SplitText.create(q("[data-finale-title]"), { type: "words,lines", mask: "lines", aria: "auto" });
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: section.current, start: "top top", end: "+=140%", pin: true, scrub: 0.5 },
    });
    tl.fromTo(q("[data-finale-media]"), { clipPath: "inset(22% 41% 22% 41% round 999px 999px 0 0)" }, { clipPath: "inset(0% 0% 0% 0% round 0px 0px 0 0)", duration: 0.55, ease: "power2.inOut" }, 0)
      .fromTo(q("[data-finale-media] video"), { scale: 1.4 }, { scale: 1, duration: 0.6 }, 0)
      .fromTo(q("[data-finale-pre]"), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.15 }, 0)
      .from(split.lines, { yPercent: 110, stagger: 0.06, duration: 0.25, ease: "power3.out" }, 0.45)
      .from(q("[data-finale-cta]"), { autoAlpha: 0, y: 24, stagger: 0.05, duration: 0.15 }, 0.7)
      .from(q("[data-finale-foot]"), { autoAlpha: 0, duration: 0.12 }, 0.85);
    return () => split.revert();
  }, { dependencies: [reduced], scope: section });

  return (
    <section ref={section} className={styles.section} aria-labelledby="finale-title">
      <p className={`label ${styles.pre}`} data-finale-pre><span className="text-gilt">({String(chapter ?? 8).padStart(2, "0")})</span>&nbsp; The Invitation</p>
      <div className={styles.media} data-finale-media>
        <video ref={video} src={media.src} poster={media.poster} muted loop playsInline preload="metadata" aria-label={media.alt} />
        <div className={styles.shade} aria-hidden />
      </div>
      <div className={styles.content}>
        <h2 id="finale-title" data-finale-title className={`display ${styles.title}`}>{title}</h2>
        <div className={styles.ctas}>
          <TransitionLink data-finale-cta href="/design-your-event" curtainLabel="Studio" className="btn-portal solid"><span className="dot" />Design Your Event</TransitionLink>
          <TransitionLink data-finale-cta href="/book-a-call" curtainLabel="Consultation" className="btn-portal">Book a Consultation</TransitionLink>
        </div>
      </div>
      <footer className={styles.foot} data-finale-foot>
        <span className="display text-xl"><em className="text-gilt">The</em> Celebrations</span>
        <nav aria-label="Footer" className={styles.footNav}>
          <TransitionLink href="/portfolio">Portfolio</TransitionLink>
          <TransitionLink href="/services">The Art</TransitionLink>
          <TransitionLink href="/reviews">Stories</TransitionLink>
          <TransitionLink href="/contact">Contact</TransitionLink>
          <a href={instagramUrl} target="_blank" rel="noreferrer">Instagram ↗</a>
        </nav>
        <span className="label text-mist">© {new Date().getFullYear()} The Celebrations</span>
      </footer>
    </section>
  );
}
