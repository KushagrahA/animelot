import type { Metadata } from "next";
import { InfoPage } from "@/components/content/InfoPage";

export const metadata: Metadata = {
  title: "Taste Match",
  description: "Compare anime taste compatibility with another Animelot user.",
};

export default function ComparePage() {
  return (
    <InfoPage
      eyebrow="Taste Match"
      title="Find your anime taste twin."
      intro="Taste Match compares overlapping ratings, genre agreement, and the shows that split two viewers apart. Start by rating anime, then use your profile to compare taste with friends."
      sections={[
        {
          title: "Compatibility score",
          body: "When two users share at least five rated anime, Animelot calculates compatibility, strongest genre overlap, biggest disagreements, and a clean shareable summary.",
        },
        {
          title: "Better recommendations",
          body: "The result helps you find people whose taste is actually useful, not just people who like the same popular shows.",
        },
      ]}
      cta={{ href: "/browse", label: "Browse anime to rate" }}
    />
  );
}
