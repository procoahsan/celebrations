"use client";
import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useExperience } from "@/lib/store";
import type { PortfolioProject } from "@/lib/types";
import MediaPlane, { type MediaPlaneHandle } from "../MediaPlane";

interface Props {
  projects: PortfolioProject[];
  /** Target position along the wall in project units (0 … n-1). Written by ScrollTrigger / drag. */
  target: MutableRefObject<number>;
  onActiveChange: (index: number) => void;
  onOpen: (project: PortfolioProject) => void;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  visible: boolean;
}

const RADIUS = 7.2;

/** Camera-side rig: gentle pointer parallax and a slight roll with gallery velocity. */
function GalleryCameraRig({ velocity }: { velocity: MutableRefObject<number> }) {
  const { camera, pointer } = useThree();
  const reduced = useExperience((s) => s.reducedMotion);
  useFrame((_, delta) => {
    const k = reduced ? 0 : 1;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.35 * k, 2.5, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 0.1 + pointer.y * 0.2 * k, 2.5, delta);
    camera.rotation.z = THREE.MathUtils.damp(camera.rotation.z, -velocity.current * 0.04 * k, 4, delta);
    camera.lookAt(pointer.x * 0.4 * k, 0, -RADIUS);
  });
  return null;
}

/**
 * Scene 03: a curved exhibition wall. Projects hang as arched media planes on the inside of a cylinder;
 * scroll/drag rotates the wall, the active work comes forward at full colour while neighbours recede,
 * dim and desaturate, and planes bend slightly with velocity.
 */
export default function ImmersiveGallery({ projects, target, onActiveChange, onOpen, onHover, onSelect, visible }: Props) {
  const { size } = useThree();
  const tier = useExperience((s) => s.tier);
  const reduced = useExperience((s) => s.reducedMotion);
  const planes = useRef<(MediaPlaneHandle | null)[]>([]);
  const offset = useRef(0);
  const velocity = useRef(0);
  const active = useRef(-1);
  const narrow = size.width / size.height < 0.9;
  const spacing = narrow ? 0.5 : 0.36; // radians between works
  const h = narrow ? 3.1 : 3.4;
  const w = h * 0.66;

  useFrame((_, delta) => {
    const prev = offset.current;
    offset.current = reduced ? target.current : THREE.MathUtils.damp(offset.current, target.current, 4.5, delta);
    velocity.current = THREE.MathUtils.damp(velocity.current, (offset.current - prev) / Math.max(delta, 1e-3), 6, delta);

    const idx = Math.round(offset.current);
    if (idx !== active.current) { active.current = idx; onActiveChange(idx); }

    projects.forEach((_, i) => {
      const plane = planes.current[i];
      if (!plane?.mesh || !plane.material) return;
      const d = i - offset.current;
      const theta = d * spacing;
      const focus = Math.max(0, 1 - Math.abs(d)); // 1 at centre
      const r = RADIUS + Math.min(Math.abs(d), 3) * 0.55 - focus * 0.9;
      plane.mesh.position.set(Math.sin(theta) * r, (1 - focus) * -0.12, -Math.cos(theta) * r);
      plane.mesh.rotation.set(0, -theta, 0);
      const s = 0.86 + focus * 0.22;
      plane.mesh.scale.setScalar(s);
      plane.material.uDim = 0.42 + focus * 0.58;
      plane.material.uSaturation = 0.25 + focus * 0.75;
      plane.material.uRim = 0.25 + focus * 0.5;
      plane.material.uZoom = 1.08 - focus * 0.06;
      plane.mesh.visible = Math.abs(theta) < Math.PI * 0.62;
    });
  });

  return (
    <>
      <color attach="background" args={["#0f0b0c"]} />
      <fog attach="fog" args={["#0f0b0c", 6.5, 13]} />
      <GalleryCameraRig velocity={velocity} />
      {projects.map((project, i) => (
        <MediaPlane
          key={project.slug}
          ref={(handle) => { planes.current[i] = handle; }}
          media={project.cover}
          width={w}
          height={h}
          segments={tier === "high" ? 24 : 10}
          velocityFactor={1.4}
          active={visible && i === active.current}
          onClick={(event) => { event.stopPropagation(); if (Math.abs(i - offset.current) < 0.5) onOpen(project); else onSelect(i); }}
          onHoverChange={(hovered) => onHover(hovered ? i : null)}
        />
      ))}
    </>
  );
}
