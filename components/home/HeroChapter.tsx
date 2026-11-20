"use client";
import dynamic from "next/dynamic";
import { useMemo, useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/motion/gsap";
import { useChapter } from "@/hooks/useChapter";
import { useInView } from "@/hooks/useInView";
import { useExperience } from "@/lib/store";
import type { MediaItem } from "@/lib/types";
import ExperienceCanvas from "@/components/webgl/ExperienceCanvas";
import TransitionLink from "@/components/chrome/TransitionLink";
import Preloader from "./Preloader";
import styles from "./hero.module.css";

const CinematicHeroScene = dynamic(() => import("@/components/webgl/scenes/CinematicHeroScene"), { ssr: false });

function HeroFallback({ videos }: { videos: MediaItem[] }) {
  return (
    <div className={styles.fallback} aria-hidden>
      {videos.map((video, i) => (
        <video key={video.src} className={i === 1 ? styles.fallbackCenter : styles.fallbackSide} src={video.src} poster={video.poster} muted loop playsInline autoPlay preload="metadata" />
      ))}
    </div>
  );
}

export default function HeroChapter({ title, statement, videos }: { title: string; statement: string; videos: MediaItem[] }) {
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const ready = useExperience((s) => s.ready);
  const reduced = useExperience((s) => s.reducedMotion);
  const inView = useInView(section, "10% 0px");
  useChapter(section, 1, "The Opening");

  const words = title.trim().split(/\s+/);
  const critical = useMemo(() => [videos[1]?.src, videos[1]?.poster, videos[0]?.poster, videos[2]?.poster].filter((v): v is string => Boolean(v)), [videos]);

  // Entrance: masked character reveal of the title, statement lines, CTA and scroll cue.
  useGSAP(() => {
    const q = gsap.utils.selector(section);
    if (!ready) return;
    q("[data-hero-title]").forEach((el: HTMLElement) => el.classList.add("is-split"));
    if (reduced) { gsap.set(q("[data-hero-fade]"), { autoAlpha: 1 }); return; }
    const split = SplitText.create(q("[data-hero-title]"), { type: "chars", mask: "chars", aria: "auto" });
    const tl = gsap.timeline({ delay: 0.35 });
    tl.from(split.chars, { yPercent: 115, rotate: 6, duration: 1.6, stagger: 0.035, ease: "expo.out" })
      .from(q("[data-hero-rule]"), { scaleX: 0, transformOrigin: "left", duration: 1.4, ease: "expo.inOut" }, 0.5)
      .fromTo(q("[data-hero-fade]"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.12 }, 1.0);
    return () => split.revert();
  }, { dependencies: [ready, reduced], scope: section });

  // Scroll: pin the opening and transform it into the ivory Transformation chapter.
  useGSAP(() => {
    if (!section.current || reduced) return;
    const q = gsap.utils.selector(section);
    const mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)" }, (ctx) => {
      const { desktop } = ctx.conditions as { desktop: boolean };
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: desktop ? "+=130%" : "+=90%",
          pin: true,
          scrub: true,
          onUpdate: (self) => { progress.current = self.progress; },
        },
        defaults: { ease: "none" },
      });
      tl.to(q("[data-hero-word='0']"), { xPercent: -28, autoAlpha: 0, duration: 0.6 }, 0)
        .to(q("[data-hero-word='1']"), { yPercent: -40, scale: 1.25, autoAlpha: 0, duration: 0.6 }, 0.05)
        .to(q("[data-hero-word='2']"), { xPercent: 22, autoAlpha: 0, duration: 0.6 }, 0.1)
        .to(q("[data-hero-scrollfade]"), { autoAlpha: 0, y: -20, duration: 0.3 }, 0)
        .fromTo(q("[data-hero-ivory]"), { clipPath: "inset(100% 32% 0% 32% round 50% 50% 0 0)" }, { clipPath: "inset(0% 0% 0% 0% round 0% 0% 0 0)", duration: 0.45, ease: "power2.in" }, 0.55)
        .fromTo(q("[data-hero-handoff]"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.8);
    });
    return () => mm.revert();
  }, { dependencies: [reduced], scope: section });

  return (
    <>
    <Preloader critical={critical} />
    <section ref={section} className={styles.hero} aria-labelledby="hero-title" data-cursor-zone>


      <ExperienceCanvas
        className={styles.canvas}
        eventSourceRef={section}
        camera={{ position: [0, 0.6, 14], fov: 34, near: 0.1, far: 60 }}
        fallback={<HeroFallback videos={videos} />}
      >
        <CinematicHeroScene videos={videos} progress={progress} start={ready} visible={inView} />
      </ExperienceCanvas>

      <div className={styles.shade} aria-hidden />

      <div className={styles.copy}>
        <p className={`label ${styles.kicker}`} data-hero-fade data-hero-scrollfade>
          <span className="text-gilt">(01)</span> Event design &amp; atmosphere
        </p>
        <h1 id="hero-title" className={`display ${styles.title}`} data-hero-title data-reveal aria-label={title}>
          {words.map((word, i) => (
            <span key={i} data-hero-word={Math.min(i, 2)} className={styles[`w${Math.min(i, 2)}` as "w0"]}>
              {i === 1 ? <em>{word}</em> : word}{" "}
            </span>
          ))}
        </h1>
        <div className={styles.aside} data-hero-scrollfade>
          <span className={styles.rule} data-hero-rule aria-hidden />
          <p className={styles.statement} data-hero-fade>{statement}</p>
          <div className={styles.ctas} data-hero-fade>
            <TransitionLink href="/design-your-event" curtainLabel="Studio" className="btn-portal solid"><span className="dot" />Design your event</TransitionLink>
            <TransitionLink href="/portfolio" curtainLabel="Portfolio" className="btn-portal">Explore the work</TransitionLink>
          </div>
        </div>
      </div>

      <div className={styles.footer} data-hero-fade data-hero-scrollfade>
        <span className="label">Scroll to step inside</span>
        <span className={styles.scrollLine} aria-hidden />
        <span className="label hidden text-mist md:inline">Real footage · The Celebrations settings</span>
      </div>

      {/* The ivory arch that rises to become the next chapter's stage. */}
      <div className={styles.ivory} data-hero-ivory aria-hidden>
        <p className={`label ${styles.handoff}`} data-hero-handoff>(02) The Transformation</p>
      </div>
    </section>
    </>
  );
}
