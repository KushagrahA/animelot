import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 86400; // 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://animelot.com";

  // Only query DB if Supabase is configured
  let animeList: { slug: string; updated_at: string }[] = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && supabaseUrl !== "https://your-project.supabase.co") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("anime")
      .select("slug, updated_at")
      .order("popularity", { ascending: false })
      .returns<{ slug: string; updated_at: string }[]>();
    animeList = data ?? [];
  }

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: `${baseUrl}/browse`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/seasonal`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/community`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.86 },
    { url: `${baseUrl}/battles`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/compare`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/wrapped`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // Genre pages
  const genres = [
    "action", "adventure", "comedy", "drama", "fantasy", "horror",
    "mecha", "music", "mystery", "psychological", "romance", "sci-fi",
    "slice-of-life", "sports", "supernatural", "thriller", "shounen",
    "shoujo", "seinen", "josei", "isekai",
  ];
  const genrePages: MetadataRoute.Sitemap = genres.map((g) => ({
    url: `${baseUrl}/genre/${g}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const studios = [
    "toei-animation",
    "mappa",
    "kyoto-animation",
    "bones",
    "madhouse",
    "ufotable",
    "wit-studio",
    "trigger",
  ];
  const studioPages: MetadataRoute.Sitemap = studios.map((studio) => ({
    url: `${baseUrl}/studio/${studio}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Anime detail pages
  const animePages: MetadataRoute.Sitemap = animeList.map((a) => ({
    url: `${baseUrl}/anime/${a.slug}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...genrePages, ...studioPages, ...animePages];
}
