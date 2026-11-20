// Fallback content used when Supabase is not configured (local development / first deploy).
// Every media file here is genuine The Celebrations media supplied by the business.
// Project titles are descriptive working names the admin can rename; no clients, venues or dates are invented.
import type { CelebrationCategory, MediaItem, PortfolioProject, SiteContent, StudioTemplate } from "./types";

const img = (slug: string, alt: string): MediaItem => ({ kind: "image", src: `/media/img/${slug}.jpg`, poster: `/media/img/${slug}-sm.jpg`, alt });
const vid = (slug: string, alt: string): MediaItem => ({ kind: "video", src: `/media/video/${slug}.mp4`, poster: `/media/video/${slug}.jpg`, alt, width: 480, height: 854 });

export const seedContent: SiteContent = {
  heroTitle: "Celebrations Beyond Imagination.",
  heroStatement: "We turn moments into extraordinary experiences.",
  transformationTitle: "From an empty space to an unforgettable celebration.",
  galleryTitle: "Settings we have brought to life",
  artTitle: "The Art of Celebration",
  studioTitle: "Your Vision. Your Celebration.",
  studioStatement: "Compose a concept, move it in space, and send it to our designers.",
  behindTitle: "Behind the Magic",
  storiesTitle: "Real Client Stories",
  finaleTitle: "Let's Make Your Moment Unforgettable.",
  instagramUrl: "https://www.instagram.com/celebrations06/",
  // Public business details from the Instagram profile (editable in Admin → Website content).
  contactEmail: "Celebrations06.us@gmail.com",
  phone: "+1 346-446-8339",
  location: "Houston, Texas",
};

export const seedMedia = {
  heroVideos: [
    vid("chandelier-aisle", "A floral aisle beneath crystal chandeliers"),
    vid("candle-aisle-night", "A candlelit aisle glowing under violet light"),
    vid("rouge-arch-lounge", "Red rose arch and ivory lounge seating"),
  ],
  transformationSequence: { base: "/media/seq/aisle/", count: 96, ext: "jpg", width: 540, height: 960 },
  behind: [
    { key: "imagine", word: "Imagine", line: "Every setting starts by hand, one bloom at a time.", media: vid("flower-craft", "Preparing silk roses by hand") },
    { key: "create", word: "Create", line: "An empty room. A frame. Thousands of flowers placed with intent.", media: vid("arch-build", "Building a floral moon arch from an empty room") },
    { key: "transform", word: "Transform", line: "Seating, florals, drapery: layer by layer the room changes its mind.", media: vid("stage-styling", "Styling an ivory stage with floral runners") },
    { key: "celebrate", word: "Celebrate", line: "The last petal falls into place.", media: vid("ivory-arch-reveal", "A finished ivory floral arch and aisle") },
  ],
  finale: vid("candle-aisle-night", "A candlelit aisle at night"),
  studio: img("crystal-arch-hall", "Crystal moon gate in a banquet hall"),
};

