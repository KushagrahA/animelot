import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";

export const metadata: Metadata = {
  title: "Animelot Blog",
  description: "Product updates and editorial notes from Animelot.",
};

const posts = [
  {
    title: "Building Animelot in public",
    excerpt: "A running log of design, product, database, and community decisions as the platform moves toward launch.",
    href: "/community",
  },
  {
    title: "Why the site looks like ink on paper",
    excerpt: "The visual direction behind the custard, sage, and bloodstone palette.",
    href: "/about",
  },
  {
    title: "What comes after launch",
    excerpt: "Profiles, spoiler-safe reviews, lists, Wrapped, and taste compatibility are the next big pillars.",
    href: "/wrapped",
  },
];

export default function BlogPage() {
  return (
    <div className="landing-shell" style={{ padding: "var(--space-12) 0 var(--space-20)" }}>
      <div className="container">
        <p style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--bloodstone)", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <Newspaper size={16} />
          Blog
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-5xl)", fontStyle: "italic", fontWeight: 850, marginTop: "var(--space-3)", marginBottom: "var(--space-8)" }}>
          Notes from the studio.
        </h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "var(--space-5)" }}>
          {posts.map((post) => (
            <Link key={post.title} href={post.href} className="anime-tile" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)", color: "var(--text)", minHeight: 220, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <span>
                <strong style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", lineHeight: 1.15 }}>
                  {post.title}
                </strong>
                <span style={{ display: "block", color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", lineHeight: 1.6, marginTop: "var(--space-4)" }}>
                  {post.excerpt}
                </span>
              </span>
              <ArrowRight size={17} color="var(--bloodstone)" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
