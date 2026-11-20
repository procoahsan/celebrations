"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import RevealText from "@/components/motion/RevealText";

function Embed({ url, index }: { url: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setLoad(true); io.disconnect(); } }, { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} data-ig className="relative mx-auto h-[560px] w-full max-w-[340px] overflow-hidden rounded-[18px] bg-[#1a1416] ring-1 ring-ivory/10">
      {load ? (
        <iframe src={`${url.replace(/\/?$/, "/")}embed/`} title={`Instagram post ${index + 1} from @celebrations06`} loading="lazy" className="absolute inset-0 h-full w-full border-0 bg-white" allow="encrypted-media; picture-in-picture" scrolling="no" />
      ) : (
        <div className="label grid h-full place-items-center text-mist">Loading Instagram…</div>
      )}
    </div>
  );
}

/**
 * "Straight from Instagram": real posts via Instagram's official embed. Shown as a staggered three-column
 * editorial grid (middle column offset, columns drifting at different speeds on scroll) instead of a
 * sideways scroller; extra posts appear in batches with "Show more".
 */
export default function InstagramWall({ posts, instagramUrl, initial = 3, step = 3 }: { posts: string[]; instagramUrl: string; initial?: number; step?: number }) {
  const root = useRef<HTMLElement>(null);
  const [count, setCount] = useState(initial);
  const list = posts.slice(0, count);
  const columns = [0, 1, 2].map((c) => list.filter((_, i) => i % 3 === c));

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>("[data-ig-col]").forEach((col, i) => {
        gsap.fromTo(col, { y: [40, 140, 80][i] }, { y: [-20, -60, -40][i], ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      });
    });
    gsap.from("[data-ig]", { autoAlpha: 0, y: 40, stagger: 0.1, duration: 1.1, scrollTrigger: { trigger: root.current, start: "top 75%" } });
    return () => mm.revert();
  }, { scope: root, dependencies: [count] });

  useEffect(() => { ScrollTrigger.refresh(); }, [count]);

  if (!posts.length) return null;
  return (
    <section ref={root} aria-labelledby="ig-heading" className="overflow-hidden bg-velvet px-[var(--gutter)] pb-[16vh] pt-[8vh] text-ivory">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="label text-gilt">@celebrations06</p>
          <RevealText as="h2" id="ig-heading" className="display mt-4 text-[clamp(2.4rem,5.5vw,5.5rem)] leading-[0.92]">Straight from <em className="text-gilt">Instagram.</em></RevealText>
        </div>
        <a href={instagramUrl} target="_blank" rel="noreferrer" className="btn-portal"><span className="dot" />Follow our work</a>
      </div>

      {/* Desktop: three offset columns. Mobile/tablet: a single column in reading order. */}
      <div className="mt-14 hidden gap-[3vw] min-[900px]:grid min-[900px]:grid-cols-3">
        {columns.map((col, c) => (
          <div key={c} data-ig-col className="grid content-start gap-[3vw]">
            {col.map((url) => <Embed key={url} url={url} index={posts.indexOf(url)} />)}
          </div>
        ))}
      </div>
      <div className="mt-10 grid gap-6 min-[900px]:hidden">
        {list.map((url, i) => <Embed key={url} url={url} index={i} />)}
      </div>

      <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
        {count < posts.length && (
          <button type="button" onClick={() => setCount((c) => Math.min(posts.length, c + step))} className="btn-portal">Show more posts</button>
        )}
        <a href={instagramUrl} target="_blank" rel="noreferrer" className="label text-mist underline-offset-4 hover:text-ivory hover:underline">See everything on Instagram ↗</a>
      </div>
    </section>
  );
}
