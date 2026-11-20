"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "@/lib/motion/gsap";
import { useExperience } from "@/lib/store";
import "../materials/ImageTransitionMaterial";
import type { ImageTransitionMaterialImpl } from "../materials/ImageTransitionMaterial";
import { loadImageTexture, textureSize } from "../useMediaTexture";

/**
 * Full-viewport plane that morphs between images with the noise-dissolve ImageTransitionShader.
 * Used by "The Art of Celebration" (categories) and the Event Studio intro (themes).
 */
export default function MorphPlane({ images, index, accent = "#f2b55e", arch = true }: { images: string[]; index: number; accent?: string; arch?: boolean }) {
  const { viewport, pointer } = useThree();
  const material = useRef<ImageTransitionMaterialImpl>(null);
  const shown = useRef<number>(-1);
  const reduced = useExperience((s) => s.reducedMotion);

  // Preload every image so morphs never wait.
  useEffect(() => { images.forEach((src) => loadImageTexture(src).catch(() => {})); }, [images]);

  useEffect(() => {
    const m = material.current;
    if (!m || !images[index]) return;
    let cancelled = false;
    loadImageTexture(images[index]).then((next) => {
      if (cancelled || !material.current) return;
      if (shown.current === -1) {
        m.uFrom = next; m.uFromSize = textureSize(next); m.uTo = next; m.uToSize = textureSize(next); m.uProgress = 0;
        shown.current = index;
        return;
      }
      // Bake the current blend into "from", then dissolve to the next image.
      if (m.uProgress > 0.5 && m.uTo) { m.uFrom = m.uTo; m.uFromSize = m.uToSize.clone(); }
      m.uTo = next; m.uToSize = textureSize(next);
      gsap.killTweensOf(m);
      m.uProgress = 0;
      if (reduced) { m.uProgress = 1; }
      else gsap.to(m, { uProgress: 1, duration: 1.6, ease: "power2.inOut" });
      gsap.to(m.uEdge, { r: new THREE.Color(accent).r, g: new THREE.Color(accent).g, b: new THREE.Color(accent).b, duration: 1 });
      shown.current = index;
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [index, images, accent, reduced]);

  useFrame((state, delta) => {
    const m = material.current;
    if (!m) return;
    m.uTime = state.clock.elapsedTime;
    m.uPointer.x = THREE.MathUtils.damp(m.uPointer.x, reduced ? 0.5 : pointer.x * 0.5 + 0.5, 3, delta);
    m.uPointer.y = THREE.MathUtils.damp(m.uPointer.y, reduced ? 0.5 : pointer.y * 0.5 + 0.5, 3, delta);
    m.uPlane.set(viewport.width, viewport.height);
  });

  return (
    <mesh>
      <planeGeometry args={[viewport.width, viewport.height, 1, 1]} />
      <imageTransitionMaterial ref={material} transparent uArch={arch ? 1 : 0} uZoom={1.04} />
    </mesh>
  );
}
