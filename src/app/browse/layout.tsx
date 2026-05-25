import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Anime — Filter by Genre, Format & Season",
  description:
    "Browse thousands of anime titles. Filter by genre, format, season, and more. Find your next favourite series on Animelot.",
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
