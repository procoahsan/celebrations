# The Celebrations asset manifest

All public media is generated from the supplied WhatsApp originals by `scripts/prepare-media.mjs`, which holds the full source → output mapping. Originals stay in the project root and `media-archive/` (git-ignored).

| Output | Source | Used in |
| --- | --- | --- |
| `seq/aisle/001–096.jpg` | `WhatsApp Video 2026-11-15 at 11.40.29 AM.mp4` (real empty-hall → candlelit-aisle setup timelapse) | Chapter 02 scrubbed sequence |
| `video/candle-aisle-night.mp4` | archive `10.13.42 PM (1)` | Hero centre portal, Finale |
| `video/chandelier-aisle.mp4`, `video/rouge-arch-lounge.mp4` | archive `10.13.40 PM`, `10.13.40 PM (1)` | Hero side portals |
| `video/flower-craft.mp4`, `arch-build.mp4`, `stage-styling.mp4`, `ivory-arch-reveal.mp4` | `10.22.48 PM`, `10.14.35 PM`, archive `10.13.27 PM`, `10.13.42 PM` | Behind the Magic: Imagine, Create, Transform, Celebrate |
| `img/*.jpg` (+ `-sm`) | 20 supplied photographs | Portfolio, categories, templates, menu previews |

Intentionally **not** published:

- `10.23.20 PM.jpeg`: a "Petals & Roses – Nikkah Partition Packages" price flyer that carries a different brand name. Confirm ownership before use.
- `10.20.57 PM.jpeg` and `10.20.57 PM (1).jpeg`: welcome signs showing personal names.
- Several very short clips (`10.20.58`, `10.21.01`, `10.21.05` videos) and `10.13.40 PM (2)` / `10.13.42 PM` duplicates.

Project titles in `lib/seed.ts` are descriptive working names (no invented clients, venues or dates). Rename or replace them in Admin → Portfolio.
