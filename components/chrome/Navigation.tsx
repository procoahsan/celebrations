"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { useExperience } from "@/lib/store";
import Brand from "./Brand";
import TransitionLink from "./TransitionLink";

const LINKS = [
  { href: "/", label: "Home", word: "The Celebrations", image: "/media/img/crystal-arch-blue-sm.jpg" },
  { href: "/portfolio", label: "Portfolio", word: "Portfolio", image: "/media/img/rouge-throne-stage-sm.jpg" },
  { href: "/services", label: "The Art", word: "The Art", image: "/media/img/mehndi-arch-teal-sm.jpg" },
  { href: "/design-your-event", label: "Event Studio", word: "Studio", image: "/media/img/ivory-arch-sanctuary-sm.jpg" },
  { href: "/reviews", label: "Stories", word: "Stories", image: "/media/img/champagne-drape-lounge-sm.jpg" },
  { href: "/book-a-call", label: "Book a Consultation", word: "Consultation", image: "/media/img/round-table-rouge-sm.jpg" },
  { href: "/contact", label: "Contact", word: "Contact", image: "/media/img/floral-column-sm.jpg" },
];

export default function Navigation({ instagramUrl }: { instagramUrl: string }) {
  const pathname = usePathname();
  const menuOpen = useExperience((s) => s.menuOpen);
  const chapter = useExperience((s) => s.chapter);
  const set = useExperience((s) => s.set);
  const ready = useExperience((s) => s.ready);
  const overlay = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [preview, setPreview] = useState(0);
  const isAdmin = pathname.startsWith("/admin");

  // Bar entrance: on home it waits for the preloader so it lands as part of the hero choreography.
  useGSAP(() => {
    if (!bar.current || isAdmin) return;
    if (pathname === "/" && !ready) { gsap.set(bar.current, { autoAlpha: 0 }); return; }
    gsap.fromTo(bar.current, { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: 1.2, delay: pathname === "/" ? 1.4 : 0.2 });
  }, { dependencies: [ready, pathname === "/"], scope: bar });

  // Menu timeline: arch curtain unfurls from the top, links rise through masks, preview frame scales in.
  useGSAP(() => {
    if (!overlay.current) return;
    const q = gsap.utils.selector(overlay);
    tl.current = gsap.timeline({ paused: true, defaults: { ease: "curtain" } })
      .set(overlay.current, { visibility: "visible" })
      .fromTo(overlay.current, { clipPath: "inset(0% 0% 100% 0% round 0 0 50% 50%)" }, { clipPath: "inset(0% 0% 0% 0% round 0 0 0% 0%)", duration: 1.05 })
      .from(q("[data-menu-link]"), { yPercent: 120, duration: 1.1, stagger: 0.055, ease: "expo.out" }, "-=0.55")
      .from(q("[data-menu-index]"), { autoAlpha: 0, duration: 0.6, stagger: 0.04 }, "<0.1")
      .from(q("[data-menu-preview]"), { clipPath: "inset(100% 0% 0% 0% round 50% 50% 0 0)", duration: 1.2, ease: "expo.out" }, "<0.1")
      .from(q("[data-menu-foot]"), { autoAlpha: 0, y: 12, duration: 0.8, stagger: 0.05 }, "<0.2");
  }, { scope: overlay });

  useEffect(() => {
    const reduced = useExperience.getState().reducedMotion;
    if (!tl.current) return;
    if (menuOpen) {
      if (reduced) tl.current.progress(1); else tl.current.timeScale(1).play();
      document.documentElement.style.overflow = "hidden";
      window.setTimeout(() => overlay.current?.querySelector<HTMLElement>("[data-menu-link]")?.focus(), 350);
    } else {
      if (reduced) tl.current.progress(0); else tl.current.timeScale(1.6).reverse();
      document.documentElement.style.overflow = "";
    }
  }, [menuOpen]);

  // Escape closes; focus is trapped inside the open menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { set({ menuOpen: false }); toggle.current?.focus(); }
      if (event.key === "Tab" && overlay.current) {
        const nodes = [toggle.current, ...overlay.current.querySelectorAll<HTMLElement>("a,button")].filter(Boolean) as HTMLElement[];
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, set]);

  if (isAdmin) return null;

  return (
    <>
      <header ref={bar} className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex h-[var(--nav-h)] items-center justify-between px-[var(--gutter)] text-white mix-blend-difference">
        <div className="pointer-events-auto"><Brand /></div>
        {pathname === "/" && chapter && (
          <p className="label pointer-events-none absolute left-1/2 hidden -translate-x-1/2 items-center gap-3 md:flex" aria-live="polite">
            <span className="tabular-nums">{String(chapter.index).padStart(2, "0")}</span>
            <span className="h-px w-10 bg-white/40" />
            <span>{chapter.name}</span>
          </p>
        )}
        <div className="pointer-events-auto flex items-center gap-6">
          <TransitionLink href="/book-a-call" curtainLabel="Consultation" className="label group relative hidden overflow-hidden sm:block">
            <span className="block transition-transform duration-500 ease-[var(--ease-expo)] group-hover:-translate-y-full">Book a consultation</span>
            <span aria-hidden className="absolute inset-0 translate-y-full transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-y-0">Book a consultation</span>
          </TransitionLink>
          <button
            ref={toggle}
            type="button"
            onClick={() => set({ menuOpen: !menuOpen })}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            className="label flex h-11 items-center gap-3"
          >
            <span className="relative block h-3 w-7" aria-hidden>
              <span className="absolute left-0 top-0 h-px w-full bg-current transition-transform duration-500" style={{ transform: menuOpen ? "translateY(6px) rotate(45deg)" : "none" }} />
              <span className="absolute bottom-0 left-0 h-px bg-current transition-all duration-500" style={{ width: menuOpen ? "100%" : "60%", transform: menuOpen ? "translateY(-5px) rotate(-45deg)" : "none" }} />
            </span>
            <span>{menuOpen ? "Close" : "Menu"}</span>
          </button>
        </div>
      </header>

      <div ref={overlay} id="site-menu" role="dialog" aria-modal="true" aria-label="Site menu" aria-hidden={!menuOpen} className="fixed inset-0 z-[70] bg-velvet text-ivory" style={{ visibility: "hidden" }} data-lenis-prevent>
        <div className="grid h-full grid-cols-1 gap-8 overflow-y-auto px-[var(--gutter)] pb-10 pt-[calc(var(--nav-h)+3vh)] md:grid-cols-[1fr_minmax(260px,28vw)]">
          <nav aria-label="Primary">
            <ul className="flex flex-col">
              {LINKS.map((link, index) => {
                const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <li key={link.href} className="flex items-baseline gap-4 border-b border-ivory/10 md:gap-8">
                    <span data-menu-index className="label w-8 shrink-0 text-gilt">{String(index + 1).padStart(2, "0")}</span>
                    <span className="block overflow-hidden py-1">
                      <TransitionLink
                        data-menu-link
                        href={link.href}
                        curtainLabel={link.word}
                        tabIndex={menuOpen ? 0 : -1}
                        onMouseEnter={() => setPreview(index)}
                        onFocus={() => setPreview(index)}
                        onClick={() => { if (active) set({ menuOpen: false }); }}
                        aria-current={active ? "page" : undefined}
                        className="display group relative block text-[clamp(2.3rem,6.4vw,5.6rem)] leading-[1.02] transition-colors duration-500 hover:text-gilt"
                      >
                        <span className="inline-block transition-transform duration-700 ease-[var(--ease-expo)] group-hover:translate-x-4 group-hover:italic">{link.label}</span>
                        {active && <span className="label absolute -right-2 top-1/2 translate-x-full text-gilt">· here</span>}
                      </TransitionLink>
                    </span>
                  </li>
                );
              })}
            </ul>
          </nav>
          <aside className="hidden flex-col justify-between md:flex">
            <div data-menu-preview className="relative aspect-[3/4] w-full overflow-hidden" style={{ borderRadius: "999px 999px 0 0" }}>
              {LINKS.map((link, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={link.href} src={link.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-1000 ease-[var(--ease-expo)]" style={{ opacity: preview === index ? 1 : 0, transform: preview === index ? "scale(1)" : "scale(1.12)" }} loading="lazy" />
              ))}
            </div>
            <div className="mt-8 space-y-3">
              <p data-menu-foot className="label text-mist">Event design & atmosphere</p>
              <a data-menu-foot href={instagramUrl} target="_blank" rel="noreferrer" tabIndex={menuOpen ? 0 : -1} className="display block text-3xl italic hover:text-gilt">@celebrations06</a>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
