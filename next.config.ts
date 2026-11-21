import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A second dev server (npm run dev:preview) gets its own build folder so it never corrupts the main one.
  distDir: process.env.npm_lifecycle_event === "dev:preview" ? ".next-preview" : ".next",
  // Server output is required: bookings, studio submissions, admin and integrations run as route handlers / server actions.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  experimental: {
    optimizePackageImports: ["three", "@react-three/drei", "lucide-react"],
    // Admin media uploads go through server actions.
    serverActions: { bodySizeLimit: "60mb" },
  },
};

export default nextConfig;
