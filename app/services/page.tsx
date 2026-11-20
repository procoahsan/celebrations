import type { Metadata } from "next";
import PageIntro from "@/components/pages/PageIntro";
import ArtChapter from "@/components/home/ArtChapter";
import PageFooter from "@/components/chrome/PageFooter";
import RevealText from "@/components/motion/RevealText";
import { getCategories, getSiteContent } from "@/lib/content";

export const metadata: Metadata = { title: "The Art of Celebration", description: "The kinds of settings The Celebrations designs: ceremony arches, stages, mehndi colour, aisles and tablescapes." };
export const revalidate = 300;

export default async function ServicesPage() {
  const [categories, content] = await Promise.all([getCategories(), getSiteContent()]);
  return (
    <>
      <PageIntro index="Art" label="The Art of Celebration" title={<>Every celebration has <em>its own language.</em></>}>
        These are the settings we design most often. Every event is composed from scratch around you, so if what you imagine isn&apos;t listed, tell us.
      </PageIntro>
      <ArtChapter categories={categories} heading="Settings" chapter={1} />
      <section className="bg-ivory px-[var(--gutter)] py-[14vh] text-nocturne">
        <RevealText as="h2" className="display max-w-[18ch] text-[clamp(2.6rem,6vw,6rem)] leading-[0.92]">How a setting comes together</RevealText>
        <ol className="mt-16 grid gap-10 md:grid-cols-4">
          {[
            ["Conversation", "A consultation to understand the occasion, the people, the venue and the feeling."],
            ["Concept", "A moodboard and concept, which you can start yourself in the Event Studio."],
            ["Craft", "Florals, structures, fabrics and lighting prepared and styled by our team."],
            ["Transformation", "We set up on the day and transform the space before your guests arrive."],
          ].map(([t, d], i) => (
            <li key={t} className="border-t border-nocturne/20 pt-6">
              <span className="label text-rouge">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="display mt-4 text-3xl">{t}</h3>
              <p className="mt-3 text-nocturne/70">{d}</p>
            </li>
          ))}
        </ol>
      </section>
      <PageFooter instagramUrl={content.instagramUrl} />
    </>
  );
}
