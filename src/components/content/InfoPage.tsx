import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface InfoPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  sections: {
    title: string;
    body: string;
  }[];
  cta?: {
    href: string;
    label: string;
  };
}

export function InfoPage({ eyebrow, title, intro, sections, cta }: InfoPageProps) {
  return (
    <div className="landing-shell" style={{ padding: "var(--space-12) 0 var(--space-20)" }}>
      <div className="container" style={{ maxWidth: 920 }}>
        <p
          style={{
            color: "var(--bloodstone)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-xs)",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-5xl)",
            fontStyle: "italic",
            fontWeight: 850,
            lineHeight: 1.05,
            marginTop: "var(--space-3)",
            maxWidth: 760,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-lg)",
            lineHeight: 1.7,
            maxWidth: 760,
            marginTop: "var(--space-5)",
          }}
        >
          {intro}
        </p>

        <div style={{ display: "grid", gap: "var(--space-4)", marginTop: "var(--space-10)" }}>
          {sections.map((section) => (
            <section
              key={section.title}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-6)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-2xl)",
                  fontWeight: 750,
                  marginBottom: "var(--space-3)",
                }}
              >
                {section.title}
              </h2>
              <p
                style={{
                  color: "var(--text)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-base)",
                  lineHeight: 1.75,
                }}
              >
                {section.body}
              </p>
            </section>
          ))}
        </div>

        {cta ? (
          <Link
            href={cta.href}
            className="jelly-button shader-button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 46,
              padding: "0 var(--space-5)",
              background: "var(--bloodstone)",
              color: "var(--vanilla-custard)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-body)",
              fontWeight: 750,
              marginTop: "var(--space-8)",
            }}
          >
            {cta.label}
            <ArrowRight size={16} />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