export const seedProjects: PortfolioProject[] = [
  {
    slug: "ivory-moon-gate",
    title: "Ivory Moon Gate",
    eventType: "Nikkah ceremony setting",
    summary: "A circular gate of ivory blooms and crystal strands, framing the ceremony bench in soft daylight.",
    cover: img("ivory-arch-sanctuary", "Ivory floral moon gate with crystal strands"),
    media: [img("ivory-arch-sanctuary", "Ivory floral moon gate"), img("crystal-arch-blue", "Moon gate on blue carpet"), img("floral-column", "Tall floral column"), img("floral-column-bench", "Floral column beside the ceremony bench"), vid("pink-gold-arch", "Blush and gold floral arch")],
    featured: true,
  },
  {
    slug: "rouge-and-gold",
    title: "Rouge & Gold",
    eventType: "Reception stage",
    summary: "Velvet red, gilded candelabra and an ivory throne stage. Opulence with restraint.",
    cover: img("rouge-throne-stage", "Red and ivory throne stage"),
    media: [img("rouge-throne-stage", "Throne stage"), img("rouge-aisle-hall", "Red aisle in a banquet hall"), img("round-table-rouge", "Round table with gold candelabra"), img("banquet-rouge-chairs", "Banquet tables with red chair sashes"), vid("throne-stage-walk", "Walking up the aisle to the throne stage")],
    featured: true,
  },
  {
    slug: "crystal-moon",
    title: "Crystal Moon",
    eventType: "Ceremony arch",
    summary: "Rose and ivory florals wrapped around a crystal curtain, with a velvet seat for the couple.",
    cover: img("crystal-arch-hall", "Crystal moon arch with red velvet"),
    media: [img("crystal-arch-hall", "Crystal moon arch"), img("arch-veil", "The arch during the ceremony"), vid("crystal-arch-walk", "Walking through the crystal arch setting"), img("floral-column-aisle", "Floral columns lining the aisle")],
  },
  {
    slug: "mehndi-colour-story",
    title: "Mehndi Colour Story",
    eventType: "Mehndi celebration",
    summary: "Marigold drapes, emerald velvet and hand-painted floor art: a carnival of colour for the night before.",
    cover: img("mehndi-arch-teal", "Mehndi arch with emerald seating"),
    media: [img("mehndi-arch-teal", "Mehndi arch"), img("mehndi-drapes-sofa", "Marigold drapes and carved sofa"), img("mehndi-courtyard", "Painted floor in an outdoor courtyard"), img("mehndi-floor-hall", "Painted floor in a hall"), vid("emerald-mehndi-arch", "Rose arch against emerald drapes"), vid("mehndi-carpet", "Mehndi stage and carpet")],
    featured: true,
  },
  {
    slug: "champagne-lounge",
    title: "Champagne Lounge",
    eventType: "Stage & lounge",
    summary: "Champagne drapery swept into soft folds, with ivory seating and a low runner of roses.",
    cover: img("champagne-drape-lounge", "Champagne drape stage with ivory sofa"),
    media: [img("champagne-drape-lounge", "Champagne drape lounge"), img("ivory-stage-steps", "Ivory stage with candlelit steps"), vid("stage-styling", "Styling the stage")],
  },
  {
    slug: "candlelit-aisle",
    title: "Candlelit Aisle",
    eventType: "Aisle & entrance",
    summary: "Gold stands, hundreds of candles and a carpet of petals: the walk itself becomes the moment.",
    cover: { ...vid("candle-aisle-night", "A candlelit aisle at night"), kind: "video" },
    media: [vid("candle-aisle-night", "Candlelit aisle at night"), vid("aisle-timelapse", "Aisle setup timelapse"), img("candelabra-table", "Gold candelabra centrepiece"), vid("chandelier-aisle", "Floral aisle under chandeliers")],
  },
  {
    slug: "velvet-butterfly",
    title: "Velvet & Butterflies",
    eventType: "Lounge setting",
    summary: "Shell-backed chairs, a sea of white petals and illuminated butterflies above deep red roses.",
    cover: vid("rouge-lounge-butterfly", "Velvet lounge with illuminated butterflies"),
    media: [vid("rouge-lounge-butterfly", "Velvet lounge with butterflies"), vid("rouge-arch-lounge", "Rose arch and lounge")],
  },
];

// Categories reflect the kinds of settings visible in the supplied portfolio, not a confirmed service list.
// Replace or extend them from Admin → Categories.
export const seedCategories: CelebrationCategory[] = [
  { slug: "ceremony-arches", name: "Ceremony Arches", line: "A threshold worth crossing.", description: "Moon gates, floral columns and crystal curtains that frame the vows.", image: "/media/img/ivory-arch-sanctuary.jpg", tone: "#1b2420", accent: "#c8d2bf" },
  { slug: "stages-thrones", name: "Stages & Thrones", line: "The room's centre of gravity.", description: "Velvet, gold and ivory stages composed for the couple and the camera.", image: "/media/img/rouge-throne-stage.jpg", tone: "#2a0d13", accent: "#e1a3a9" },
  { slug: "mehndi-colour", name: "Mehndi Colour", line: "Marigold, emerald, joy.", description: "Layered drapery, painted floors and colour turned all the way up.", image: "/media/img/mehndi-drapes-sofa.jpg", tone: "#2b1606", accent: "#f2b55e" },
  { slug: "aisles-candlelight", name: "Aisles & Candlelight", line: "The walk becomes the memory.", description: "Petal runners, gold stands and candlelight to lead every entrance.", image: "/media/img/rouge-aisle-hall.jpg", tone: "#160f22", accent: "#c7b5ea" },
  { slug: "tablescapes", name: "Tablescapes", line: "Where the evening slows down.", description: "Candelabra, linens and blooms that hold the room together after the ceremony.", image: "/media/img/round-table-rouge.jpg", tone: "#1e1410", accent: "#e2c79a" },
];

