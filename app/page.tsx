import HeroChapter from "@/components/home/HeroChapter";
import TransformationChapter from "@/components/home/TransformationChapter";
import GalleryChapter from "@/components/home/GalleryChapter";
import ArtChapter from "@/components/home/ArtChapter";
import StudioTeaser from "@/components/home/StudioTeaser";
import BehindChapter from "@/components/home/BehindChapter";
import StoriesChapter from "@/components/home/StoriesChapter";
import FinaleChapter from "@/components/home/FinaleChapter";
import InstagramWall from "@/components/home/InstagramWall";
import { getCategories, getPortfolio, getSiteContent, getTemplates, getTestimonials, getInstagramPosts } from "@/lib/content";
import { seedMedia } from "@/lib/seed";

export const revalidate = 300;

export default async function Home() {
  const [content, projects, categories, templates, testimonials, posts] = await Promise.all([getSiteContent(), getPortfolio(), getCategories(), getTemplates(), getTestimonials(), getInstagramPosts()]);
  const photos = projects.flatMap((p) => p.media.filter((m) => m.kind === "image").map((m) => m.src)).slice(0, 8);

  return (
    <>
      <HeroChapter title={content.heroTitle} statement={content.heroStatement} videos={seedMedia.heroVideos} />
      <TransformationChapter title={content.transformationTitle} sequence={seedMedia.transformationSequence} />
      {projects.length > 0 && <GalleryChapter projects={projects} heading={content.galleryTitle} />}
      <ArtChapter categories={categories} heading={content.artTitle} />
      <StudioTeaser templates={templates} title={content.studioTitle} statement={content.studioStatement} />
      <BehindChapter steps={seedMedia.behind} heading={content.behindTitle} />
      <StoriesChapter testimonials={testimonials} heading={content.storiesTitle} instagramUrl={content.instagramUrl} photos={photos} />
      <InstagramWall posts={posts} instagramUrl={content.instagramUrl} initial={3} />
      <FinaleChapter title={content.finaleTitle} media={seedMedia.finale} instagramUrl={content.instagramUrl} />
    </>
  );
}
