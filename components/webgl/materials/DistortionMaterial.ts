import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend, type ThreeElement } from "@react-three/fiber";
import { archSdf, coverUv, noise } from "./glsl";

/**
 * Media material used by hero portals and the gallery.
 * - uHover/uPointer: liquid ripple + bulge around the pointer (hover interaction)
 * - uVelocity: scroll-velocity bend and a restrained chromatic split
 * - uReveal: organic, noise-edged rise-in mask
 * - uArch: arch-shaped alpha mask with a hairline gilt rim (uRim)
 * - uBend: cylindrical curvature for curved gallery walls
 */
export const DistortionMaterial = shaderMaterial(
  {
    uMap: null as THREE.Texture | null,
    uPlane: new THREE.Vector2(1, 1.6),
    uImage: new THREE.Vector2(1, 1.6),
    uTime: 0,
    uHover: 0,
    uPointer: new THREE.Vector2(0.5, 0.5),
    uVelocity: 0,
    uReveal: 1,
    uArch: 1,
    uRim: 0.6,
    uBend: 0,
    uDim: 1,
    uSaturation: 1,
    uZoom: 1,
    uOpacity: 1,
    uGrain: 0.035,
    uRimColor: new THREE.Color("#c8a46a"),
  },
  /* glsl */ `
  uniform float uTime; uniform float uHover; uniform vec2 uPointer; uniform float uVelocity; uniform float uBend;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.z += sin(uv.x * 3.14159) * clamp(uVelocity, -2.0, 2.0) * 0.06;
    p.z -= p.x * p.x * uBend;
    float d = distance(uv, uPointer);
    p.z += smoothstep(0.5, 0.0, d) * uHover * 0.06;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`,
  /* glsl */ `
  precision highp float;
  uniform sampler2D uMap; uniform vec2 uPlane; uniform vec2 uImage; uniform float uTime; uniform float uHover;
  uniform vec2 uPointer; uniform float uVelocity; uniform float uReveal; uniform float uArch; uniform float uRim;
  uniform float uDim; uniform float uSaturation; uniform float uZoom; uniform float uOpacity; uniform float uGrain; uniform vec3 uRimColor;
  varying vec2 vUv;
  ${coverUv}
  ${noise}
  ${archSdf}
  void main() {
    vec2 uv = vUv;
    vec2 cuv = coverUv((uv - 0.5) / uZoom + 0.5, uPlane, uImage);

    // Liquid ripple around the pointer.
    vec2 toP = uv - uPointer;
    float d = length(toP * vec2(uPlane.x / uPlane.y, 1.0));
    float ripple = sin(d * 34.0 - uTime * 3.2) * smoothstep(0.32, 0.0, d) * uHover * 0.014;
    cuv += normalize(toP + 1e-5) * ripple;
    cuv += (vec2(vnoise(uv * 6.0 + uTime * 0.6), vnoise(uv * 6.0 - uTime * 0.6)) - 0.5) * 0.006 * uHover;

    // Restrained chromatic split from scroll velocity.
    float shift = clamp(uVelocity, -3.0, 3.0) * 0.0025;
    vec3 col = vec3(texture2D(uMap, cuv + vec2(0.0, shift)).r, texture2D(uMap, cuv).g, texture2D(uMap, cuv - vec2(0.0, shift)).b);

    float l = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(l), col, uSaturation) * uDim;
    col += (hash21(uv * 900.0 + fract(uTime) * 37.0) - 0.5) * uGrain;

    float alpha = 1.0;
    if (uArch > 0.5) {
      float sd = archSdf(uv, uPlane);
      float aa = fwidth(sd) * 1.2;
      alpha = 1.0 - smoothstep(-aa, aa, sd);
      float rim = (1.0 - smoothstep(0.0, aa * 1.5, abs(sd + 0.006))) * uRim;
      col = mix(col, uRimColor, rim);
    }

    // Organic reveal from the base upward.
    float n = fbm(uv * 3.5 + vec2(0.0, uTime * 0.08));
    float t = uv.y * 0.82 + n * 0.18;
    float reveal = 1.0 - smoothstep(uReveal * 1.22 - 0.14, uReveal * 1.22, t);

    gl_FragColor = vec4(col, alpha * reveal * uOpacity);
    #include <colorspace_fragment>
  }`,
);

extend({ DistortionMaterial });

export type DistortionMaterialImpl = THREE.ShaderMaterial & {
  uMap: THREE.Texture | null; uPlane: THREE.Vector2; uImage: THREE.Vector2; uTime: number; uHover: number; uPointer: THREE.Vector2;
  uVelocity: number; uReveal: number; uArch: number; uRim: number; uBend: number; uDim: number; uSaturation: number; uZoom: number; uOpacity: number; uGrain: number;
};

declare module "@react-three/fiber" {
  interface ThreeElements { distortionMaterial: ThreeElement<typeof DistortionMaterial> }
}
