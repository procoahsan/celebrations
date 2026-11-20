import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Celebrations06 — Made for the moment",
  description: "Event design and atmosphere by Celebrations06.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
