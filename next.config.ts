import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.animelot.com" }],
        destination: "https://animelot.com/:path*",
        permanent: true,
      },
    ];
  },
  images: {
    // AniList already serves optimized CDN images; bypassing Next's image proxy
    // makes local preview and first-click navigation feel much faster.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s4.anilist.co",
        pathname: "/file/**",
      },
      {
        protocol: "https",
        hostname: "img.anilist.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
