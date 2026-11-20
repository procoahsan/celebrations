"use client";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { useChapter } from "@/hooks/useChapter";
import { useExperience } from "@/lib/store";
import type { StudioTemplate } from "@/lib/types";
import ExperienceCanvas from "@/components/webgl/ExperienceCanvas";
import TransitionLink from "@/components/chrome/TransitionLink";
import RevealText from "@/components/motion/RevealText";
import styles from "./studio-teaser.module.css";

const MorphPlane = dynamic(() => import("@/components/webgl/scenes/MorphPlane"), { ssr: false });

/** Scene 05 (homepage): pick a theme, watch the concept transform, step into the Event Studio. */
export default function StudioTeaser({ templates, title, statement }: { templates: StudioTemplate[]; title: string; statement: string }) {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const reduced = useExperience((s) => s.reducedMotion);
  useChapter(section, 5, "The Event Studio");
  const theme = templates[active];

  useGSAP(() => {
    if (reduced || !section.current) return;
    const q = gsap.utils.selector(section);
    gsap.timeline({ scrollTrigger: { trigger: section.current, start: "top 65%" } })
      .from(q("[data-studio-frame]"), { clipPath: "inset(30% 20% 30% 20% round 999px 999px 0 0)", scale: 0.9, duration: 1.8, ease: "expo.inOut" })
      .from(q("[data-studio-chip]"), { autoAlpha: 0, y: 20, stagger: 0.07, duration: 0.9 }, "-=1.0");
    // Gentle parallax on the frame while scrolling through.
    gsap.fromTo(q("[data-studio-frame]"), { yPercent: 8 }, { yPercent: -8, ease: "none", scrollTrigger: { trigger: section.current, scrub: true } });
  }, { dependencies: [reduced], scope: section });

  useGSAP(() => {
    if (!theme) return;
    const q = gsap.utils.selector(section);
    gsap.fromTo(q("[data-swatch]"), { scale: 0, rotate: -40 }, { scale: 1, rotate: 0, stagger: 0.06, duration: 0.9, ease: "back.out(1.6)" });
    gsap.fromTo(q("[data-mood]"), { yPercent: 100 }, { yPercent: 0, duration: 0.9 });
  }, { dependencies: [active], scope: section });

  if (!theme) return null;
  const [first, ...rest] = title.split(". ");
  return (
    <section ref={section} className={styles.section} aria-labelledby="studio-heading">
      <div className={styles.grid}>
        <div className={styles.copy}>
          <p className="label"><span className="text-rouge">(05)</span>&nbsp; The Event Studio</p>
          <RevealText as="h2" id="studio-heading" className={`display ${styles.title}`} type="lines">
            {first}{rest.length ? "." : ""} <em>{rest.join(". ")}</em>
          </RevealText>
          <p className={styles.statement}>{statement}</p>

          <fieldset className={styles.themes}>
            <legend className="label">Start from a mood</legend>
            {templates.map((t, i) => (
              <button key={t.slug} type="button" data-studio-chip onClick={() => setActive(i)} aria-pressed={i === active} className={i === active ? styles.on : undefined}>
                <span className={styles.chipDots} aria-hidden>{t.palette.slice(0, 3).map((p) => <i key={p.hex} style={{ background: p.hex }} />)}</span>
                {t.name}
              </button>
            ))}
          </fieldset>

          <div className={styles.cta}>
            <TransitionLink href={`/design-your-event?theme=${theme.slug}`} curtainLabel="Studio" className="btn-portal on-light"><span className="dot" />Enter the studio</TransitionLink>
            <span className="label opacity-60">2D moodboard · 3D concept preview</span>
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.frame} data-studio-frame>
            <ExperienceCanvas className={styles.canvas} camera={{ position: [0, 0, 5], fov: 35 }} fallback={/* eslint-disable-next-line @next/next/no-img-element */ <img src={theme.image} alt="" className={styles.fallbackImg} />}>
              <MorphPlane images={templates.map((t) => t.image)} index={active} accent={theme.palette[0]?.hex} />
            </ExperienceCanvas>
          </div>
          <div className={styles.card}>
            <div className={styles.moodMask}><p data-mood className="display">{theme.mood}</p></div>
            <div className={styles.swatches}>
              {theme.palette.map((p) => (
                <span key={p.hex} className={styles.swatch}><i data-swatch style={{ background: p.hex }} /><span className="label">{p.name}</span></span>
              ))}
            </div>
            <p className="label opacity-60">Suited to · {theme.eventTypes.join(" / ")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
