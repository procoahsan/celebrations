/** Shared GLSL chunks. */
export const coverUv = /* glsl */ `
vec2 coverUv(vec2 uv, vec2 plane, vec2 image) {
  float rp = plane.x / plane.y;
  float ri = image.x / image.y;
  vec2 scale = rp > ri ? vec2(1.0, ri / rp) : vec2(rp / ri, 1.0);
  return (uv - 0.5) * scale + 0.5;
}`;

export const noise = /* glsl */ `
float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; } return v; }`;

/** Signed distance to an arch (rectangle with a semicircular top) in plane-height units. Negative inside. */
export const archSdf = /* glsl */ `
float archSdf(vec2 uv, vec2 plane) {
  float aspect = plane.x / plane.y;
  float halfW = 0.5 * aspect;
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y);
  float cy = 1.0 - halfW;
  float side = max(abs(p.x) - halfW, -p.y);
  float top = length(vec2(p.x, p.y - cy)) - halfW;
  return p.y > cy ? top : side;
}`;
