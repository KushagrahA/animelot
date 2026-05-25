"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Flame,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HankoStamp } from "@/components/anime/HankoStamp";
import { InkConstellation } from "@/components/canvas/InkConstellation";
import type { AnimeRow } from "@/lib/supabase/types";
import { formatEpisodes, formatScore, formatSeason, getAnimeTitle, slugify } from "@/lib/utils";

interface LandingExperienceProps {
  season: string;
  year: number;
  seasonalAnime: AnimeRow[];
  trendingAnime: AnimeRow[];
  topRatedAnime: AnimeRow[];
  source: "supabase" | "anilist" | "mixed";
}

const vibeTags = [
  "slow burn",
  "peak fiction",
  "comfort rewatch",
  "watch with friends",
  "emotional damage",
  "underrated gem",
];

function seasonLabel(season: string, year: number) {
  return formatSeason(season, year).replace("—", "This season");
}

function CompactPoster({ anime, rank }: { anime: AnimeRow; rank?: number }) {
  const title = getAnimeTitle(anime, "english");
  const score = anime.animelot_score ?? anime.anilist_score;

  return (
    <Link
      href={`/anime/${anime.slug}`}
      prefetch
      className="anime-tile group block overflow-hidden border"
      style={{
        borderColor: "var(--border)",
        borderRadius: "var(--radius-md)",
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "3 / 4",
          background: anime.dominant_color ?? "var(--misty-sage)",
          overflow: "hidden",
        }}
      >
        {anime.cover_image ? (
          <Image
            src={anime.cover_image}
            alt={`${title} cover art`}
            fill
            sizes="(max-width: 768px) 33vw, 128px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(32,28,24,0.7), transparent 55%)",
          }}
        />
        {rank ? (
          <span
            className="absolute left-2 top-2"
            style={{
              background: "var(--bloodstone)",
              color: "var(--vanilla-custard)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-data)",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 6px",
            }}
          >
            #{rank}
          </span>
        ) : null}
        <span className="absolute bottom-2 right-2">
          <HankoStamp score={score} id={anime.id} size="sm" animate={false} />
        </span>
      </div>
      <div style={{ padding: "10px 10px 12px" }}>
        <p
          className="line-clamp-2"
          style={{
            color: "var(--text)",
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-sm)",
            fontWeight: 650,
            lineHeight: 1.2,
            minHeight: 34,
          }}
        >
          {title}
        </p>
        <p
          style={{
            color: "var(--text-muted)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-xs)",
            marginTop: 6,
          }}
        >
          {formatEpisodes(anime.episodes)}
          {anime.season_year ? ` · ${anime.season_year}` : ""}
        </p>
      </div>
    </Link>
  );
}

