import type { Metadata } from "next";
import PageIntro from "@/components/pages/PageIntro";
import GalleryChapter from "@/components/home/GalleryChapter";
import ProjectIndex from "@/components/pages/ProjectIndex";
import MediaArchive from "@/components/pages/MediaArchive";
import { seedArchive } from "@/lib/seed";
import PageFooter from "@/components/chrome/PageFooter";
import { getPortfolio, getSiteContent } from "@/lib/content";

export const metadata: Metadata = { title: "Portfolio", description: "Ceremony arches, stages, mehndi colour, candlelit aisles and tablescapes designed by The Celebrations." };
export const revalidate = 300;

export default async function PortfolioPage() {
  const [projects, content] = await Promise.all([getPortfolio(), getSiteContent()]);
  return (
    <>
      <PageIntro index="Work" label="Portfolio" title={<>Spaces that hold <em>the feeling.</em></>}>
        Every setting here was designed and built by our team. Walk the wall, or jump straight to a project from the index.
      </PageIntro>
      {projects.length ? (
        <>
          <GalleryChapter projects={projects} heading="The exhibition" chapter={null} pinLength={80} />
          <ProjectIndex projects={projects} />
          <MediaArchive items={seedArchive} />
        </>
      ) : (
        <p className="px-[var(--gutter)] py-24 text-ivory/70">New work is being curated. Please visit again soon.</p>
      )}
      <PageFooter instagramUrl={content.instagramUrl} />
    </>
  );
}
