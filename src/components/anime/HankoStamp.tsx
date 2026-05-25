"use client";

import { deterministicRotation, formatScore } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface HankoStampProps {
  score: number | null | undefined;
  id?: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}

const sizes = {
  sm: { outer: 40, inner: 32, font: 12 },
  md: { outer: 64, inner: 52, font: 19 },
  lg: { outer: 96, inner: 78, font: 28 },
};

export function HankoStamp({
  score,
  id = "default",
  size = "md",
  animate = true,
  className,
}: HankoStampProps) {
  const rotation = deterministicRotation(id);
  const dim = sizes[size];
  const displayed = formatScore(score);

  const opacity = score == null ? 0.35 : 1;

  return (
    <div
      role="img"
      aria-label={`Community score: ${displayed} out of 10`}
      className={cn("relative inline-flex items-center justify-center select-none", className)}
      style={{
        width: dim.outer,
        height: dim.outer,
        transform: `rotate(${rotation}deg)`,
        opacity,
      }}
    >
      {/* Outer stamp circle */}
      <svg
        width={dim.outer}
        height={dim.outer}
        viewBox={`0 0 ${dim.outer} ${dim.outer}`}
        fill="none"
        style={{ position: "absolute", inset: 0 }}
        aria-hidden="true"
      >
        <circle
          cx={dim.outer / 2}
          cy={dim.outer / 2}
          r={dim.outer / 2 - 1}
          fill="#5D0D18"
          filter="url(#ink-roughness)"
        />
        {/* Inner ring */}
        <circle
          cx={dim.outer / 2}
          cy={dim.outer / 2}
          r={dim.inner / 2}
          fill="none"
          stroke="#FFF9EB"
          strokeWidth={size === "sm" ? 1 : 1.5}
          opacity={0.6}
        />
      </svg>

      {/* Score text */}
      <span
        style={{
          fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace",
          fontSize: dim.font,
          fontWeight: 700,
          color: "#FFF9EB",
          letterSpacing: 0,
          position: "relative",
          zIndex: 1,
          lineHeight: 1,
        }}
      >
        {displayed}
      </span>

      {/* Ink bleed animation overlay */}
      {animate && score != null && (
        <div
          className="hanko-ink-bleed"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "#5D0D18",
            animation: "hanko-reveal 280ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
            pointerEvents: "none",
          }}
        />
      )}

      <style>{`
        @keyframes hanko-reveal {
          0%   { clip-path: circle(0% at 50% 50%); opacity: 1; }
          100% { clip-path: circle(60% at 50% 50%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
