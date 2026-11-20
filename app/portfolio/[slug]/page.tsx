import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectDetail from "@/components/pages/ProjectDetail";
import PageFooter from "@/components/chrome/PageFooter";
import { getPortfolio, getSiteContent } from "@/lib/content";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getPortfolio()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = (await getPortfolio()).find((p) => p.slug === slug);
  if (!project) return {};
  return { title: project.title, description: project.summary, openGraph: { images: [project.cover.poster ?? project.cover.src] } };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [projects, content] = await Promise.all([getPortfolio(), getSiteContent()]);
  const index = projects.findIndex((p) => p.slug === slug);
  if (index < 0) notFound();
  const next = projects.length > 1 ? projects[(index + 1) % projects.length] : null;
  return (
    <>
      <ProjectDetail project={projects[index]} next={next} index={index} total={projects.length} />
      <PageFooter instagramUrl={content.instagramUrl} heading="Imagine this, made yours." />
    </>
  );
}
