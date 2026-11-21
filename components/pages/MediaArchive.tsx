"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import type { MediaItem } from "@/lib/types";
import RevealText from "@/components/motion/RevealText";

type Filter = "all" | "image" | "video";

function Tile({ item, onOpen }: { item: MediaItem; onOpen: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  return (
    <button
      type="button"
      data-tile
      data-cursor="view"
      onClick={onOpen}
      onMouseEnter={() => video.current?.play().catch(() => {})}
      onMouseLeave={() => video.current?.pause()}
      className="group relative mb-4 block w-full break-inside-avoid overflow-hidden bg-[#1a1416] text-left"
      aria-label={`Open ${item.kind === "video" ? "film" : "photo"}: ${item.alt}`}
    >
      {item.kind === "video" ? (
        <video ref={video} src={item.src} poster={item.poster} muted loop playsInline preload="none" className="block aspect-[9/16] w-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-expo)] group-hover:scale-105" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.poster ?? item.src} alt={item.alt} loading="lazy" className="block w-full transition-transform duration-[1.2s] ease-[var(--ease-expo)] group-hover:scale-105" />
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/75 to-transparent p-4 pt-12 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="text-sm leading-snug text-ivory">{item.alt}</span>
        <span className="label shrink-0 text-gilt">{item.kind === "video" ? "Film" : "Photo"}</span>
      </span>
      {item.kind === "video" && <span aria-hidden className="label absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-ivory">▶ Film</span>}
    </button>
  );
}

/**
 * Every supplied photograph and film in one archive: a masonry wall with Photos / Films filters
 * and a fullscreen lightbox (arrow keys, Escape, focus returned to the tile that opened it).
 */
export default function MediaArchive({ items }: { items: MediaItem[] }) {
  const root = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<number | null>(null);
  const list = filter === "all" ? items : items.filter((i) => i.kind === filter);
  const current = open !== null ? list[open] : null;
  const photos = items.filter((i) => i.kind === "image").length;
  const films = items.length - photos;

  useGSAP(() => {
    gsap.from("[data-tile]", { autoAlpha: 0, y: 40, duration: 1, stagger: 0.04, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 75%" } });
  }, { scope: root, dependencies: [filter] });
  useEffect(() => { ScrollTrigger.refresh(); }, [filter]);

  const close = useCallback(() => { setOpen(null); opener.current?.focus(); }, []);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + list.length) % list.length)), [list.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.documentElement.style.overflow = ""; };
  }, [open, close, step]);

  return (
    <section ref={root} id="archive" aria-labelledby="archive-heading" className="bg-nocturne px-[var(--gutter)] pb-[14vh] pt-[10vh] text-ivory">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="label text-gilt">The archive · {photos} photographs · {films} films</p>
          <RevealText as="h2" id="archive-heading" className="display mt-4 text-[clamp(2.6rem,6vw,6rem)] leading-[0.9]">Every setting, <em className="text-gilt">every detail.</em></RevealText>
        </div>
        <div className="flex gap-1 rounded-full border border-ivory/20 p-1" role="tablist" aria-label="Filter archive">
          {([["all", "All"], ["image", "Photos"], ["video", "Films"]] as const).map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={filter === key} onClick={() => setFilter(key)}
              className={`label rounded-full px-4 py-2.5 transition-colors ${filter === key ? "bg-ivory text-nocturne" : "hover:text-gilt"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 columns-2 gap-4 md:columns-3 xl:columns-4">
        {list.map((item, i) => (
          <Tile key={`${filter}-${item.src}`} item={item} onOpen={() => { opener.current = document.activeElement as HTMLElement; setOpen(i); }} />
        ))}
      </div>

      {current && (
        <div role="dialog" aria-modal="true" aria-label={current.alt} className="fixed inset-0 z-[95] grid grid-rows-[auto_1fr_auto] bg-black/95 text-ivory" onClick={(e) => { if (e.target === e.currentTarget) close(); }} data-lenis-prevent>
          <div className="flex items-center justify-between px-[var(--gutter)] py-4">
            <span className="label text-mist tabular-nums">{String((open ?? 0) + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}</span>
            <button type="button" onClick={close} autoFocus className="label rounded-full border border-ivory/30 px-4 py-2 hover:bg-ivory hover:text-nocturne">Close ×</button>
          </div>
          <div className="relative flex min-h-0 items-center justify-center px-14" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
            {current.kind === "video" ? (
              <video key={current.src} src={current.src} poster={current.poster} controls autoPlay muted loop playsInline className="max-h-full max-w-full object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={current.src} src={current.src} alt={current.alt} className="max-h-full max-w-full object-contain" />
            )}
            <button type="button" onClick={() => step(-1)} aria-label="Previous" className="absolute left-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-ivory/30 bg-black/40 hover:bg-ivory hover:text-nocturne">←</button>
            <button type="button" onClick={() => step(1)} aria-label="Next" className="absolute right-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-ivory/30 bg-black/40 hover:bg-ivory hover:text-nocturne">→</button>
          </div>
          <p className="px-[var(--gutter)] py-5 text-center text-sm text-ivory/80">{current.alt}</p>
        </div>
      )}
    </section>
  );
}
