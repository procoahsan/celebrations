# The Celebrations — Art Direction

## Concept: "The Portal"

Every The Celebrations setting is organised around a threshold: a floral arch, a moon gate, a candlelit aisle, a stage. The site uses that **arch** as its visual signature. Media sits inside arched portals rendered in WebGL, and the camera moves *through* those portals between chapters. The visit itself becomes the transformation the business performs, from an empty room to a finished celebration.

All supplied footage is vertical phone video (480×854). The site never stretches it into a blurry landscape background. It composes portrait media as tall, arched, gallery-hung frames floating in a dark, atmospheric space, which reads as deliberate editorial composition.

## Colour

| Token | Hex | Role |
| --- | --- | --- |
| `--nocturne` | `#0f0b0c` | Primary stage: near-black with a warm aubergine undertone |
| `--velvet` | `#1c1316` | Raised surfaces, menus |
| `--ivory` | `#f2ebe1` | Daylight chapters (Transformation, Studio), primary text on dark |
| `--rouge` | `#9b1c2e` | The rose/velvet red that runs through the work; used sparingly for emphasis |
| `--gilt` | `#c8a46a` | Champagne gold for hairlines, numerals, the "06" mark |
| `--sage` | `#7d8b6f` | Secondary accent drawn from the floral greenery |

Chapters change atmosphere: dark opening → ivory transformation → nocturne gallery → per-category atmospheres → ivory studio → dark behind-the-scenes → finale.

## Typography

- **Display: Bodoni Moda.** High-contrast didone that fits a couture, invitation-card feel. Set very large (10–16vw) with tight tracking (−0.04em), mixing roman and *italic* inside the same line.
- **Text: Instrument Sans.** Neutral, slightly condensed grotesk for body text, UI and forms.
- **Numerals and labels: DM Mono.** Chapter indexes (`01 / 08`), media captions and coordinates, set in tracked uppercase at 11px.

## Composition principles

1. Asymmetric editorial grids with oversized type that overlaps media planes.
2. Portrait arched frames as the primary media container. No rounded-rectangle cards.
3. Generous negative space, with hairline gilt rules and index numbers as structure.
4. Each chapter has one dominant gesture: zoom, pin and scrub, curve, morph, mask, or expand.

## Motion language

- **Ease:** `expo.out` for entrances and `power3.inOut` for transitions. Nothing bounces.
- **Text:** masked line and character reveals (GSAP SplitText with `mask: "lines"`). The words rise out of a hairline as if from behind a curtain.
- **Media:** organic noise-edged reveals in shader; hover produces a soft liquid displacement around the pointer; scroll velocity bends planes slightly.
- **Transitions:** an arch-topped velvet curtain wipes between pages.
- **Reduced motion:** all scrubbed sequences become static compositions, the Lenis smooth scroll is disabled, and the WebGL entrance is skipped.

## Signature interactions

| Chapter | Gesture | Technology |
| --- | --- | --- |
| 01 Opening | Three video portals in 3D; pointer parallax; scroll dollies the camera through the centre portal | R3F, custom GLSL `DistortionMaterial`, ScrollTrigger |
| 02 Transformation | Pinned, scrubbed 96-frame image sequence from a real aisle setup timelapse, growing from an arch to full bleed | GSAP ScrollTrigger + canvas |
| 03 Gallery | Curved WebGL exhibition wall; scroll and drag rotate it; hover distortion; click opens a project | R3F, GLSL, use-gesture |
| 04 Art of Celebration | Pinned category story; noise-dissolve texture morph; atmosphere colour shifts | R3F `TransitionMaterial`, GSAP timelines |
| 05 Studio | Theme selector morphs concept imagery and leads into the Konva + 3D configurator | Konva, R3F |
| 06 Behind the Magic | Four pinned chapters with masked video transitions and a full-screen reveal | ScrollTrigger scrub, clip-path |
| 07 Stories | Editorial featured quote from approved Instagram reviews | GSAP |
| 08 Finale | A small arch expands into a full-bleed video curtain | ScrollTrigger scrub |

## Desktop / mobile

- Desktop: full WebGL, DPR up to 1.75, pointer parallax, custom cursor.
- Mobile: DPR ≤ 1.25, fewer plane segments, no postprocessing, touch drag in the gallery, shorter pin distances, no custom cursor.
- No WebGL: every WebGL scene has a DOM/CSS fallback using the same media and type.
