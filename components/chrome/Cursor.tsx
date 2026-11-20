"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/motion/gsap";
import { useExperience } from "@/lib/store";

/**
 * Precise-pointer-only cursor. The native cursor is hidden only after this component has mounted
 * and received a real pointer move (class `has-cursor`), so a failure never leaves the user without a cursor.
 * Elements opt in with data-cursor="view|drag|link|hide" and optional data-cursor-label.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const [mode, setMode] = useState<string>("default");
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine) and (hover: hover)");
    const update = () => setEnabled(fine.matches);
    update();
    fine.addEventListener("change", update);
    return () => fine.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled || !dot.current || !ring.current) return;
    const html = document.documentElement;
    const dx = gsap.quickTo(dot.current, "x", { duration: 0.08, ease: "power3" });
    const dy = gsap.quickTo(dot.current, "y", { duration: 0.08, ease: "power3" });
    const rx = gsap.quickTo(ring.current, "x", { duration: reducedMotion ? 0.01 : 0.5, ease: "power3" });
    const ry = gsap.quickTo(ring.current, "y", { duration: reducedMotion ? 0.01 : 0.5, ease: "power3" });
    let shown = false;

    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      if (!shown) {
        shown = true;
        html.classList.add("has-cursor");
        gsap.to([dot.current, ring.current], { autoAlpha: 1, duration: 0.3 });
      }
      dx(event.clientX); dy(event.clientY); rx(event.clientX); ry(event.clientY);
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor], a, button, [role=button], label, input, textarea, select");
      if (!target) { setMode("default"); setLabel(""); return; }
      const explicit = target.dataset.cursor;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) { setMode("text"); setLabel(""); return; }
      setMode(explicit ?? "link");
      setLabel(target.dataset.cursorLabel ?? (explicit === "view" ? "View" : explicit === "drag" ? "Drag" : ""));
    };
    const leave = () => gsap.to([dot.current, ring.current], { autoAlpha: 0, duration: 0.3 });
    const enter = () => shown && gsap.to([dot.current, ring.current], { autoAlpha: 1, duration: 0.3 });
    const down = () => gsap.to(ring.current, { scale: 0.85, duration: 0.2 });
    const up = () => gsap.to(ring.current, { scale: 1, duration: 0.4 });

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    document.addEventListener("pointerenter", enter);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      html.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("pointerenter", enter);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, [enabled, reducedMotion]);

  if (!enabled) return null;
  const big = mode === "view" || mode === "drag";
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100] mix-blend-difference">
      <div ref={dot} className="fixed left-0 top-0 h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0" style={{ visibility: "hidden", scale: mode === "text" || big ? 0 : 1, transition: "scale .3s" }} />
      <div
        ref={ring}
        className="fixed left-0 top-0 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/70 text-[10px] uppercase tracking-[0.2em] text-white opacity-0"
        style={{
          visibility: "hidden",
          width: big ? 96 : mode === "link" ? 54 : mode === "text" ? 4 : 34,
          height: big ? 96 : mode === "link" ? 54 : mode === "text" ? 26 : 34,
          borderRadius: mode === "text" ? 2 : 999,
          background: big ? "white" : "transparent",
          color: big ? "black" : "white",
          fontFamily: "var(--font-mono)",
          transition: "width .45s cubic-bezier(.16,1,.3,1), height .45s cubic-bezier(.16,1,.3,1), background .3s, border-radius .3s",
        }}
      >
        {big && <span className="flex items-center gap-1">{mode === "drag" && "←"} {label} {mode === "drag" && "→"}</span>}
      </div>
    </div>
  );
}
