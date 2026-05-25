import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Search } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = titleFromSlug(slug);
  return {
    title: `${title} Anime — Works & Ratings`,
    description: `Browse anime connected to ${title} on Animelot.`,
  };
}

export default async function StudioPage({ params }: Props) {
  const { slug } = await params;
  const title = titleFromSlug(slug);

  return (
    <div className="landing-shell" style={{ padding: "var(--space-12) 0 var(--space-20)" }}>
      <div className="container" style={{ maxWidth: 920 }}>
        <p style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--bloodstone)", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <Building2 size={16} />
          Studio
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-5xl)", fontStyle: "italic", fontWeight: 850, lineHeight: 1.05, marginTop: "var(--space-3)" }}>
          {title}
        </h1>
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "var(--text-lg)", lineHeight: 1.7, maxWidth: 720, marginTop: "var(--space-5)" }}>
          Explore anime connected to {title}, then use Browse filters to narrow by score, season, format, and status.
        </p>
        <Link href={`/browse?studio=${slug}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 46, padding: "0 var(--space-5)", background: "var(--bloodstone)", color: "var(--vanilla-custard)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-body)", fontWeight: 750, marginTop: "var(--space-8)" }}>
          <Search size={16} />
          Browse studio titles
        </Link>
      </div>
    </div>
  );
}