export const seedTemplates: StudioTemplate[] = [
  {
    slug: "ivory-garden", name: "Ivory Garden", mood: "Soft, luminous, botanical", image: "/media/img/ivory-arch-sanctuary.jpg",
    eventTypes: ["Nikkah", "Wedding", "Engagement"],
    palette: [{ name: "Ivory", hex: "#f4efe6" }, { name: "Sage", hex: "#8d9f7f" }, { name: "Blush", hex: "#e8c4c0" }, { name: "Gold", hex: "#c8a46a" }],
    background: "#efe8dc", arrangement: "ceremony", lighting: "daylight",
    layout: [{ type: "arch", x: 0.5, y: 0.38, scale: 1.2 }, { type: "floral", x: 0.3, y: 0.62 }, { type: "floral", x: 0.7, y: 0.62 }, { type: "candles", x: 0.18, y: 0.7 }, { type: "candles", x: 0.82, y: 0.7 }, { type: "runner", x: 0.5, y: 0.86 }],
  },
  {
    slug: "rouge-royale", name: "Rouge Royale", mood: "Velvet, gilded, dramatic", image: "/media/img/rouge-throne-stage.jpg",
    eventTypes: ["Reception", "Wedding", "Walima"],
    palette: [{ name: "Rouge", hex: "#8e1b2b" }, { name: "Ivory", hex: "#f3ece2" }, { name: "Gold", hex: "#c8a46a" }, { name: "Onyx", hex: "#171112" }],
    background: "#2a1013", arrangement: "stage", lighting: "candlelit",
    layout: [{ type: "drape", x: 0.5, y: 0.3, scale: 1.3 }, { type: "sofa", x: 0.5, y: 0.52 }, { type: "floral", x: 0.24, y: 0.5 }, { type: "floral", x: 0.76, y: 0.5 }, { type: "candles", x: 0.14, y: 0.66 }, { type: "candles", x: 0.86, y: 0.66 }],
  },
  {
    slug: "mehndi-carnival", name: "Mehndi Carnival", mood: "Marigold, emerald, festive", image: "/media/img/mehndi-arch-teal.jpg",
    eventTypes: ["Mehndi", "Dholki", "Sangeet"],
    palette: [{ name: "Marigold", hex: "#e8a33d" }, { name: "Emerald", hex: "#1f5a4c" }, { name: "Fuchsia", hex: "#c2306e" }, { name: "Gold", hex: "#d7b46a" }],
    background: "#2b1606", arrangement: "stage", lighting: "golden",
    layout: [{ type: "drape", x: 0.5, y: 0.3, scale: 1.3 }, { type: "arch", x: 0.5, y: 0.4 }, { type: "sofa", x: 0.5, y: 0.6 }, { type: "lantern", x: 0.2, y: 0.72 }, { type: "lantern", x: 0.8, y: 0.72 }],
  },
  {
    slug: "champagne-soiree", name: "Champagne Soirée", mood: "Warm, refined, intimate", image: "/media/img/champagne-drape-lounge.jpg",
    eventTypes: ["Birthday", "Anniversary", "Private dinner", "Corporate"],
    palette: [{ name: "Champagne", hex: "#e3cfa8" }, { name: "Ivory", hex: "#f5efe5" }, { name: "Rose", hex: "#b4475a" }, { name: "Bronze", hex: "#8a6a3e" }],
    background: "#efe4d2", arrangement: "banquet", lighting: "golden",
    layout: [{ type: "drape", x: 0.5, y: 0.26, scale: 1.2 }, { type: "table", x: 0.3, y: 0.62 }, { type: "table", x: 0.7, y: 0.62 }, { type: "floral", x: 0.5, y: 0.5 }, { type: "candles", x: 0.5, y: 0.8 }],
  },
];

/**
 * Genuine client reviews, transcribed word for word from the business's public "Client Reviews" story
 * highlight on Instagram (emoji omitted). Personal names and handles are deliberately not shown; each links to the source.
 * Approved reviews added in Admin → Reviews replace this list.
 */
const REVIEWS_HIGHLIGHT = "https://www.instagram.com/stories/highlights/18137865493615691/";
export const seedTestimonials = [
  {
    id: "ig-highlight-nikah",
    author: "Nikah client",
    eventType: "Nikah setup",
    quote: "Thank you so much! You did such an incredible job with my Nikah setup. Everything was absolutely beautiful, and you made my special day even more memorable and magical. I'm truly so happy and grateful that I trusted you with such an important part of my celebration. Honestly, I don't even have enough words to express how much I appreciate all the effort, love, and hard work you put into everything. Everything was perfect, and it was truly worth it! Everyone loved it, and I couldn't have asked for anything better. Thank you from the bottom of my heart. You made my Nikah day even more special!",
    sourceUrl: REVIEWS_HIGHLIGHT,
  },
  {
    id: "ig-highlight-mehndi",
    author: "Mehndi & Shaadi client",
    eventType: "Recommendation shared in our highlight",
    quote: "She did an excellent job on my mehndi and Shaadi. Especially on the day of my mehndi since it took place on the day of Eid. She's an affordable and reliable decorator. I would recommend her for your event.",
    sourceUrl: REVIEWS_HIGHLIGHT,
  },
  {
    id: "ig-highlight-setup",
    author: "Client message",
    eventType: "Event setup",
    rating: 5,
    quote: "Thank you so much for the setup it was beautiful",
    sourceUrl: REVIEWS_HIGHLIGHT,
  },
];

/** Latest public reels from @celebrations06, shown with Instagram's official embed. Replaced by live Graph API media once connected. */
export const seedInstagramPosts = [
  "Dfi-eUkAOPh", "DfoESLHAPK3", "De8aTaUAkop", "Df87C-DAciE", "Df6IT4Xg-MN", "Df3n0L1AxJM",
  "Df03pxLgWlj", "Dfgay4UgQxs", "Df3nfW9AUZy", "Dfll_H7AQQc", "DfwHwaqgy9r", "DfYgIXxgjo1",
].map((code) => `https://www.instagram.com/reel/${code}/`);
