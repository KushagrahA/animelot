export default function AnimeLoading() {
  return (
    <div>
      <div
        style={{
          width: "100%",
          height: "clamp(180px, 28vw, 340px)",
          background: "linear-gradient(135deg, var(--sage-tint), var(--surface))",
          borderBottom: "1px solid var(--border)",
        }}
      />
      <div className="container" style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-16)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: "var(--space-10)",
            alignItems: "start",
          }}
        >
          <aside>
            <div className="skeleton" style={{ width: "min(240px, 100%)", aspectRatio: "3/4", borderRadius: "var(--radius-lg)" }} />
            <div className="skeleton" style={{ width: "min(240px, 100%)", height: 44, borderRadius: "var(--radius-md)", marginTop: "var(--space-6)" }} />
            <div className="skeleton" style={{ width: "min(240px, 100%)", height: 240, borderRadius: "var(--radius-lg)", marginTop: "var(--space-5)" }} />
          </aside>
          <main>
            <div className="skeleton" style={{ width: "min(520px, 100%)", height: 52, borderRadius: "var(--radius-md)" }} />
            <div className="skeleton" style={{ width: 220, height: 18, borderRadius: "var(--radius-sm)", marginTop: "var(--space-3)" }} />
            <div style={{ display: "grid", gap: "var(--space-3)", marginTop: "var(--space-8)", maxWidth: 680 }}>
              <div className="skeleton" style={{ height: 18, borderRadius: "var(--radius-sm)" }} />
              <div className="skeleton" style={{ height: 18, borderRadius: "var(--radius-sm)" }} />
              <div className="skeleton" style={{ width: "72%", height: 18, borderRadius: "var(--radius-sm)" }} />
            </div>
            <div className="skeleton" style={{ width: "min(680px, 100%)", height: 120, borderRadius: "var(--radius-lg)", marginTop: "var(--space-8)" }} />
          </main>
        </div>
      </div>
    </div>
  );
}
