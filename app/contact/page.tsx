import type { Metadata } from "next";
import PageIntro from "@/components/pages/PageIntro";
import ContactForm from "@/components/pages/ContactForm";
import { getSiteContent } from "@/lib/content";

export const metadata: Metadata = { title: "Contact", description: "Write to The Celebrations about your celebration." };

export default async function ContactPage() {
  const c = await getSiteContent();
  const details = [
    c.contactEmail && { label: "Email", value: c.contactEmail, href: `mailto:${c.contactEmail}` },
    c.phone && { label: "Phone", value: c.phone, href: `tel:${c.phone.replace(/\s/g, "")}` },
    c.whatsapp && { label: "WhatsApp", value: c.whatsapp, href: `https://wa.me/${c.whatsapp.replace(/\D/g, "")}` },
    c.location && { label: "Based in", value: c.location },
    { label: "Instagram", value: "@celebrations06", href: c.instagramUrl },
  ].filter(Boolean) as { label: string; value: string; href?: string }[];
  return (
    <div className="bg-ivory text-nocturne">
      <PageIntro tone="light" index="Write" label="Contact" title={<>Tell us what you&apos;re <em>dreaming of.</em></>} />
      <div className="grid gap-[8vw] px-[var(--gutter)] pb-[16vh] lg:grid-cols-[0.8fr_1.2fr]">
        <dl className="grid h-max gap-6">
          {details.map((d) => (
            <div key={d.label} className="border-t border-nocturne/15 pt-4">
              <dt className="label text-nocturne/60">{d.label}</dt>
              <dd className="display mt-2 text-3xl">{d.href ? <a href={d.href} target={d.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="hover:text-rouge">{d.value}</a> : d.value}</dd>
            </div>
          ))}
        </dl>
        <ContactForm />
      </div>
    </div>
  );
}
