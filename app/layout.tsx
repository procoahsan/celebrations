import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, DM_Mono, Instrument_Sans } from "next/font/google";
import ExperienceProvider from "@/components/providers/ExperienceProvider";
import Navigation from "@/components/chrome/Navigation";
import Cursor from "@/components/chrome/Cursor";
import Curtain from "@/components/chrome/Curtain";
import { getSiteContent } from "@/lib/content";
import "./globals.css";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--font-bodoni", display: "swap" });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "The Celebrations · Celebrations Beyond Imagination", template: "%s · The Celebrations" },
  description: "The Celebrations designs and transforms spaces into unforgettable celebrations: ceremony arches, stages, mehndi colour, candlelit aisles and tablescapes.",
  openGraph: { type: "website", siteName: "The Celebrations", images: ["/media/img/crystal-arch-hall.jpg"] },
};

export const viewport: Viewport = { themeColor: "#0f0b0c", colorScheme: "dark" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const content = await getSiteContent();
  return (
    <html lang="en" className={`${bodoni.variable} ${instrument.variable} ${mono.variable}`}>
      <body className="grain">
        <noscript><style>{`[data-reveal]{visibility:visible!important}`}</style></noscript>
        <a href="#main" className="label fixed left-4 top-4 z-[200] -translate-y-24 bg-ivory px-4 py-3 text-nocturne focus:translate-y-0">Skip to content</a>
        <ExperienceProvider />
        <Navigation instagramUrl={content.instagramUrl} />
        <main id="main" tabIndex={-1} className="outline-none">{children}</main>
        <Curtain />
        <Cursor />
      </body>
    </html>
  );
}
