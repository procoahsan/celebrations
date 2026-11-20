"use client";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/motion/gsap";
import { useChapter } from "@/hooks/useChapter";
import { useExperience } from "@/lib/store";
import type { CelebrationCategory } from "@/lib/types";
import ExperienceCanvas from "@/components/webgl/ExperienceCanvas";
import { getLenis } from "@/components/providers/ExperienceProvider";
import styles from "./art.module.css";

const MorphPlane = dynamic(() => import("@/components/webgl/scenes/MorphPlane"), { ssr: false });

function MorphFallback({ images, index }: { images: string[]; index: number }) {
  return (
    <div className={styles.fallback}>
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt="" style={{ opacity: i === index ? 1 : 0, transform: i === index ? "scale(1)" : "scale(1.08)" }} />
      ))}
    </div>
  );
}

/**
 * Scene 04: a pinned sequence through admin-managed celebration categories. Each step dissolves the
 * arch image with the noise shader, shifts the chapter's atmosphere colour, and re-sets the type.
 */
export default function ArtChapter({ categories, heading, chapter = 4 }: { categories: CelebrationCategory[]; heading: string; chapter?: number }) {
  const section = useRef<HTMLElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const [index, setIndex] = useState(0);
  const reduced = useExperience((s) => s.reducedMotion);
  useChapter(section, chapter, "The Art of Celebration");
  const n = categories.length;
  const current = categories[index];
  const images = categories.map((c) => c.image);

  useGSAP(() => {
    if (!section.current) return;
    trigger.current = ScrollTrigger.create({
      trigger: section.current,
      start: "top top",
      end: () => `+=${n * window.innerHeight * 0.8}`,
      pin: true,
      scrub: true,
      snap: reduced ? undefined : { snapTo: (v) => Math.round(v * (n - 1)) / (n - 1), duration: { min: 0.3, max: 0.8 }, delay: 0.1 },
      onUpdate: (self) => setIndex(Math.min(n - 1, Math.round(self.progress * (n - 1)))),
    });
    // Entrance of the chapter frame.
    if (!reduced) {
      gsap.from("[data-art-frame]", { clipPath: "inset(100% 0% 0% 0% round 999px 999px 0 0)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: section.current, start: "top 70%" } });
    }
  }, { dependencies: [n, reduced], scope: section });

  // Each category change is one composed timeline: atmosphere, numeral, name, line, description.
  useGSAP(() => {
    if (!section.current || !current) return;
    gsap.to(section.current, { backgroundColor: current.tone, duration: 1.2, ease: "power2.inOut", overwrite: "auto" });
    gsap.to(gsap.utils.selector(section)("[data-accent]"), { color: current.accent, duration: 1.2, overwrite: "auto" });
  }, { dependencies: [index], scope: section });

  useGSAP(() => {
    if (!section.current || !current) return;
    const q = gsap.utils.selector(section);
    if (reduced) return;
    const name = SplitText.create(q("[data-art-name]"), { type: "words,chars", mask: "chars", aria: "auto" });
    const tl = gsap.timeline();
    tl.from(name.chars, { yPercent: 120, rotate: 5, duration: 1.2, stagger: 0.025, ease: "expo.out" })
      .from(q("[data-art-num]"), { yPercent: 100, duration: 1, ease: "expo.out" }, 0)
      .from(q("[data-art-line]"), { autoAlpha: 0, x: -24, duration: 1 }, 0.2)
      .from(q("[data-art-desc]"), { autoAlpha: 0, y: 14, duration: 1 }, 0.3);
    return () => { tl.kill(); name.revert(); };
  }, { dependencies: [index, reduced], scope: section, revertOnUpdate: true });

  const go = (i: number) => {
    const st = trigger.current;
    if (!st) return;
    const y = st.start + (i / Math.max(n - 1, 1)) * (st.end - st.start);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 1.4 }); else window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
  };

  if (!current) return null;
  return (
    <section ref={section} className={styles.section} style={{ backgroundColor: categories[0]?.tone }} aria-labelledby="art-heading">
      <div className={styles.frame} data-art-frame>
        <ExperienceCanvas className={styles.canvas} camera={{ position: [0, 0, 5], fov: 35 }} fallback={<MorphFallback images={images} index={index} />}>
          <MorphPlane images={images} index={index} accent={current.accent} />
        </ExperienceCanvas>
      </div>

      <div className={styles.top}>
        <h2 id="art-heading" className="label"><span data-accent>({String(chapter).padStart(2, "0")})</span>&nbsp; {heading}</h2>
        <p className={`label ${styles.discover}`}>Settings from our portfolio</p>
      </div>

      <div className={styles.scrim} aria-hidden />
      <div className={`legible ${styles.copy}`}>
        <div className={styles.numWrap} aria-hidden><span data-art-num data-accent className={`display ${styles.num}`}>{String(index + 1).padStart(2, "0")}</span></div>
        <p key={`n-${current.slug}`} data-art-name className={`display ${styles.name}`} aria-live="polite">{current.name}</p>
        <p key={`l-${current.slug}`} data-art-line data-accent className={`display ${styles.line}`}><em>{current.line}</em></p>
        <p key={`d-${current.slug}`} data-art-desc className={styles.desc}>{current.description}</p>
      </div>

      <nav className={styles.list} aria-label="Celebration settings">
        <ol>
          {categories.map((c, i) => (
            <li key={c.slug}>
              <button type="button" onClick={() => go(i)} aria-current={i === index ? "true" : undefined} className={i === index ? styles.on : undefined}>
                <span className={styles.bar} aria-hidden />
                {c.name}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}
