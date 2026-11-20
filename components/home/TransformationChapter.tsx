"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { useChapter } from "@/hooks/useChapter";
import { useExperience } from "@/lib/store";
import styles from "./transformation.module.css";

interface Sequence { base: string; count: number; ext: string; width: number; height: number }

const frameUrl = (seq: Sequence, i: number) => `${seq.base}${String(i + 1).padStart(3, "0")}.${seq.ext}`;

/**
 * Scene 02: pinned, scroll-scrubbed image sequence extracted from The Celebrations's own aisle setup
 * timelapse (empty hall → candlelit, petal-strewn aisle). Video seeking is unreliable for scrubbing,
 * so frames are drawn to a canvas. The frame grows from the hero's arch to full bleed while the type transforms.
 */
export default function TransformationChapter({ title, sequence }: { title: string; sequence: Sequence }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const frames = useRef<HTMLImageElement[]>([]);
  const current = useRef({ frame: 0 });
  const counter = useRef<HTMLSpanElement>(null);
  const percent = useRef<HTMLSpanElement>(null);
  const [near, setNear] = useState(false);
  const reduced = useExperience((s) => s.reducedMotion);
  useChapter(section, 2, "The Transformation");

  // Start loading frames when the chapter approaches.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: "150% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const draw = (index: number) => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    // Nearest loaded frame at or before the requested one.
    let i = Math.round(index);
    while (i > 0 && !frames.current[i]?.complete) i--;
    const img = frames.current[i];
    if (!img?.complete || !img.naturalWidth) return;
    const { width: cw, height: ch } = c;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    if (counter.current) counter.current.textContent = `${String(i + 1).padStart(3, "0")} / ${String(sequence.count).padStart(3, "0")}`;
    if (percent.current) percent.current.textContent = `${Math.round((i / (sequence.count - 1)) * 100)}%`;
  };

  useEffect(() => {
    if (!near) return;
    const start = reduced ? sequence.count - 1 : 0;
    frames.current = Array.from({ length: sequence.count }, (_, i) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => { if (Math.abs(i - current.current.frame) < 2 || i === start) draw(current.current.frame); };
      img.src = frameUrl(sequence, i);
      return img;
    });
    current.current.frame = start;
    return () => { frames.current.forEach((img) => (img.onload = null)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, sequence, reduced]);

  // Keep the canvas backing store matched to its box.
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(c.clientWidth * dpr);
      c.height = Math.round(c.clientHeight * dpr);
      draw(current.current.frame);
    });
    ro.observe(c);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useGSAP(() => {
    if (!section.current) return;
    const q = gsap.utils.selector(section);
    if (reduced) { gsap.set(q("[data-phase]"), { autoAlpha: 1 }); return; }
    const mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)" }, (ctx) => {
      const { desktop } = ctx.conditions as { desktop: boolean };
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: section.current, start: "top top", end: desktop ? "+=320%" : "+=240%", pin: true, scrub: 0.4, anticipatePin: 1 },
      });
      // Frames scrub across the whole pin.
      tl.to(current.current, { frame: sequence.count - 1, duration: 1, onUpdate: () => draw(current.current.frame) }, 0);
      // The frame grows from the hero's arch to full bleed with a slow cinematic push-in.
      tl.fromTo(q("[data-frame]"), { clipPath: desktop ? "inset(14% 34% 6% 34% round 999px 999px 0 0)" : "inset(16% 14% 10% 14% round 999px 999px 0 0)" },
        { clipPath: "inset(0% 0% 0% 0% round 0px 0px 0 0)", duration: 0.55, ease: "power2.inOut" }, 0.38);
      tl.fromTo(q("canvas"), { scale: 1.18 }, { scale: 1, duration: 1 }, 0);
      // The veil arrives exactly as the type turns ivory over the footage.
      tl.fromTo(q("[data-veil]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, 0.36);
      // Typography in three phases.
      tl.fromTo(q("[data-phase='0'] [data-word]"), { yPercent: 0 }, { yPercent: -105, stagger: 0.02, duration: 0.12 }, 0.24)
        .fromTo(q("[data-phase='1'] [data-word]"), { yPercent: 105 }, { yPercent: 0, stagger: 0.025, duration: 0.14 }, 0.3)
        .to(q("[data-phase='1'] [data-word]"), { yPercent: -105, stagger: 0.02, duration: 0.12 }, 0.62)
        .fromTo(q("[data-phase='2'] [data-word]"), { yPercent: 110, rotate: 3 }, { yPercent: 0, rotate: 0, stagger: 0.04, duration: 0.16 }, 0.8)
        .to(q("[data-ink]"), { color: "#f2ebe1", textShadow: "0 1px 2px rgba(15,11,12,.6), 0 0 0.9em rgba(15,11,12,.55)", duration: 0.12 }, 0.4)
        .fromTo(q("[data-progress-bar]"), { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0);
    });
    return () => mm.revert();
  }, { dependencies: [reduced], scope: section });


  const phrase = (text: string, italicIndex = -1) =>
    text.split(" ").map((word, i) => (
      <span key={i} className={styles.mask}><span data-word className={styles.word}>{i === italicIndex ? <em>{word}</em> : word}</span></span>
    ));

  return (
    <section ref={section} className={styles.section} aria-labelledby="transformation-title">
      <div className={styles.frame} data-frame>
        <canvas ref={canvas} className={styles.canvas} role="img" aria-label="Timelapse: an empty hall transforms into a candlelit aisle lined with flowers and petals" />
        <div className={styles.veil} data-veil aria-hidden />
      </div>

      <div className={styles.copy} data-ink>
        <p className="label" data-ink><span className="text-rouge">(02)</span>&nbsp; The Transformation</p>
        <h2 id="transformation-title" className="sr-only">{title}</h2>
        <div className={`display ${styles.phrases}`} aria-hidden>
          <p data-phase="0" className={styles.phrase}>{phrase("An empty room.", 1)}</p>
          <p data-phase="1" className={styles.phrase}>{phrase("A vision takes shape.", 1)}</p>
          <p data-phase="2" className={`${styles.phrase} ${styles.final}`}>{phrase("Unforgettable.", 0)}</p>
        </div>
      </div>

      <div className={styles.meta} data-ink>
        <div className={styles.progress} aria-hidden><span data-progress-bar /></div>
        <p className="label"><span className={styles.dim}>Setup</span> <span ref={percent} className="tabular-nums">0%</span></p>
        <p className="label"><span className={styles.dim}>Frame</span> <span ref={counter} className="tabular-nums">001 / {String(sequence.count).padStart(3, "0")}</span></p>
        <p className={`label ${styles.note}`}>Real setup timelapse, one venue, start to finish</p>
      </div>
    </section>
  );
}
