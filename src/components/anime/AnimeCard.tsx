"use client";

import Image from "next/image";
import Link from "next/link";
import { HankoStamp } from "./HankoStamp";
import { cn, getAnimeTitle, formatEpisodes } from "@/lib/utils";
import type { AnimeRow } from "@/lib/supabase/types";

interface AnimeCardProps {
  anime: AnimeRow;
  titlePref?: "english" | "romaji" | "native";
  size?: "sm" | "md" | "lg";
  className?: string;
  showScore?: boolean;
  rank?: number;
}

const cardSizes = {
  sm: { width: 120, height: 170, stampSize: "sm" as const },
  md: { width: 160, height: 228, stampSize: "sm" as const },
  lg: { width: 200, height: 284, stampSize: "md" as const },
};

export function AnimeCard({
  anime,
  titlePref = "english",
  size = "md",
  className,
  showScore = true,
  rank,
}: AnimeCardProps) {
  const title = getAnimeTitle(anime, titlePref);
  const dim = cardSizes[size];

  return (
    <Link
      href={`/anime/${anime.slug}`}
      prefetch
      className={cn("group block relative", className)}
      title={title}
    >
      <div
        className="relative overflow-hidden rounded-lg"
        style={{
          width: dim.width,
          height: dim.height,
          background: anime.dominant_color ?? "var(--misty-sage)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Cover art */}
        {anime.cover_image ? (
          <Image
            src={anime.cover_image}
            alt={`${title} cover art`}
            fill
            sizes={`${dim.width}px`}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "var(--sage-tint)" }}
          >
            <span style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>No image</span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2"
          style={{ background: "linear-gradient(to top, rgba(32,28,24,0.92) 0%, rgba(32,28,24,0) 60%)" }}
        >
          <p
            style={{
              color: "#FFF9EB",
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-body)",
              lineHeight: 1.4,
            }}
          >
            {formatEpisodes(anime.episodes)}
            {anime.season_year ? ` · ${anime.season_year}` : ""}
          </p>
        </div>

        {/* Rank badge */}
        {rank != null && (
          <div
            className="absolute top-1.5 left-1.5 z-10"
            style={{
              background: "var(--bloodstone)",
              color: "var(--accent-contrast)",
              fontFamily: "var(--font-data)",
              fontSize: 10,
              fontWeight: 700,
              padding: "1px 5px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            #{rank}
          </div>
        )}

        {/* Hanko score — absolute, bottom-right */}
        {showScore && (
          <div className="absolute bottom-1.5 right-1.5 z-10">
            <HankoStamp
              score={anime.animelot_score ?? anime.anilist_score}
              id={anime.id}
              size={dim.stampSize}
              animate={false}
            />
          </div>
        )}
      </div>

      {/* Title below card */}
      <div
        className="mt-2 px-0.5"
        style={{ maxWidth: dim.width }}
      >
        <p
          className="truncate leading-tight group-hover:text-bloodstone transition-colors"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          {title}
        </p>
      </div>
    </Link>
  );
}
