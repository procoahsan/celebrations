"use client";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import type { MediaItem } from "@/lib/types";

const loader = typeof window !== "undefined" ? new THREE.TextureLoader() : null;
const imageCache = new Map<string, Promise<THREE.Texture>>();

function prepare(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

export function loadImageTexture(src: string) {
  if (!imageCache.has(src)) {
    imageCache.set(src, new Promise((resolve, reject) => loader!.load(src, (t) => resolve(prepare(t)), undefined, reject)));
  }
  return imageCache.get(src)!;
}

export const textureSize = (texture: THREE.Texture | null) => {
  const image = texture?.image as { videoWidth?: number; videoHeight?: number; width?: number; height?: number } | undefined;
  return new THREE.Vector2(image?.videoWidth || image?.width || 1, image?.videoHeight || image?.height || 1);
};

/**
 * Returns a texture for an image or video MediaItem.
 * Videos show their poster immediately, swap to a VideoTexture once frames are decodable,
 * and only play while `active` (scene visible) to save decoding and battery.
 * `postersOnly` keeps low-tier devices on still images.
 */
export function useMediaTexture(media: MediaItem | undefined, { active = true, postersOnly = false, small = false } = {}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const video = useMemo(() => {
    if (!media || media.kind !== "video" || postersOnly || typeof document === "undefined") return null;
    const el = document.createElement("video");
    el.src = media.src;
    el.muted = true;
    el.loop = true;
    el.playsInline = true;
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    return el;
  }, [media, postersOnly]);

  // Poster / image texture.
  useEffect(() => {
    if (!media) return;
    let cancelled = false;
    const still = media.kind === "video" ? media.poster : small && media.poster ? media.poster : media.src;
    if (still) loadImageTexture(still).then((t) => { if (!cancelled) setTexture((current) => (current instanceof THREE.VideoTexture ? current : t)); }).catch(() => {});
    return () => { cancelled = true; };
  }, [media, small]);

  // Video texture.
  useEffect(() => {
    if (!video) return;
    const vt = prepare(new THREE.VideoTexture(video));
    const ready = () => setTexture(vt);
    video.addEventListener("loadeddata", ready, { once: true });
    return () => {
      video.removeEventListener("loadeddata", ready);
      video.pause();
      video.removeAttribute("src");
      video.load();
      vt.dispose();
    };
  }, [video]);

  useEffect(() => {
    if (!video) return;
    if (active) video.play().catch(() => {});
    else video.pause();
  }, [active, video]);

  return texture;
}