function HeroBoard({ anime }: { anime: AnimeRow[] }) {
  const featured = anime[0];
  const rows = anime.slice(1, 6);

  return (
    <div
      className="hero-board premium-focus reveal-up reveal-up-delay-2"
      style={{
        position: "relative",
        zIndex: 1,
        background: "rgba(255,254,247,0.88)",
        border: "1px solid rgba(32,28,24,0.08)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-4)",
        backdropFilter: "blur(14px)",
      }}
    >
      <div className="hero-board-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--text-muted)",
            fontSize: "var(--text-xs)",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Live discovery board
        </p>
        <span
          style={{
            color: "var(--bloodstone)",
            fontFamily: "var(--font-data)",
            fontSize: "var(--text-xs)",
            fontWeight: 700,
          }}
        >
          {anime.length} signals
        </span>
      </div>

      {featured ? (
        <Link
          href={`/anime/${featured.slug}`}
          className="hero-board-feature group"
          style={{
            display: "grid",
            gridTemplateColumns: "92px 1fr",
            gap: "var(--space-4)",
            alignItems: "center",
            paddingBottom: "var(--space-4)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            className="hero-board-cover float-slow"
            style={{
              position: "relative",
              width: 92,
              aspectRatio: "3 / 4",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              background: featured.dominant_color ?? "var(--misty-sage)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {featured.cover_image ? (
              <Image
                src={featured.cover_image}
                alt={`${getAnimeTitle(featured, "english")} cover art`}
                fill
                priority
                sizes="92px"
                className="object-cover"
              />
            ) : null}
          </div>
          <div>
            <p
              style={{
                color: "var(--bloodstone)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Current pulse
            </p>
            <h2
              className="hero-board-title group-hover:text-[var(--bloodstone)]"
              style={{
                color: "var(--text)",
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-xl)",
                fontWeight: 750,
                lineHeight: 1.12,
                marginTop: 6,
              }}
            >
              {getAnimeTitle(featured, "english")}
            </h2>
            <p
              className="hero-board-subtitle"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                marginTop: 8,
              }}
            >
              {featured.studios[0] ?? "Studio pending"} · {formatScore(featured.anilist_score)} AniList
            </p>
          </div>
        </Link>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: "var(--space-4)" }}>
        {rows.map((item, index) => (
          <Link
            key={item.id}
            href={`/anime/${item.slug}`}
            className="hero-board-row"
            style={{
              display: "grid",
              gridTemplateColumns: "24px 1fr auto",
              gap: "var(--space-3)",
              alignItems: "center",
              color: "var(--text)",
            }}
          >
            <span
              style={{
                color: index < 2 ? "var(--bloodstone)" : "var(--text-muted)",
                fontFamily: "var(--font-data)",
                fontWeight: 700,
                fontSize: "var(--text-xs)",
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className="truncate"
              style={{
                display: "block",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
              }}
            >
              {getAnimeTitle(item, "english")}
            </span>
            <span
              style={{
                color: "var(--bloodstone)",
                fontFamily: "var(--font-data)",
                fontSize: "var(--text-xs)",
                fontWeight: 700,
              }}
            >
              {formatScore(item.animelot_score ?? item.anilist_score)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SignalStrip({ source }: { source: LandingExperienceProps["source"] }) {
  const items = [
    { icon: CalendarDays, label: "Ongoing", value: "airing radar", href: "/seasonal" },
    { icon: Flame, label: "Trending", value: "weekly pulse", href: "/browse?sort=POPULARITY_DESC" },
    { icon: MessageCircle, label: "Community", value: "live threads", href: "/community" },
    { icon: ShieldCheck, label: "Data", value: source === "supabase" ? "database live" : "live fallback", href: "/about" },
  ];

  return (
    <section className="container reveal-up reveal-up-delay-3" style={{ marginTop: "var(--space-8)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
          gap: "var(--space-3)",
        }}
      >
        {items.map(({ icon: Icon, label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="signal-card"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-4)",
              minHeight: 92,
              display: "block",
            }}
          >
            <Icon size={18} color="var(--bloodstone)" />
            <p
              style={{
                color: "var(--text)",
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-lg)",
                fontWeight: 700,
                marginTop: 10,
              }}
            >
              {label}
            </p>
            <p
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-xs)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {value}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  href,
}: {
  icon: LucideIcon;
  title: string;
  href?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-4)",
        marginBottom: "var(--space-5)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <Icon size={20} color="var(--bloodstone)" />
        <h2
          style={{
            color: "var(--text)",
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-2xl)",
            fontWeight: 750,
          }}
        >
          {title}
        </h2>
      </div>
      {href ? (
        <Link
          href={href}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--bloodstone)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            fontWeight: 700,
          }}
        >
          View all
          <ArrowRight size={15} />
        </Link>
      ) : null}
    </div>
  );
}

function CompactRail({ anime }: { anime: AnimeRow[] }) {
  return (
    <div className="scroll-rail" style={{ gap: "var(--space-3)", paddingBottom: "var(--space-4)" }}>
      {anime.slice(0, 14).map((item, index) => (
        <div key={item.id} style={{ width: 132 }}>
          <CompactPoster anime={item} rank={index < 5 ? index + 1 : undefined} />
        </div>
      ))}
    </div>
  );
}

function DiscoveryWorkbench({ anime }: { anime: AnimeRow[] }) {
  const ticker = [...anime.slice(0, 5), ...anime.slice(0, 5)];

  return (
    <section className="container" style={{ marginTop: "var(--space-12)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
          gap: "var(--space-5)",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-6)",
            overflow: "hidden",
          }}
        >
          <SectionHeader icon={Sparkles} title="Vibe picks" href="/browse" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-6)" }}>
            {vibeTags.map((tag) => (
              <Link key={tag} href={`/browse?tag=${slugify(tag)}`} className="vibe-chip">
                {tag}
              </Link>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))", gap: "var(--space-3)" }}>
            {anime.slice(0, 3).map((item) => (
              <CompactPoster key={item.id} anime={item} />
            ))}
          </div>
        </div>

        <div
          style={{
            background: "var(--bloodstone)",
            color: "var(--vanilla-custard)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-6)",
            overflow: "hidden",
            minHeight: 320,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xs)",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              opacity: 0.72,
            }}
          >
            Community ticker
          </p>
          <h2
            style={{
              color: "var(--vanilla-custard)",
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-2xl)",
              fontStyle: "italic",
              fontWeight: 750,
              marginTop: 8,
              marginBottom: "var(--space-6)",
            }}
          >
            Reviews should feel alive.
          </h2>
          <div style={{ overflow: "hidden" }}>
            <div className="ticker-track" style={{ display: "flex", gap: "var(--space-3)", width: "max-content" }}>
              {ticker.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  style={{
                    width: 230,
                    background: "rgba(255,249,235,0.1)",
                    border: "1px solid rgba(255,249,235,0.16)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-4)",
                  }}
                >
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", lineHeight: 1.45 }}>
                    Aiko rated <strong>{getAnimeTitle(item, "english")}</strong>
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-data)",
                      fontSize: "var(--text-xs)",
                      marginTop: 10,
                      opacity: 0.75,
                    }}
                  >
                    {formatScore(item.anilist_score)} / 10 · just now
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingExperience({
  season,
  year,
  seasonalAnime,
  trendingAnime,
  topRatedAnime,
  source,
}: LandingExperienceProps) {
  const heroAnime = trendingAnime.length > 0 ? trendingAnime : seasonalAnime;
  const topGrid = topRatedAnime.length > 0 ? topRatedAnime : trendingAnime;

  return (
    <div className="landing-shell">
      <section
        className="ink-paper-grid"
        style={{
          position: "relative",
          minHeight: "min(720px, calc(100vh - 60px))",
          overflow: "hidden",
          padding: "var(--space-10) 0 var(--space-8)",
        }}
      >
        <InkConstellation />
        <div
          className="container landing-hero-grid"
          style={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
            gap: "var(--space-10)",
            alignItems: "center",
          }}
        >
          <div className="landing-copy">
            <div
              className="reveal-up"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-full)",
                background: "rgba(255,254,247,0.82)",
                padding: "7px 12px",
                color: "var(--bloodstone)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-xs)",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "var(--radius-full)",
                  background: "var(--bloodstone)",
                }}
              />
              {seasonLabel(season, year)}
            </div>

            <h1
              className="landing-headline reveal-up reveal-up-delay-1"
              style={{
                color: "var(--text)",
                fontFamily: "var(--font-display)",
                fontSize: "clamp(3rem, 8vw, 5.8rem)",
                fontStyle: "italic",
                fontWeight: 850,
                lineHeight: 0.98,
                marginTop: "var(--space-6)",
                maxWidth: 720,
              }}
            >
              Animelot
            </h1>
            <p
              className="landing-subcopy reveal-up reveal-up-delay-2"
              style={{
                color: "var(--text)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-lg)",
                lineHeight: 1.65,
                maxWidth: 620,
                marginTop: "var(--space-5)",
                opacity: 0.82,
              }}
            >
              A quieter, sharper anime home: real discovery, compact art, community scores, and reviews built for people who care about taste.
            </p>

            <div className="landing-cta reveal-up reveal-up-delay-3" style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", marginTop: "var(--space-6)" }}>
              <Link
                href="/browse"
                className="jelly-button shader-button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  minHeight: 48,
                  padding: "0 var(--space-5)",
                  background: "var(--bloodstone)",
                  color: "var(--vanilla-custard)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-body)",
                  fontWeight: 750,
                }}
              >
                <Search size={17} />
                Browse anime
              </Link>
              <Link
                href="/seasonal"
                className="jelly-button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  minHeight: 48,
                  padding: "0 var(--space-5)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-body)",
                  fontWeight: 750,
                }}
              >
                Ongoing chart
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>

          <HeroBoard anime={heroAnime} />
        </div>

        <SignalStrip source={source} />
      </section>

      <section className="container" style={{ paddingTop: "var(--space-12)" }}>
        <SectionHeader icon={CalendarDays} title={`Airing ${seasonLabel(season, year)}`} href="/seasonal" />
        <CompactRail anime={seasonalAnime} />
      </section>

      <DiscoveryWorkbench anime={trendingAnime} />

      <section className="container" style={{ paddingTop: "var(--space-12)", paddingBottom: "var(--space-20)" }}>
        <SectionHeader icon={Star} title="Top rated essentials" href="/browse?sort=SCORE_DESC" />
        <div className="top-rated-rail scroll-rail">
          {topGrid.slice(0, 12).map((item, index) => (
            <div key={item.id} className="top-rated-rail-item">
              <CompactPoster anime={item} rank={index + 1} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
