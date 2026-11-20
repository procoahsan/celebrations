"use client";
import { forwardRef, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { scrollState, useExperience } from "@/lib/store";
import type { MediaItem } from "@/lib/types";
import "./materials/DistortionMaterial";
import type { DistortionMaterialImpl } from "./materials/DistortionMaterial";
import { textureSize, useMediaTexture } from "./useMediaTexture";

export interface MediaPlaneProps {
  media: MediaItem;
  width: number;
  height: number;
  active?: boolean;
  arch?: boolean;
  rim?: number;
  bend?: number;
  segments?: number;
  hoverable?: boolean;
  /** Multiplier on scroll velocity distortion. */
  velocityFactor?: number;
  postersOnly?: boolean;
  initial?: Partial<Pick<DistortionMaterialImpl, "uReveal" | "uDim" | "uSaturation" | "uZoom" | "uOpacity">>;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  onHoverChange?: (hovered: boolean) => void;
  position?: [number, number, number];
  rotation?: [number, number, number];
  renderOrder?: number;
}

export interface MediaPlaneHandle { mesh: THREE.Mesh | null; material: DistortionMaterialImpl | null }

/** Arch-masked media plane with pointer-driven liquid distortion and scroll-velocity bend. */
const MediaPlane = forwardRef<MediaPlaneHandle, MediaPlaneProps>(function MediaPlane(
  { media, width, height, active = true, arch = true, rim = 0.55, bend = 0, segments = 24, hoverable = true, velocityFactor = 1, postersOnly, initial, onClick, onHoverChange, position, rotation, renderOrder },
  ref,
) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<DistortionMaterialImpl>(null);
  const hover = useRef(0);
  const pointer = useRef(new THREE.Vector2(0.5, 0.5));
  const tier = useExperience((s) => s.tier);
  const reduced = useExperience((s) => s.reducedMotion);
  const texture = useMediaTexture(media, { active, postersOnly: postersOnly ?? tier === "low", small: tier !== "high" });

  useImperativeHandle(ref, () => ({ get mesh() { return mesh.current; }, get material() { return material.current; } }), []);

  useFrame((state, delta) => {
    const m = material.current;
    if (!m) return;
    m.uTime = state.clock.elapsedTime;
    if (texture && m.uMap !== texture) { m.uMap = texture; m.uImage = textureSize(texture); }
    if (texture instanceof THREE.VideoTexture) m.uImage = textureSize(texture);
    m.uHover = THREE.MathUtils.damp(m.uHover, reduced ? 0 : hover.current, 4, delta);
    m.uPointer.lerp(pointer.current, 1 - Math.exp(-8 * delta));
    const v = reduced ? 0 : THREE.MathUtils.clamp(scrollState.velocity * 0.04 * velocityFactor, -2.5, 2.5);
    m.uVelocity = THREE.MathUtils.damp(m.uVelocity, v, 6, delta);
  });

  return (
    <mesh
      ref={mesh}
      position={position}
      rotation={rotation}
      renderOrder={renderOrder}
      onClick={onClick}
      onPointerMove={hoverable ? (e) => { if (e.uv) pointer.current.copy(e.uv); } : undefined}
      onPointerOver={hoverable ? () => { hover.current = 1; onHoverChange?.(true); } : undefined}
      onPointerOut={hoverable ? () => { hover.current = 0; onHoverChange?.(false); } : undefined}
    >
      <planeGeometry args={[width, height, segments, Math.round(segments * (height / width))]} />
      <distortionMaterial
        ref={material}
        transparent
        depthWrite={false}
        uPlane={new THREE.Vector2(width, height)}
        uArch={arch ? 1 : 0}
        uRim={rim}
        uBend={bend}
        uReveal={initial?.uReveal ?? 1}
        uDim={initial?.uDim ?? 1}
        uSaturation={initial?.uSaturation ?? 1}
        uZoom={initial?.uZoom ?? 1}
        uOpacity={initial?.uOpacity ?? 1}
        uGrain={tier === "low" ? 0 : 0.03}
        visible={Boolean(texture)}
      />
    </mesh>
  );
});

export default MediaPlane;
