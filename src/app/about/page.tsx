import type { Metadata } from "next";
import { InfoPage } from "@/components/content/InfoPage";

export const metadata: Metadata = {
  title: "About Animelot",
  description: "Learn what Animelot is building for anime discovery, ratings, reviews, and community taste.",
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="An anime community built around taste, not noise."
      intro="Animelot is a discovery, rating, and discussion home for anime fans who want more than a tracker. The product direction is simple: compact data, thoughtful reviews, spoiler safety, and a visual identity that feels handmade."
      sections={[
        {
          title: "What Animelot is",
          body: "Animelot combines an anime reference database with a social taste layer. You can browse titles, see seasonal trends, rate what you watch, and use sharper taste signals to choose what to watch next.",
        },
        {
          title: "Design philosophy",
          body: "The visual language is ink on paper: warm custard backgrounds, sage surfaces, and a bloodstone stamp accent. The goal is calm, editorial, and memorable instead of loud or generic.",
        },
        {
          title: "Community layer",
          body: "Profiles, lists, comments, Wrapped, Taste Match, and Battles are designed around one idea: make anime discovery more personal without making the interface loud.",
        },
      ]}
      cta={{ href: "/browse", label: "Start browsing" }}
    />
  );
}
