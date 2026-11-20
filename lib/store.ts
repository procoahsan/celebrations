"use client";
import { create } from "zustand";

export type QualityTier = "high" | "medium" | "low";

interface ExperienceState {
  /** Preloader finished; choreographed entrances may start. */
  ready: boolean;
  webgl: boolean | null;
  tier: QualityTier;
  reducedMotion: boolean;
  touch: boolean;
  menuOpen: boolean;
  /** A page transition curtain is covering the screen. */
  curtain: "idle" | "covering" | "covered" | "revealing";
  chapter: { index: number; name: string } | null;
  set: (partial: Partial<Omit<ExperienceState, "set">>) => void;
}

export const useExperience = create<ExperienceState>((set) => ({
  ready: false,
  webgl: null,
  tier: "medium",
  reducedMotion: false,
  touch: false,
  menuOpen: false,
  curtain: "idle",
  chapter: null,
  set: (partial) => set(partial),
}));

/** Non-reactive scroll state shared with WebGL render loops (no React re-renders per frame). */
export const scrollState = { velocity: 0, progress: 0 };
