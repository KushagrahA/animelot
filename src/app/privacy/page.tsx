import type { Metadata } from "next";
import { InfoPage } from "@/components/content/InfoPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Animelot privacy policy and data handling overview.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Privacy"
      title="Privacy policy."
      intro="Animelot is built to keep account data, ratings, reviews, and watch activity understandable and controllable."
      sections={[
        {
          title: "Information we collect",
          body: "Animelot may collect account details such as email, username, display name, avatar, and authentication provider identifiers. When community features are enabled, ratings, reviews, watch status, lists, comments, follows, and profile settings are stored to power the service.",
        },
        {
          title: "How information is used",
          body: "We use data to provide authentication, personalize discovery, show community activity, prevent abuse, improve product quality, and maintain site security. We do not sell personal information.",
        },
        {
          title: "Service providers",
          body: "The platform is designed around Supabase for database/auth/storage, Vercel for hosting, AniList for anime metadata, and optional providers like Resend for transactional email and Vercel Analytics for web vitals.",
        },
        {
          title: "Control and deletion",
          body: "Users can update profile information and request account deletion by contacting hello@animelot.com.",
        },
      ]}
    />
  );
}
