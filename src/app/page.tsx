import type { Metadata } from "next";
import { LandingExperience } from "@/components/home/LandingExperience";
import { getHomeAnimeData } from "@/lib/anime/data";

export const metadata: Metadata = {
  title: "Animelot — Discover, Rate & Discuss Anime",
  description:
    "Discover anime, publish ratings, write reviews, build a watch list, and discuss series with an anime community built around real taste signals.",
  alternates: {
    canonical: "https://animelot.com",
  },
};

export const revalidate = 3600;

export default async function HomePage() {
  const data = await getHomeAnimeData();

  return <LandingExperience {...data} />;
}
