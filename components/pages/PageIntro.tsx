import RevealText from "@/components/motion/RevealText";

/** Editorial page opening shared by inner pages. */
export default function PageIntro({ index, label, title, children, tone = "dark" }: { index: string; label: string; title: React.ReactNode; children?: React.ReactNode; tone?: "dark" | "light" }) {
  const light = tone === "light";
  return (
    <header className={`relative px-[var(--gutter)] pb-[8vh] pt-[calc(var(--nav-h)+10vh)] ${light ? "bg-ivory text-nocturne" : "bg-nocturne text-ivory"}`}>
      <p className="label"><span className={light ? "text-rouge" : "text-gilt"}>({index})</span>&nbsp; {label}</p>
      <RevealText as="h1" trigger="immediate" delay={0.2} className={`display mt-6 max-w-[16ch] text-[clamp(3.2rem,9vw,10rem)] leading-[0.88] ${light ? "[&_em]:text-rouge" : "[&_em]:text-gilt"}`}>{title}</RevealText>
      {children && <div className={`mt-8 max-w-[34rem] text-lg ${light ? "text-nocturne/75" : "text-ivory/75"}`}>{children}</div>}
    </header>
  );
}
