"use client";
import { useEffect, useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/motion/gsap";
import { useExperience } from "@/lib/store";
import type { MediaItem, PortfolioProject } from "@/lib/types";
import TransitionLink from "@/components/chrome/TransitionLink";

function Media({ item, className = "", arch = false, eager = false }: { item: MediaItem; className?: string; arch?: boolean; eager?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.2 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  const style = arch ? { borderRadius: "999px 999px 0 0" } : undefined;
  return (
    <figure className={`relative overflow-hidden ${className}`} style={style} data-media>
      {item.kind === "video" ? (
        <video ref={ref} src={item.src} poster={item.poster} muted loop playsInline preload="metadata" aria-label={item.alt} className="h-full w-full object-cover" data-parallax />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.src} alt={item.alt} loading={eager ? "eager" : "lazy"} className="h-full w-full object-cover" data-parallax />
      )}
    </figure>
  );
}

/** Project page: arched cover opening, editorial media rhythm with parallax and masked reveals, and a large "next" hand-off. */
export default function ProjectDetail({ project, next, index, total }: { project: PortfolioProject; next: PortfolioProject | null; index: number; total: number }) {
  const root = useRef<HTMLElement>(null);
  const reduced = useExperience((s) => s.reducedMotion);
  const [lead, ...rest] = project.media.length ? project.media : [project.cover];

  useGSAP(() => {
    if (reduced) return;
    const q = gsap.utils.selector(root);
    const split = SplitText.create(q("[data-title]"), { type: "words,chars", mask: "chars", aria: "auto" });
    gsap.timeline({ delay: 0.25 })
      .from(split.chars, { yPercent: 115, stagger: 0.03, duration: 1.4, ease: "expo.out" })
      .from(q("[data-cover]"), { clipPath: "inset(100% 0 0 0 round 999px 999px 0 0)", duration: 1.8, ease: "expo.inOut" }, 0)
      .from(q("[data-meta]"), { autoAlpha: 0, y: 14, stagger: 0.08, duration: 1 }, 0.6);
    q("[data-media]").forEach((el: HTMLElement) => {
      gsap.from(el, { clipPath: "inset(100% 0 0 0)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 85%" } });
      const inner = el.querySelector("[data-parallax]");
      if (inner) gsap.fromTo(inner, { yPercent: -6, scale: 1.12 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: el, scrub: true } });
    });
    gsap.fromTo(q("[data-next-title]"), { xPercent: 12 }, { xPercent: -12, ease: "none", scrollTrigger: { trigger: q("[data-next]")[0], scrub: true } });
    return () => split.revert();
  }, { scope: root, dependencies: [reduced, project.slug] });

  return (
    <article ref={root} className="bg-nocturne text-ivory">
      <header className="grid min-h-[100svh] grid-cols-1 items-end gap-10 px-[var(--gutter)] pb-[8vh] pt-[calc(var(--nav-h)+6vh)] md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="label" data-meta><TransitionLink href="/portfolio" className="text-gilt hover:underline">Portfolio</TransitionLink> &nbsp;/&nbsp; {String(index + 1).padStart(2, "0")} of {String(total).padStart(2, "0")}</p>
          <h1 data-title className="display mt-6 text-[clamp(3.4rem,9vw,10rem)] leading-[0.86]">{project.title}</h1>
          <dl className="mt-10 grid max-w-xl grid-cols-2 gap-6 border-t border-ivory/15 pt-6" data-meta>
            <div><dt className="label text-mist">Setting</dt><dd className="mt-2">{project.eventType}</dd></div>
            <div><dt className="label text-mist">Media</dt><dd className="mt-2">{project.media.length} photographs &amp; films</dd></div>
          </dl>
          <p className="mt-8 max-w-[32rem] text-lg text-ivory/80" data-meta>{project.summary}</p>
        </div>
        <div data-cover className="justify-self-center md:justify-self-end" style={{ borderRadius: "999px 999px 0 0", overflow: "hidden" }}>
          <Media item={lead} arch eager className="h-[72svh] w-[min(42vh*1.1,88vw)] max-w-[520px]" />
        </div>
      </header>

      <section aria-label="Gallery" className="grid grid-cols-1 gap-[6vw] px-[var(--gutter)] py-[12vh] md:grid-cols-12">
        {rest.map((item, i) => {
          const layout = [
            "md:col-span-7 aspect-[4/5]",
            "md:col-span-4 md:col-start-9 md:mt-[30vh] aspect-[3/4]",
            "md:col-span-5 md:col-start-2 aspect-[3/4]",
            "md:col-span-6 md:col-start-7 md:-mt-[10vh] aspect-[4/5]",
          ][i % 4];
          return <Media key={item.src + i} item={item} arch={i % 3 === 1} className={layout} />;
        })}
      </section>

      {next && (
        <section data-next className="overflow-hidden border-t border-ivory/10 py-[14vh]">
          <p className="label px-[var(--gutter)] text-mist">Next setting</p>
          <TransitionLink href={`/portfolio/${next.slug}`} curtainLabel={next.title} data-cursor="view" className="group mt-6 block">
            <span data-next-title className="display block whitespace-nowrap text-[clamp(4rem,14vw,16rem)] leading-none transition-colors duration-700 group-hover:text-gilt">{next.title} <em>→</em></span>
          </TransitionLink>
        </section>
      )}
    </article>
  );
}
