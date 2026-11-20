"use client";
import type { QualityTier } from "./store";

export function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return false;
    const lose = (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context");
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function detectTier(): QualityTier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 8;
  const saveData = (nav as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (saveData || memory <= 2 || cores <= 2) return "low";
  if (touch || memory <= 4 || cores <= 4) return "medium";
  return "high";
}

export const dprFor = (tier: QualityTier): [number, number] => (tier === "high" ? [1, 1.75] : tier === "medium" ? [1, 1.25] : [0.75, 1]);
