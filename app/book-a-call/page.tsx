import type { Metadata } from "next";
import PageIntro from "@/components/pages/PageIntro";
import BookingExperience from "@/components/pages/BookingExperience";
import PageFooter from "@/components/chrome/PageFooter";
import { getSiteContent } from "@/lib/content";

export const metadata: Metadata = { title: "Book a Consultation", description: "Choose a time for a creative consultation with The Celebrations over Google Meet." };

export default async function BookPage() {
  const content = await getSiteContent();
  return (
    <>
      <PageIntro tone="light" index="Book" label="Consultation" title={<>Let&apos;s begin with <em>your story.</em></>}>
        A relaxed video call to talk through your occasion, venue, guests and the feeling you want, before any design or quotation.
      </PageIntro>
      <BookingExperience />
      <PageFooter instagramUrl={content.instagramUrl} heading="Or start shaping it yourself." />
    </>
  );
}
