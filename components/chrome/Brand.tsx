import TransitionLink from "./TransitionLink";

/** Wordmark: an italic gilt "The" set against the roman "Celebration". */
export default function Brand({ className = "" }: { className?: string }) {
  return (
    <TransitionLink href="/" curtainLabel="The Celebrations" aria-label="The Celebrations home" className={`group inline-flex items-baseline gap-[0.28em] ${className}`}>
      <em className="display text-[1.15rem] leading-none tracking-[-0.02em] text-gilt transition-transform duration-500 group-hover:-translate-y-0.5">The</em>
      <span className="display text-[1.45rem] leading-none tracking-[-0.03em]">Celebrations</span>
    </TransitionLink>
  );
}
