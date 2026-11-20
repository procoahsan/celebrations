"use client";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import type { PortfolioProject } from "@/lib/types";
import TransitionLink from "@/components/chrome/TransitionLink";

/** Editorial project index: rows of large titles; hovering floats an arched preview that follows the pointer. */
export default function ProjectIndex({ projects }: { projects: PortfolioProject[] }) {
  const root = useRef<HTMLDivElement>(null);
  const float = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  useGSAP(() => {
    if (!float.current) return;
    const xTo = gsap.quickTo(float.current, "x", { duration: 0.7, ease: "power3" });
    const yTo = gsap.quickTo(float.current, "y", { duration: 0.7, ease: "power3" });
    const move = (e: PointerEvent) => { const r = root.current!.getBoundingClientRect(); xTo(e.clientX - r.left); yTo(e.clientY - r.top); };
    root.current?.addEventListener("pointermove", move);
    gsap.from("[data-row]", { yPercent: 40, autoAlpha: 0, stagger: 0.06, duration: 1.2, scrollTrigger: { trigger: root.current, start: "top 80%" } });
    return () => root.current?.removeEventListener("pointermove", move);
  }, { scope: root });

  return (
    <div ref={root} className="relative bg-nocturne px-[var(--gutter)] pb-[14vh] pt-[10vh] text-ivory" onPointerLeave={() => setHover(null)}>
      <p className="label mb-8 text-mist">Index · {projects.length} settings</p>
      <ol className="border-t border-ivory/15">
        {projects.map((p, i) => (
          <li key={p.slug} data-row className="border-b border-ivory/15">
            <TransitionLink
              href={`/portfolio/${p.slug}`}
              curtainLabel={p.title}
              data-cursor="view"
              onPointerEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              className="group grid grid-cols-[3rem_1fr] items-baseline gap-4 py-6 md:grid-cols-[4rem_1fr_16rem] md:py-8"
            >
              <span className="label text-gilt">{String(i + 1).padStart(2, "0")}</span>
              <span className="display text-[clamp(2.2rem,5.5vw,5.6rem)] leading-none transition-[transform,color] duration-700 ease-[var(--ease-expo)] group-hover:translate-x-6 group-hover:italic group-hover:text-gilt">{p.title}</span>
              <span className="label col-start-2 text-mist md:col-start-auto md:text-right">{p.eventType}</span>
            </TransitionLink>
          </li>
        ))}
      </ol>
      <div ref={float} aria-hidden className="pointer-events-none absolute left-0 top-0 z-10 hidden h-[22rem] w-[15rem] -translate-x-1/2 -translate-y-1/2 overflow-hidden md:block" style={{ borderRadius: "999px 999px 0 0", opacity: hover === null ? 0 : 1, transform: `scale(${hover === null ? 0.6 : 1})`, transition: "opacity .4s, scale .6s" }}>
        {projects.map((p, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.slug} src={p.cover.poster ?? p.cover.src} alt="" className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500" style={{ opacity: hover === i ? 1 : 0 }} loading="lazy" />
        ))}
      </div>
    </div>
  );
}
