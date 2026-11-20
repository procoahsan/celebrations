"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/motion/gsap";
import { useChapter } from "@/hooks/useChapter";
import { useInView } from "@/hooks/useInView";
import { useExperience } from "@/lib/store";
import type { Testimonial } from "@/lib/types";
import RevealText from "@/components/motion/RevealText";
import styles from "./stories.module.css";

/**
 * Scene 07: approved Instagram testimonials only. A featured quote is set large and editorial,
 * with layered cards behind it. Story-style progress bars auto-advance every 4 seconds; they pause while the
 * reader hovers or focuses the quote and while the section is off-screen, and stop for reduced motion.
 * When nothing has been approved yet, an honest invitation to Instagram replaces the section.
 */
export default function StoriesChapter({ testimonials, heading, instagramUrl, photos, chapter = 7 }: { testimonials: Testimonial[]; heading: string; instagramUrl: string; photos: string[]; chapter?: number | null }) {
  const section = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const inView = useInView(section);
  const reduced = useExperience((s) => s.reducedMotion);
  useChapter(section, chapter ?? 0, "Client Stories");
  const n = testimonials.length;
  const current = testimonials[index];

  // The active progress bar's CSS animation is the timer: when it ends, the next review comes in.
  const next = () => setIndex((i) => (i + 1) % n);
  const running = n > 1 && !paused && inView && !reduced;

  useGSAP(() => {
    if (!current || reduced) return;
    const q = gsap.utils.selector(section);
    const split = SplitText.create(q("[data-quote]"), { type: "lines", mask: "lines", aria: "auto" });
    gsap.from(split.lines, { yPercent: 105, duration: 0.9, stagger: 0.05, ease: "expo.out" });
    gsap.from(q("[data-caption] > *"), { autoAlpha: 0, y: 10, duration: 0.7, stagger: 0.06, delay: 0.25 });
    gsap.fromTo(q("[data-photo]"), { clipPath: "inset(100% 0 0 0 round 999px 999px 0 0)", scale: 1.12 }, { clipPath: "inset(0% 0 0 0 round 999px 999px 0 0)", scale: 1, duration: 1.1, ease: "expo.inOut" });
    gsap.fromTo(q("[data-layer]"), { rotate: (i) => (i % 2 ? 4 : -4) * 1.6, y: 30 }, { rotate: (i) => (i % 2 ? 4 : -4), y: 0, duration: 1.4, stagger: 0.05 });
    return () => split.revert();
  }, { dependencies: [index, reduced], scope: section, revertOnUpdate: true });

  if (!n) {
    return (
      <section ref={section} className={`${styles.section} ${styles.empty}`} aria-labelledby="stories-heading">
        <p className="label"><span className="text-gilt">({String(chapter ?? 7).padStart(2, "0")})</span>&nbsp; {heading}</p>
        <RevealText as="h2" id="stories-heading" className={`display ${styles.emptyTitle}`}>Their words, <em>not ours.</em></RevealText>
        <p className={styles.emptyText}>We only publish reviews that clients have shared with us on Instagram and approved for the site. Until the first ones are moderated here, you can read what people say in our comments and tags.</p>
        <a href={instagramUrl} target="_blank" rel="noreferrer" className="btn-portal"><span className="dot" />Read on Instagram</a>
      </section>
    );
  }

  const photo = current.image ?? photos[index % photos.length];
  return (
    <section
      ref={section}
      className={styles.section}
      aria-labelledby="stories-heading"
      aria-roledescription="carousel"
    >
      <div className={styles.head}>
        <h2 id="stories-heading" className="label"><span className="text-gilt">({String(chapter ?? 7).padStart(2, "0")})</span>&nbsp; {heading}</h2>
        <div className={styles.progress} role="tablist" aria-label="Reviews">
          {testimonials.map((t, i) => (
            <button key={t.id} type="button" role="tab" aria-selected={i === index} aria-label={`Review ${i + 1} of ${n}`} onClick={() => setIndex(i)} className={styles.bar}>
              <span
                key={i === index ? `run-${index}` : `idle-${i}`}
                className={i < index ? styles.full : i === index ? (reduced ? styles.full : styles.run) : undefined}
                style={i === index ? { animationPlayState: running ? "running" : "paused" } : undefined}
                onAnimationEnd={i === index ? next : undefined}
              />
            </button>
          ))}
          <span className="label ml-3 text-mist tabular-nums">{String(index + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}{paused ? " · paused" : ""}</span>
        </div>
      </div>
      <div className={styles.grid}>
        <div className={styles.media}>
          <span data-layer className={styles.layer} aria-hidden />
          <span data-layer className={styles.layer} aria-hidden />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img data-photo key={photo} src={photo} alt={current.image ? `Event of ${current.author}` : "The Celebrations setting"} className={styles.photo} />
          {!current.image && <span className="label absolute bottom-3 left-3 text-ivory/70">Portfolio photography</span>}
        </div>
        <figure className={styles.figure} aria-live={paused ? "polite" : "off"} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
          <span className={`display ${styles.mark}`} aria-hidden>“</span>
          <blockquote key={current.id} data-quote className={`display ${styles.quote} ${current.quote.length > 220 ? styles.long : ""}`}>{current.quote}</blockquote>
          <figcaption className={styles.caption} data-caption>
            {current.rating ? <span className="text-lg tracking-[0.2em] text-gilt" aria-label={`${current.rating} out of 5 stars`}>{"★".repeat(current.rating)}</span> : null}
            <span className="label">{current.author}{current.eventType ? ` · ${current.eventType}` : ""}</span>
            {current.sourceUrl && <a href={current.sourceUrl} target="_blank" rel="noreferrer" className="label text-gilt underline-offset-4 hover:underline">{current.sourceUrl.includes("/highlights/") ? "From our Client Reviews highlight ↗" : "View on Instagram ↗"}</a>}
          </figcaption>
          {n > 1 && (
            <div className={styles.controls}>
              <button type="button" onClick={() => setIndex((index - 1 + n) % n)} aria-label="Previous review">←</button>
              <button type="button" onClick={() => setIndex((index + 1) % n)} aria-label="Next review">→</button>
            </div>
          )}
        </figure>
      </div>
    </section>
  );
}
