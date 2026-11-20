// Prepares web-optimised media from the supplied WhatsApp originals.
// Usage: node scripts/prepare-media.mjs
// Requires the dev dependency `ffmpeg-static`. Originals are never modified.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "public", "media");
const A = (p) => path.join(root, "media-archive", p);
const R = (p) => path.join(root, p);

const images = {
  "ivory-arch-sanctuary": R("WhatsApp Image 2026-11-14 at 10.17.25 PM.jpeg"),
  "mehndi-courtyard": A("WhatsApp Unknown 2026-11-15 at 11.41.51 PM/WhatsApp Image 2026-11-14 at 10.15.52 PM (1).jpeg"),
  "rouge-aisle-hall": A("WhatsApp Unknown 2026-11-15 at 11.41.51 PM/WhatsApp Image 2026-11-14 at 10.15.52 PM (2).jpeg"),
  "mehndi-arch-teal": A("WhatsApp Unknown 2026-11-15 at 11.41.51 PM/WhatsApp Image 2026-11-14 at 10.15.52 PM (3).jpeg"),
  "crystal-arch-hall": A("WhatsApp Unknown 2026-11-15 at 11.41.51 PM/WhatsApp Image 2026-11-14 at 10.15.52 PM (4).jpeg"),
  "rouge-throne-stage": A("WhatsApp Unknown 2026-11-15 at 11.41.51 PM/WhatsApp Image 2026-11-14 at 10.15.52 PM.jpeg"),
  "floral-column": A("WhatsApp Unknown 2026-11-15 at 11.41.54 PM/WhatsApp Image 2026-11-14 at 10.16.46 PM (1).jpeg"),
  "floral-column-bench": A("WhatsApp Unknown 2026-11-15 at 11.41.54 PM/WhatsApp Image 2026-11-14 at 10.16.46 PM (2).jpeg"),
  "mehndi-drapes": A("WhatsApp Unknown 2026-11-15 at 11.41.54 PM/WhatsApp Image 2026-11-14 at 10.16.46 PM.jpeg"),
  "floral-column-aisle": A("WhatsApp Unknown 2026-11-15 at 11.41.54 PM/WhatsApp Image 2026-11-14 at 10.16.47 PM (1).jpeg"),
  "crystal-arch-blue": A("WhatsApp Unknown 2026-11-15 at 11.41.54 PM/WhatsApp Image 2026-11-14 at 10.16.47 PM.jpeg"),
  "arch-veil": A("WhatsApp Unknown 2026-11-15 at 11.42.10 PM/WhatsApp Image 2026-11-14 at 10.20.54 PM (1).jpeg"),
  "candelabra-table": A("WhatsApp Unknown 2026-11-15 at 11.42.10 PM/WhatsApp Image 2026-11-14 at 10.20.54 PM.jpeg"),
  "round-table-rouge": A("WhatsApp Unknown 2026-11-15 at 11.42.10 PM/WhatsApp Image 2026-11-14 at 10.21.05 PM (1).jpeg"),
  "mehndi-floor-hall": A("WhatsApp Unknown 2026-11-15 at 11.42.10 PM/WhatsApp Image 2026-11-14 at 10.21.05 PM (2).jpeg"),
  "banquet-rouge-chairs": A("WhatsApp Unknown 2026-11-15 at 11.42.10 PM/WhatsApp Image 2026-11-14 at 10.21.05 PM (3).jpeg"),
  "mehndi-drapes-wide": A("WhatsApp Unknown 2026-11-15 at 11.42.10 PM/WhatsApp Image 2026-11-14 at 10.21.05 PM (4).jpeg"),
  "mehndi-drapes-sofa": A("WhatsApp Unknown 2026-11-15 at 11.42.10 PM/WhatsApp Image 2026-11-14 at 10.21.05 PM (5).jpeg"),
  "ivory-stage-steps": A("WhatsApp Unknown 2026-11-15 at 11.42.10 PM/WhatsApp Image 2026-11-14 at 10.21.05 PM (6).jpeg"),
  "champagne-drape-lounge": A("WhatsApp Unknown 2026-11-15 at 11.42.10 PM/WhatsApp Image 2026-11-14 at 10.21.05 PM.jpeg"),
};

