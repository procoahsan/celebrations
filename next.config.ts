import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
