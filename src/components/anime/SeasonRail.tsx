"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimeCard } from "./AnimeCard";
import type { AnimeRow } from "@/lib/supabase/types";

interface SeasonRailProps {
  title: string;
  anime: AnimeRow[];
  titlePref?: "english" | "romaji" | "native";
  size?: "sm" | "md" | "lg";
  showRank?: boolean;
}

export function SeasonRail({
  title,
  anime,
  titlePref = "english",
  size = "md",
  showRank = false,
}: SeasonRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!railRef.current) return;
    const amount = 480;
    railRef.current.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };

  return (
    <section aria-label={title} style={{ marginBottom: "var(--space-12)" }}>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-5)",
          paddingLeft: "var(--space-1)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-2xl)",
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: 0,
          }}
        >
          {title}
        </h2>

        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
            className="hover:border-[var(--bloodstone)] hover:text-[var(--bloodstone)]"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
            className="hover:border-[var(--bloodstone)] hover:text-[var(--bloodstone)]"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Scrollable rail */}
      <div
        ref={railRef}
        className="scroll-rail"
        style={{ paddingBottom: "var(--space-4)" }}
      >
        {anime.length === 0
          ? Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="skeleton flex-shrink-0"
                style={{ width: 160, height: 228, borderRadius: "var(--radius-lg)" }}
              />
            ))
          : anime.map((a, i) => (
              <AnimeCard
                key={a.id}
                anime={a}
                titlePref={titlePref}
                size={size}
                rank={showRank ? i + 1 : undefined}
              />
            ))}
      </div>
    </section>
  );
}
