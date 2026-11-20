import TransitionLink from "./TransitionLink";
import RevealText from "@/components/motion/RevealText";

/** Closing band for inner pages: an invitation, not a generic footer. */
export default function PageFooter({ instagramUrl, heading = "Let's make your moment unforgettable." }: { instagramUrl: string; heading?: string }) {
  return (
    <footer className="relative overflow-hidden border-t border-ivory/10 bg-nocturne px-[var(--gutter)] pb-10 pt-[14vh] text-ivory">
      <RevealText as="p" className="display max-w-[14ch] text-[clamp(2.8rem,7vw,7.5rem)] leading-[0.9]">{heading}</RevealText>
      <div className="mt-10 flex flex-wrap gap-3">
        <TransitionLink href="/design-your-event" curtainLabel="Studio" className="btn-portal solid"><span className="dot" />Design Your Event</TransitionLink>
        <TransitionLink href="/book-a-call" curtainLabel="Consultation" className="btn-portal">Book a Consultation</TransitionLink>
      </div>
      <div className="mt-[12vh] flex flex-wrap items-center justify-between gap-6 border-t border-ivory/10 pt-6">
        <span className="display text-xl"><em className="text-gilt">The</em> Celebrations</span>
        <nav aria-label="Footer" className="label flex flex-wrap gap-6 opacity-80">
          <TransitionLink href="/portfolio">Portfolio</TransitionLink>
          <TransitionLink href="/services">The Art</TransitionLink>
          <TransitionLink href="/reviews">Stories</TransitionLink>
          <TransitionLink href="/contact">Contact</TransitionLink>
          <a href={instagramUrl} target="_blank" rel="noreferrer">Instagram ↗</a>
        </nav>
        <span className="label text-mist">© {new Date().getFullYear()} The Celebrations</span>
      </div>
    </footer>
  );
}
