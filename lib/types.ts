export type MediaKind = "image" | "video";

export interface MediaItem {
  kind: MediaKind;
  src: string;
  /** Poster for videos; small image for textures on mobile. */
  poster?: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface PortfolioProject {
  slug: string;
  title: string;
  eventType: string;
  summary: string;
  cover: MediaItem;
  media: MediaItem[];
  featured?: boolean;
}

export interface CelebrationCategory {
  slug: string;
  name: string;
  /** Short editorial line; not a service claim. */
  line: string;
  description: string;
  image: string;
  /** Atmosphere colour applied to the scene background. */
  tone: string;
  accent: string;
}

export interface Testimonial {
  id: string;
  author: string;
  quote: string;
  eventType?: string | null;
  sourceUrl?: string | null;
  image?: string | null;
  /** Star rating when the client gave one. */
  rating?: number;
}

export interface SiteContent {
  heroTitle: string;
  heroStatement: string;
  transformationTitle: string;
  galleryTitle: string;
  artTitle: string;
  studioTitle: string;
  studioStatement: string;
  behindTitle: string;
  storiesTitle: string;
  finaleTitle: string;
  instagramUrl: string;
  contactEmail?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  location?: string | null;
}

export interface StudioPaletteSwatch { name: string; hex: string }

export interface StudioTemplate {
  slug: string;
  name: string;
  mood: string;
  image: string;
  eventTypes: string[];
  palette: StudioPaletteSwatch[];
  background: string;
  /** Initial moodboard layout (normalised 0–1 coordinates). */
  layout: Array<{ type: string; x: number; y: number; scale?: number; rotation?: number }>;
  arrangement: "ceremony" | "stage" | "banquet";
  lighting: "golden" | "candlelit" | "daylight";
}
