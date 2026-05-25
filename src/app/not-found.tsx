import Link from "next/link";
import { Compass, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="landing-shell" style={{ minHeight: "calc(100vh - 160px)", padding: "var(--space-16) 0 var(--space-20)" }}>
      <div className="container" style={{ maxWidth: 880 }}>
        <p style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--bloodstone)", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <Compass size={16} />
          Lost page
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(3rem, 9vw, 7rem)", fontStyle: "italic", fontWeight: 850, lineHeight: 0.95, marginTop: "var(--space-4)" }}>
          404, but make it useful.
        </h1>
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "var(--text-lg)", lineHeight: 1.7, maxWidth: 640, marginTop: "var(--space-5)" }}>
          This page is not on the shelf. Browse the catalog or jump back to the ongoing radar.
        </p>
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", marginTop: "var(--space-8)" }}>
          <Link href="/browse" className="jelly-button shader-button" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 46, padding: "0 var(--space-5)", color: "var(--vanilla-custard)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-body)", fontWeight: 800 }}>
            <Search size={16} />
            Browse anime
          </Link>
          <Link href="/seasonal" className="jelly-button" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 var(--space-5)", color: "var(--bloodstone)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-body)", fontWeight: 800 }}>
            Ongoing radar
          </Link>
        </div>
      </div>
    </main>
  );
}
