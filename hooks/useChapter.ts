"use client";
import { type RefObject } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { useExperience } from "@/lib/store";

/** Registers a homepage chapter so the navigation can show "03 — Gallery" while it is in view. */
export function useChapter(ref: RefObject<HTMLElement | null>, index: number, name: string) {
  const set = useExperience((s) => s.set);
  useGSAP(() => {
    if (!ref.current) return;
    ScrollTrigger.create({
      trigger: ref.current,
      start: "top 55%",
      end: "bottom 55%",
      refreshPriority: -1,
      onToggle: (self) => { if (self.isActive) set({ chapter: { index, name } }); },
    });
  }, { scope: ref });
}
