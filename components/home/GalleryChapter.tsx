"use client";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/motion/gsap";
import { useChapter } from "@/hooks/useChapter";
import { useInView } from "@/hooks/useInView";
import { useExperience } from "@/lib/store";
import type { PortfolioProject } from "@/lib/types";
import ExperienceCanvas from "@/components/webgl/ExperienceCanvas";
import TransitionLink from "@/components/chrome/TransitionLink";
import { transitionTo } from "@/components/chrome/Curtain";
import { getLenis } from "@/components/providers/ExperienceProvider";
import styles from "./gallery.module.css";

const ImmersiveGallery = dynamic(() => import("@/components/webgl/scenes/ImmersiveGallery"), { ssr: false });

function GalleryFallback({ projects }: { projects: PortfolioProject[] }) {
  return (
    <ul className={styles.fallback}>
      {projects.map((p) => (
        <li key={p.slug}>
          <TransitionLink href={`/portfolio/${p.slug}`} curtainLabel={p.title} data-cursor="view">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.cover.poster ?? p.cover.src} alt={p.cover.alt} loading="lazy" />
            <span className="display">{p.title}</span>
          </TransitionLink>
        </li>
      ))}
    </ul>
  );
}

export default function GalleryChapter({ projects, heading, chapter = 3, pinLength = 110 }: { projects: PortfolioProject[]; heading: string; chapter?: number | null; pinLength?: number }) {
  const section = useRef<HTMLElement>(null);
  const target = useRef(0);
  const trigger = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const reduced = useExperience((s) => s.reducedMotion);
  const inView = useInView(section, "0px");
  useChapter(section, chapter ?? 0, "The Gallery");
  const n = projects.length;
  const current = projects[Math.min(Math.max(active, 0), n - 1)];

  // Pinned scroll drives the wall position.
  useGSAP(() => {
    if (!section.current) return;
    trigger.current = ScrollTrigger.create({
      trigger: section.current,
      start: "top top",
      end: () => `+=${Math.max(n - 1, 1) * window.innerHeight * (pinLength / 100)}`,
      pin: true,
      scrub: true,
      snap: reduced ? undefined : { snapTo: 1 / Math.max(n - 1, 1), duration: { min: 0.25, max: 0.7 }, delay: 0.12, ease: "power2.inOut" },
      onUpdate: (self) => { target.current = self.progress * (n - 1); },
    });
    return () => trigger.current?.kill();
  }, { dependencies: [n, reduced, pinLength], scope: section });

  // Title swap: masked character rise whenever the active work changes.
  useGSAP(() => {
    const q = gsap.utils.selector(section);
    const title = q("[data-gallery-title]")[0];
    if (!title || reduced) return;
    const split = SplitText.create(title, { type: "words,chars", mask: "chars", aria: "auto" });
    gsap.from(split.chars, { yPercent: 110, duration: 1, stagger: 0.018, ease: "expo.out" });
    gsap.fromTo(q("[data-gallery-meta]"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.06, delay: 0.15 });
    return () => split.revert();
  }, { dependencies: [active, reduced], scope: section, revertOnUpdate: true });

  const scrollToIndex = (i: number) => {
    const st = trigger.current;
    if (!st) return;
    const y = st.start + (i / Math.max(n - 1, 1)) * (st.end - st.start);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 1.2 }); else window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
  };

  // Horizontal drag (mouse or touch) scrubs the pinned scroll, keeping scroll and drag in one source of truth.
  const bind = useDrag(({ delta: [dx], event }) => {
    const st = trigger.current;
    if (!st || Math.abs(dx) < 0.5) return;
    event.preventDefault?.();
    const lenis = getLenis();
    const per = (st.end - st.start) / Math.max(n - 1, 1) / (window.innerWidth * 0.45);
    const next = (lenis?.scroll ?? window.scrollY) - dx * per;
    if (lenis) lenis.scrollTo(next, { immediate: true }); else window.scrollTo(0, next);
  }, { axis: "x", filterTaps: true, pointer: { touch: true } });

  const open = (project: PortfolioProject) => transitionTo(`/portfolio/${project.slug}`, project.title);

  return (
    <section ref={section} className={styles.section} aria-labelledby="gallery-heading">
      <div {...bind()} className={styles.stage} data-cursor={hovered !== null ? "view" : "drag"} data-cursor-label={hovered !== null && hovered !== active ? "Bring forward" : undefined}>
        <ExperienceCanvas className={styles.canvas} eventSourceRef={section} camera={{ position: [0, 0.1, 0.01], fov: 42, near: 0.1, far: 40 }} fallback={<GalleryFallback projects={projects} />}>
          <ImmersiveGallery projects={projects} target={target} onActiveChange={setActive} onOpen={open} onHover={setHovered} onSelect={scrollToIndex} visible={inView} />
        </ExperienceCanvas>
      </div>

      <div className={styles.scrim} aria-hidden />
      <header className={styles.header}>
        <p className="label">{chapter != null && <><span className="text-gilt">({String(chapter).padStart(2, "0")})</span>&nbsp; </>}{heading}</p>
        <p className={`label ${styles.count}`}><span className="tabular-nums">{String(active + 1).padStart(2, "0")}</span> <span className="text-mist">/ {String(n).padStart(2, "0")}</span></p>
      </header>

      {current && (
        <div className={styles.caption}>
          <p className="label text-gilt" data-gallery-meta>{current.eventType}</p>
          <h2 id="gallery-heading" className={`display legible ${styles.title}`}>
            <TransitionLink key={current.slug} href={`/portfolio/${current.slug}`} curtainLabel={current.title} data-gallery-title data-cursor="view" className={styles.titleLink}>{current.title}</TransitionLink>
          </h2>
          <p className={`legible ${styles.summary}`} data-gallery-meta>{current.summary}</p>
          <TransitionLink href="/portfolio#archive" curtainLabel="Archive" className={`label legible ${styles.archiveLink}`}>View all photos &amp; films →</TransitionLink>
        </div>
      )}

      <nav className={styles.index} aria-label="Projects">
        <ol>
          {projects.map((p, i) => (
            <li key={p.slug}>
              <button type="button" onClick={() => scrollToIndex(i)} aria-current={i === active ? "true" : undefined} className={i === active ? styles.on : undefined}>
                <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.indexName}>{p.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}
