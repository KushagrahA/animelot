import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Animelot - discover, rate, and discuss anime";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#fff9eb",
          color: "#211b18",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            backgroundImage:
              "linear-gradient(rgba(111, 6, 18, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(111, 6, 18, 0.07) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            inset: 0,
            position: "absolute",
          }}
        />
        <div
          style={{
            border: "2px solid rgba(109, 123, 116, 0.28)",
            borderRadius: 36,
            boxShadow: "0 28px 80px rgba(50, 22, 18, 0.14)",
            display: "flex",
            flexDirection: "column",
            gap: 28,
            padding: "66px 76px",
            position: "relative",
            width: 940,
          }}
        >
          <div style={{ alignItems: "center", display: "flex", gap: 28 }}>
            <img
              src="https://animelot.com/animelot-logo-transparent.png"
              alt=""
              width="128"
              height="128"
              style={{ objectFit: "contain" }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 82, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>Animelot</div>
              <div style={{ color: "#6e8580", fontSize: 24, fontWeight: 700, letterSpacing: 8, marginTop: 10 }}>
                DISCUSS • RECOMMEND • CONNECT
              </div>
            </div>
          </div>
          <div style={{ fontSize: 38, lineHeight: 1.25, maxWidth: 760 }}>
            Discover anime, publish ratings, write reviews, and build your watch list around real community taste.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