const V1 = "WhatsApp Unknown 2026-11-15 at 11.41.36 PM/";
const V4 = "WhatsApp Unknown 2026-11-15 at 11.42.10 PM/";
// [source, max seconds]
const videos = {
  "candle-aisle-night": [A(V1 + "WhatsApp Video 2026-11-14 at 10.13.42 PM (1).mp4"), 10],
  "chandelier-aisle": [A(V1 + "WhatsApp Video 2026-11-14 at 10.13.40 PM.mp4"), 14],
  "rouge-arch-lounge": [A(V1 + "WhatsApp Video 2026-11-14 at 10.13.40 PM (1).mp4"), 12],
  "aisle-timelapse": [R("WhatsApp Video 2026-11-15 at 11.40.29 AM.mp4"), 25],
  "arch-build": [R("WhatsApp Video 2026-11-14 at 10.14.35 PM.mp4"), 44],
  "flower-craft": [R("WhatsApp Video 2026-11-14 at 10.22.48 PM.mp4"), 16],
  "stage-styling": [A(V1 + "WhatsApp Video 2026-11-14 at 10.13.27 PM.mp4"), 16],
  "ivory-arch-reveal": [A(V1 + "WhatsApp Video 2026-11-14 at 10.13.42 PM.mp4"), 14],
  "crystal-arch-walk": [A(V4 + "WhatsApp Video 2026-11-14 at 10.21.04 PM.mp4"), 14],
  "throne-stage-walk": [R("WhatsApp Video 2026-11-14 at 10.14.05 PM.mp4"), 14],
  "rouge-lounge-butterfly": [R("WhatsApp Video 2026-11-14 at 10.21.30 PM.mp4"), 14],
  "mehndi-carpet": [A(V1 + "WhatsApp Video 2026-11-14 at 10.13.29 PM.mp4"), 12],
  "mehndi-emerald": [A(V1 + "WhatsApp Video 2026-11-14 at 10.13.32 PM.mp4"), 12],
  "emerald-mehndi-arch": [A(V4 + "WhatsApp Video 2026-11-14 at 10.20.57 PM.mp4"), 12],
  "pink-gold-arch": [R("WhatsApp Video 2026-11-14 at 10.15.04 PM.mp4"), 14],
};

const run = (args) => execFileSync(ffmpeg, ["-loglevel", "error", "-y", ...args], { stdio: "inherit" });
const ensure = (d) => mkdirSync(d, { recursive: true });

ensure(path.join(out, "img"));
ensure(path.join(out, "video"));

for (const [slug, src] of Object.entries(images)) {
  if (!existsSync(src)) { console.warn("missing", src); continue; }
  run(["-i", src, "-vf", "scale='min(1800,iw)':'min(1800,ih)':force_original_aspect_ratio=decrease", "-q:v", "4", path.join(out, "img", `${slug}.jpg`)]);
  run(["-i", src, "-vf", "scale='min(820,iw)':'min(820,ih)':force_original_aspect_ratio=decrease", "-q:v", "5", path.join(out, "img", `${slug}-sm.jpg`)]);
  console.log("image", slug);
}

for (const [slug, [src, seconds]] of Object.entries(videos)) {
  if (!existsSync(src)) { console.warn("missing", src); continue; }
  run(["-i", src, "-t", String(seconds), "-an", "-vf", "scale=480:-2,fps=30", "-c:v", "libx264", "-preset", "slow", "-crf", "31", "-maxrate", "1000k", "-bufsize", "2000k", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path.join(out, "video", `${slug}.mp4`)]);
  run(["-ss", "1.2", "-i", src, "-frames:v", "1", "-vf", "scale=480:-2", "-q:v", "4", path.join(out, "video", `${slug}.jpg`)]);
  console.log("video", slug);
}

// Scroll-scrubbed image sequence from the genuine aisle setup timelapse.
const seqDir = path.join(out, "seq", "aisle");
if (existsSync(seqDir)) rmSync(seqDir, { recursive: true });
ensure(seqDir);
const FRAMES = 96;
run(["-i", videos["aisle-timelapse"][0], "-vf", `fps=${FRAMES}/24.8,scale=540:-2`, "-frames:v", String(FRAMES), "-q:v", "8", path.join(seqDir, "%03d.jpg")]);
console.log("sequence frames", readdirSync(seqDir).length);
