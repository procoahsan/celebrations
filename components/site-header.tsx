import Link from "next/link";

export function Brand() { return <Link className="brand" href="/">Celebrations<span>06</span></Link>; }

export default function SiteHeader({ dark = false }: { dark?: boolean }) {
  return <header className={dark ? "site-header dark" : "site-header"}><Brand /><nav><Link href="/portfolio">Portfolio</Link><Link href="/design-your-event">Design your event</Link><Link href="/contact">Contact</Link></nav><Link className="nav-cta" href="/book-a-call">Book a call</Link></header>;
}
