import "server-only";
import { cache } from "react";
import { createPublicClient, publicStorageUrl } from "@/lib/supabase/service";
import { seedCategories, seedContent, seedInstagramPosts, seedProjects, seedTemplates, seedTestimonials } from "@/lib/seed";
import { latestInstagramPermalinks } from "@/lib/integrations/instagram";
import type { CelebrationCategory, MediaItem, PortfolioProject, SiteContent, StudioTemplate, Testimonial } from "@/lib/types";

/**
 * Public content reads. When Supabase is configured, data comes from the database (RLS: published rows only)
 * and admin edits appear on the site. Without configuration, the site falls back to seeded, genuine media.
 */

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const db = createPublicClient();
  if (!db) return seedContent;
  const [{ data: rows }, { data: settings }] = await Promise.all([
    db.from("site_content").select("key,value"),
    db.from("site_settings").select("contact_email,phone,whatsapp,instagram_url,location").limit(1).maybeSingle(),
  ]);
  const overrides = Object.fromEntries((rows ?? []).map((row) => [row.key, row.value]));
  return {
    ...seedContent,
    ...overrides,
    instagramUrl: settings?.instagram_url ?? seedContent.instagramUrl,
    contactEmail: settings?.contact_email ?? seedContent.contactEmail ?? null,
    phone: settings?.phone ?? seedContent.phone ?? null,
    whatsapp: settings?.whatsapp ?? seedContent.whatsapp ?? null,
    location: settings?.location ?? seedContent.location ?? null,
  };
});

type MediaRow = { storage_path: string; poster_path: string | null; media_type: "image" | "video"; alt_text: string | null; width: number | null; height: number | null };
const toMedia = (row: MediaRow): MediaItem => ({
  kind: row.media_type,
  src: publicStorageUrl("portfolio", row.storage_path)!,
  poster: publicStorageUrl("portfolio", row.poster_path) ?? (row.media_type === "image" ? publicStorageUrl("portfolio", row.storage_path) : undefined),
  alt: row.alt_text ?? "",
  width: row.width ?? undefined,
  height: row.height ?? undefined,
});

export const getPortfolio = cache(async (): Promise<PortfolioProject[]> => {
  const db = createPublicClient();
  if (!db) return seedProjects;
  const { data, error } = await db
    .from("portfolio_projects")
    .select("slug,title,description,event_type,featured,position,cover:media_assets!portfolio_projects_cover_media_id_fkey(storage_path,poster_path,media_type,alt_text,width,height),portfolio_media(position,media:media_assets(storage_path,poster_path,media_type,alt_text,width,height))")
    .eq("published", true)
    .order("position");
  // Until the admin publishes projects, the launch portfolio (genuine supplied media) stays visible.
  if (error || !data?.length) return seedProjects;
  return data.map((row) => {
    const media = ((row.portfolio_media ?? []) as unknown as Array<{ position: number; media: MediaRow }>)
      .sort((a, b) => a.position - b.position)
      .map((entry) => toMedia(entry.media));
    const cover = row.cover ? toMedia(row.cover as unknown as MediaRow) : media[0];
    return { slug: row.slug, title: row.title, eventType: row.event_type ?? "", summary: row.description ?? "", featured: row.featured, cover, media: media.length ? media : cover ? [cover] : [] };
  }).filter((project) => project.cover);
});

export const getProject = cache(async (slug: string) => (await getPortfolio()).find((project) => project.slug === slug) ?? null);

export const getCategories = cache(async (): Promise<CelebrationCategory[]> => {
  const db = createPublicClient();
  if (!db) return seedCategories;
  const { data, error } = await db.from("celebration_categories").select("slug,name,line,description,image_path,tone,accent").eq("published", true).order("position");
  if (error || !data?.length) return seedCategories;
  return data.map((row) => ({ slug: row.slug, name: row.name, line: row.line ?? "", description: row.description ?? "", image: publicStorageUrl("portfolio", row.image_path) ?? seedCategories[0].image, tone: row.tone, accent: row.accent }));
});

export const getTemplates = cache(async (): Promise<StudioTemplate[]> => {
  const db = createPublicClient();
  if (!db) return seedTemplates;
  const { data, error } = await db.from("studio_templates").select("slug,name,definition").eq("published", true).order("position");
  if (error || !data?.length) return seedTemplates;
  return data.map((row) => ({ ...(row.definition as StudioTemplate), slug: row.slug, name: row.name }));
});

/** Only approved, genuine testimonials. Falls back to the reviews transcribed from the Instagram highlight. */
export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  const db = createPublicClient();
  if (!db) return seedTestimonials;
  const { data } = await db.from("testimonials").select("id,author,quote,event_type,source_url,image_path,featured").eq("status", "approved").order("featured", { ascending: false }).order("created_at", { ascending: false }).limit(12);
  if (!data?.length) return seedTestimonials;
  return data.map((row) => ({ id: row.id, author: row.author, quote: row.quote, eventType: row.event_type, sourceUrl: row.source_url, image: publicStorageUrl("portfolio", row.image_path) ?? null }));
});

/** Instagram post/reel permalinks for official embeds: live from the Graph API when connected, otherwise the latest public reels. */
export const getInstagramPosts = cache(async (): Promise<string[]> => {
  const live = await latestInstagramPermalinks(12).catch(() => []);
  return live.length ? live : seedInstagramPosts;
});
