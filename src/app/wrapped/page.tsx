import type { Metadata } from "next";
import { InfoPage } from "@/components/content/InfoPage";

export const metadata: Metadata = {
  title: "Animelot Wrapped",
  description: "Animelot Wrapped, the annual anime year-in-review feature.",
};

export default function WrappedPage() {
  return (
    <InfoPage
      eyebrow="Wrapped"
      title="Your anime year, stamped in ink."
      intro="Animelot Wrapped turns your ratings, episodes, genres, studios, dropped shows, and taste twin into a shareable annual card."
      sections={[
        {
          title: "Annual recap",
          body: "Wrapped summarizes total anime watched, episodes completed, hours watched, average score, top genres, top studio, and highest-rated anime for the year.",
        },
        {
          title: "Shareable cards",
          body: "Downloadable image cards use Animelot's bloodstone stamp style, cover art mosaics, and spoiler-safe stats.",
        },
        {
          title: "Progress that matters",
          body: "The recap gets richer as you rate anime, update watch progress, and keep your list current through the year.",
        },
      ]}
      cta={{ href: "/signup", label: "Create an account" }}
    />
  );
}
