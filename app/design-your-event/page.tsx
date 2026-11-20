import type { Metadata } from "next";
import EventStudio from "@/components/studio/EventStudio";
import { getSiteContent, getTemplates } from "@/lib/content";

export const metadata: Metadata = { title: "Event Studio", description: "Compose your celebration: build a moodboard, preview a stylized 3D concept, and send it to the The Celebrations designers." };

export default async function DesignYourEventPage({ searchParams }: { searchParams: Promise<{ theme?: string }> }) {
  const [{ theme }, templates, content] = await Promise.all([searchParams, getTemplates(), getSiteContent()]);
  return <EventStudio templates={templates} initialTheme={theme} title={content.studioTitle} statement={content.studioStatement} />;
}
