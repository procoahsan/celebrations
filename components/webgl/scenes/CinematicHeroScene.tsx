"use client";
import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import { EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { gsap } from "@/lib/motion/gsap";
import { useExperience } from "@/lib/store";
import type { MediaItem } from "@/lib/types";
import MediaPlane, { type MediaPlaneHandle } from "../MediaPlane";

interface Props {
  videos: MediaItem[];
  /** 0–1 scroll progress through the pinned hero, written by ScrollTrigger. */
  progress: MutableRefObject<number>;
  /** Whether the entrance choreography may play. */
  start: boolean;
  visible: boolean;
}

const PORTAL_H = 3.3;
const PORTAL_W = PORTAL_H * (480 / 854) * 1.08;

/**
 * Scene 01: three arched video portals hung in a dark hall above a polished floor.
 * - Entrance: GSAP drives each portal's shader reveal and the camera's approach.
 * - Pointer: camera parallax with eased look-at.
 * - Scroll: the camera dollies through the centre portal; side portals drift away and dim.
 */
export default function CinematicHeroScene({ videos, progress, start, visible }: Props) {
  const { camera, size, pointer } = useThree();
  const tier = useExperience((s) => s.tier);
  const reduced = useExperience((s) => s.reducedMotion);
  const left = useRef<MediaPlaneHandle>(null);
  const center = useRef<MediaPlaneHandle>(null);
  const right = useRef<MediaPlaneHandle>(null);
  const intro = useRef({ z: 14, y: 0.6 });
  const look = useRef(new THREE.Vector3(0, 0.15, 0));
  const aspect = size.width / size.height;
  const narrow = aspect < 0.9;
  // Frame the centre portal at ~78% of the viewport height (and width on portrait screens).
  const halfTan = Math.tan(THREE.MathUtils.degToRad(17));
  const fitH = (PORTAL_H * 1.12) / 0.78 / (2 * halfTan);
  const fitW = (PORTAL_W * 1.12) / 0.62 / (2 * halfTan * aspect);
  const restZ = Math.max(fitH, fitW, 6.2);
  const sideX = narrow ? 1.75 : 2.75;
  const sideZ = narrow ? -2.4 : -1.3;

  // Entrance choreography.
  useEffect(() => {
    if (!start) return;
    const portals = [center.current, left.current, right.current];
    if (reduced) {
      portals.forEach((p) => p?.material && (p.material.uReveal = 1));
      intro.current.z = restZ; intro.current.y = 0;
      return;
    }
    const tl = gsap.timeline({ delay: 0.15 });
    tl.to(intro.current, { z: restZ, y: 0, duration: 3.4, ease: "expo.out" }, 0);
    portals.forEach((p, i) => {
      if (!p?.material) return;
      p.material.uReveal = 0;
      tl.to(p.material, { uReveal: 1, duration: 2.4, ease: "power3.inOut" }, 0.1 + i * 0.28);
      tl.fromTo(p.material, { uZoom: 1.35 }, { uZoom: 1.04, duration: 3.2, ease: "expo.out" }, 0.1 + i * 0.28);
    });
    return () => { tl.kill(); };
  }, [start, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the resting distance in sync with resizes once the entrance has finished.
  useEffect(() => { if (start && intro.current.y === 0) intro.current.z = restZ; }, [restZ, start]);

  useFrame((state, delta) => {
    const p = progress.current;
    const eased = p * p * (3 - 2 * p);
    // Dolly through the centre portal.
    const z = THREE.MathUtils.lerp(intro.current.z, 0.35, eased);
    const parallax = reduced ? 0 : 1 - eased;
    const targetX = pointer.x * 0.45 * parallax;
    const targetY = intro.current.y + pointer.y * 0.22 * parallax + eased * 0.1;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 3, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 3, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, z, 5, delta);
    look.current.set(pointer.x * 0.12 * parallax, 0.15 + eased * 0.05, 0);
    camera.lookAt(look.current);

    // Side portals drift apart and dim as the camera passes.
    const drift = eased * (narrow ? 1.6 : 2.4);
    if (left.current?.mesh) { left.current.mesh.position.x = -sideX - drift; }
    if (right.current?.mesh) { right.current.mesh.position.x = sideX + drift; }
    [left.current, right.current].forEach((portal) => {
      if (portal?.material) { portal.material.uDim = 0.78 - eased * 0.5; portal.material.uSaturation = 0.85 - eased * 0.4; }
    });
    if (center.current?.material) {
      center.current.material.uDim = 1 - eased * 0.15;
      center.current.material.uRim = 0.55 * (1 - eased);
    }
    // Idle breathing.
    if (!reduced && center.current?.mesh) center.current.mesh.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
  });

  return (
    <>
      <color attach="background" args={["#0f0b0c"]} />
      <fog attach="fog" args={["#0f0b0c", 6, 16]} />
      <ambientLight intensity={0.6} />

      <MediaPlane ref={left} media={videos[0]} width={PORTAL_W} height={PORTAL_H} position={[-sideX, 0, sideZ]} rotation={[0, 0.32, 0]} active={visible} initial={{ uReveal: 0, uDim: 0.78 }} segments={tier === "high" ? 20 : 10} />
      <MediaPlane ref={center} media={videos[1]} width={PORTAL_W * 1.12} height={PORTAL_H * 1.12} position={[0, 0, 0]} active={visible} initial={{ uReveal: 0 }} segments={tier === "high" ? 28 : 12} />
      <MediaPlane ref={right} media={videos[2]} width={PORTAL_W} height={PORTAL_H} position={[sideX, 0, sideZ]} rotation={[0, -0.32, 0]} active={visible} initial={{ uReveal: 0, uDim: 0.78 }} segments={tier === "high" ? 20 : 10} />

      {/* Polished ballroom floor reflecting the portals. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -PORTAL_H * 0.56 - 0.02, 0]}>
        <planeGeometry args={[40, 40]} />
        {tier === "high" ? (
          <MeshReflectorMaterial resolution={512} blur={[400, 120]} mixBlur={1.2} mixStrength={2.2} mirror={0.6} depthScale={0.6} minDepthThreshold={0.6} maxDepthThreshold={1.2} color="#120d0e" metalness={0.4} roughness={0.85} />
        ) : (
          <meshBasicMaterial color="#130e0f" />
        )}
      </mesh>

      {tier !== "low" && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} />
          <Vignette eskil={false} offset={0.22} darkness={0.78} />
        </EffectComposer>
      )}
    </>
  );
}
