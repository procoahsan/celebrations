import type { Metadata } from "next";
import StoriesChapter from "@/components/home/StoriesChapter";
import PageFooter from "@/components/chrome/PageFooter";
import InstagramWall from "@/components/home/InstagramWall";
import { getInstagramPosts, getPortfolio, getSiteContent, getTestimonials } from "@/lib/content";

export const metadata: Metadata = { title: "Client Stories", description: "Reviews shared by The Celebrations clients on Instagram." };
export const revalidate = 300;

export default async function ReviewsPage() {
  const [testimonials, content, projects, posts] = await Promise.all([getTestimonials(), getSiteContent(), getPortfolio(), getInstagramPosts()]);
  const photos = projects.flatMap((p) => p.media.filter((m) => m.kind === "image").map((m) => m.src));
  return (
    <>
      <div className="pt-[var(--nav-h)] bg-velvet" />
      <StoriesChapter testimonials={testimonials} heading={content.storiesTitle} instagramUrl={content.instagramUrl} photos={photos} chapter={null} />
      {testimonials.length > 1 && (
        <section className="bg-velvet px-[var(--gutter)] pb-[14vh] text-ivory">
          <ul className="grid gap-px bg-ivory/10 md:grid-cols-2">
            {testimonials.map((t) => (
              <li key={t.id} className="bg-velvet p-8">
                {t.rating ? <p className="mb-3 tracking-[0.2em] text-gilt" aria-label={`${t.rating} out of 5 stars`}>{"★".repeat(t.rating)}</p> : null}
                <blockquote className="text-lg leading-relaxed">“{t.quote}”</blockquote>
                <p className="label mt-6 text-mist">{t.author}{t.eventType ? ` · ${t.eventType}` : ""}{t.sourceUrl && <> · <a className="text-gilt" href={t.sourceUrl} target="_blank" rel="noreferrer">Source on Instagram ↗</a></>}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <InstagramWall posts={posts} instagramUrl={content.instagramUrl} initial={6} />
      <PageFooter instagramUrl={content.instagramUrl} />
    </>
  );
}
