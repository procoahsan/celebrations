import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend, type ThreeElement } from "@react-three/fiber";
import { archSdf, coverUv, noise } from "./glsl";

/** Noise-dissolve blend between two textures, used for category and theme morphs. */
export const ImageTransitionMaterial = shaderMaterial(
  {
    uFrom: null as THREE.Texture | null,
    uTo: null as THREE.Texture | null,
    uFromSize: new THREE.Vector2(1, 1),
    uToSize: new THREE.Vector2(1, 1),
    uPlane: new THREE.Vector2(1, 1.4),
    uProgress: 0,
    uTime: 0,
    uArch: 1,
    uEdge: new THREE.Color("#f2b55e"),
    uPointer: new THREE.Vector2(0.5, 0.5),
    uZoom: 1,
  },
  /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  /* glsl */ `
  precision highp float;
  uniform sampler2D uFrom; uniform sampler2D uTo; uniform vec2 uFromSize; uniform vec2 uToSize; uniform vec2 uPlane;
  uniform float uProgress; uniform float uTime; uniform float uArch; uniform vec3 uEdge; uniform vec2 uPointer; uniform float uZoom;
  varying vec2 vUv;
  ${coverUv}
  ${noise}
  ${archSdf}
  void main() {
    vec2 uv = vUv;
    vec2 parallax = (uPointer - 0.5) * 0.02;
    float n = fbm(uv * 2.6 + uTime * 0.05);
    float field = n * 0.65 + (1.0 - uv.y) * 0.35;
    float p = uProgress * 1.3 - 0.15;
    float mask = smoothstep(p - 0.08, p + 0.08, field);
    float edge = smoothstep(0.0, 0.08, 0.08 - abs(field - p));
    vec2 offFrom = vec2(0.0, (1.0 - mask) * 0.06 * n);
    vec2 offTo = vec2(0.0, -mask * 0.06 * n);
    vec4 a = texture2D(uFrom, coverUv((uv - 0.5) / (uZoom + uProgress * 0.08) + 0.5 + parallax + offFrom, uPlane, uFromSize));
    vec4 b = texture2D(uTo, coverUv((uv - 0.5) / (uZoom + (1.0 - uProgress) * 0.08) + 0.5 + parallax + offTo, uPlane, uToSize));
    vec3 col = mix(b.rgb, a.rgb, mask);
    col += uEdge * edge * 0.55;
    float alpha = 1.0;
    if (uArch > 0.5) { float sd = archSdf(uv, uPlane); float aa = fwidth(sd) * 1.2; alpha = 1.0 - smoothstep(-aa, aa, sd); }
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }`,
);

extend({ ImageTransitionMaterial });

export type ImageTransitionMaterialImpl = THREE.ShaderMaterial & {
  uFrom: THREE.Texture | null; uTo: THREE.Texture | null; uFromSize: THREE.Vector2; uToSize: THREE.Vector2; uPlane: THREE.Vector2;
  uProgress: number; uTime: number; uArch: number; uEdge: THREE.Color; uPointer: THREE.Vector2; uZoom: number;
};

declare module "@react-three/fiber" {
  interface ThreeElements { imageTransitionMaterial: ThreeElement<typeof ImageTransitionMaterial> }
}
