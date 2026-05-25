import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/anime/",
          "/genre/",
          "/studio/",
          "/seasonal/",
          "/browse/",
          "/battles/",
        ],
        disallow: [
          "/feed",
          "/settings",
          "/wrapped",
          "/profile",
          "/api/",
          "/_next/",
        ],
      },
    ],
    sitemap: "https://animelot.com/sitemap.xml",
    host: "https://animelot.com",
  };
}
