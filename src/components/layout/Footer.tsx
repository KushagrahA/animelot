import Link from "next/link";
import { AnimelotLogo } from "@/components/brand/AnimelotLogo";

const footerLinks = {
  Discover: [
    { href: "/browse", label: "Browse Anime" },
    { href: "/seasonal", label: "Ongoing Chart" },
    { href: "/genre/action", label: "Action" },
    { href: "/genre/romance", label: "Romance" },
    { href: "/genre/shounen", label: "Shōnen" },
  ],
  Community: [
    { href: "/community", label: "Community" },
    { href: "/battles", label: "World Battles" },
    { href: "/compare", label: "Taste Match" },
    { href: "/wrapped", label: "Wrapped" },
  ],
  Animelot: [
    { href: "/about", label: "About" },
    { href: "/blog", label: "Blog" },
    { href: "mailto:hello@animelot.com", label: "Contact" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ],
};

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--misty-sage)",
        borderTop: "1px solid var(--border)",
        paddingTop: "var(--space-16)",
        paddingBottom: "var(--space-8)",
        marginTop: "var(--space-20)",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "var(--space-8)",
            marginBottom: "var(--space-12)",
          }}
          className="grid-cols-1 sm:grid-cols-3"
        >
          {/* Brand column */}
          <div style={{ gridColumn: "1 / -1" }} className="sm:col-auto">
            <div style={{ marginBottom: "var(--space-4)" }}>
              <AnimelotLogo size="sm" />
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                color: "var(--ink)",
                opacity: 0.7,
                maxWidth: 260,
                lineHeight: 1.6,
              }}
            >
              The world&apos;s anime community. Discover, rate, and discuss the shows you love.
            </p>
          </div>

          {/* Nav columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--ink)",
                  opacity: 0.5,
                  marginBottom: "var(--space-3)",
                }}
              >
                {category}
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        color: "var(--ink)",
                        opacity: 0.75,
                        transition: "opacity var(--transition-fast)",
                      }}
                      className="hover:opacity-100"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid rgba(32,28,24,0.15)",
            paddingTop: "var(--space-6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--space-4)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xs)",
              color: "var(--ink)",
              opacity: 0.5,
            }}
          >
          © {new Date().getFullYear()} Animelot. Not affiliated with any studio or streaming service.
          </p>
          <p
            style={{
              fontFamily: "var(--font-data)",
              fontSize: 10,
              color: "var(--ink)",
              opacity: 0.4,
              letterSpacing: "0.04em",
            }}
          >
            Anime data sourced from AniList API
          </p>
        </div>
      </div>
    </footer>
  );
}
