import type { Metadata } from "next";
import { InfoPage } from "@/components/content/InfoPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Animelot terms of service overview.",
};

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Terms"
      title="Terms of service."
      intro="These terms describe how Animelot accounts, community content, anime metadata, and product features are handled."
      sections={[
        {
          title: "Using Animelot",
          body: "You agree to use Animelot lawfully, respectfully, and without attempting to disrupt the service, scrape private data, impersonate others, or abuse community systems.",
        },
        {
          title: "Community content",
          body: "Ratings, reviews, comments, lists, and profile content remain yours, but you grant Animelot permission to display and distribute that content within the product. Content that is abusive, illegal, spammy, or intentionally harmful may be moderated.",
        },
        {
          title: "Anime data and external links",
          body: "Anime metadata is sourced from external providers such as AniList. Streaming links, when shown, point to third-party services; Animelot does not host or proxy video streams.",
        },
        {
          title: "Availability",
          body: "Animelot is provided as-is. Features may change as the platform evolves, especially community, ranking, and recommendation systems.",
        },
      ]}
    />
  );
}
