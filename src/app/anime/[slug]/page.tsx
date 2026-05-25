import { createClient } from "@/lib/supabase/server";
import { anilistRequest, QUERIES } from "@/lib/anilist/client";
import { cache } from "react";
import { HankoStamp } from "@/components/anime/HankoStamp";
import { SeasonRail } from "@/components/anime/SeasonRail";
import { AnimeInteractionPanel } from "@/components/anime/AnimeInteractionPanel";
import { AnimeCommunityPanel } from "@/components/anime/AnimeCommunityPanel";
import { OtakuQuizCard } from "@/components/anime/OtakuQuizCard";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { formatEpisodes, formatDuration, formatSeason, getAnimeTitle, truncate } from "@/lib/utils";
import { animeToSeedPayload } from "@/lib/anime/seed";
import { ExternalLink, Play } from "lucide-react";
import type { AnimeRow, CommentWithUser, RatingWithUser } from "@/lib/supabase/types";

interface Props {
  params: Promise<{ slug: string }>;
}

// ── ISR: 24h revalidation for detail pages ───────────────────
export const revalidate = 86400;

async function withTimeout<T>(promise: Promise<T>, fallback: T, ms = 2800): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => resolve(fallback), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// ── AniList → DB row mapper (shared with homepage) ───────────
interface AniListMedia {
  id: number;
  title: { romaji: string; english: string | null; native: string | null };
  coverImage: { extraLarge: string; large: string; color: string | null };
  bannerImage: string | null;
  description: string | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  duration: number | null;
  season: string | null;
  seasonYear: number | null;
  genres: string[];
  averageScore: number | null;
  popularity: number;
  source: string | null;
  studios: { nodes: { name: string }[] };
  trailer: { id: string; site: string } | null;
  externalLinks: { site: string; url: string; icon?: string }[];
  nextAiringEpisode: { episode: number; airingAt: number } | null;
  relations?: {
    edges: {
      relationType: string;
      node: {
        id: number;
        title: { romaji: string; english: string | null };
        coverImage: { large: string };
        format: string | null;
        status: string | null;
      };
    }[];
  };
  recommendations?: {
    nodes: {
      mediaRecommendation: {
        id: number;
        title: { romaji: string; english: string | null };
        coverImage: { large: string };
        averageScore: number | null;
      } | null;
    }[];
  };
}

function mapAniListToRow(media: AniListMedia): AnimeRow {
  const baseTitle = media.title.english || media.title.romaji;
  const slug = baseTitle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const externalLinks: Record<string, string> = {};
  media.externalLinks?.forEach(({ site, url }) => {
    externalLinks[site.toLowerCase()] = url;
  });

  return {
    id: `anilist-${media.id}`,
    anilist_id: media.id,
    slug,
    title_romaji: media.title.romaji,
    title_english: media.title.english,
    title_native: media.title.native,
    synopsis: media.description?.replace(/<[^>]+>/g, "") ?? null,
    cover_image: media.coverImage.extraLarge || media.coverImage.large,
    banner_image: media.bannerImage,
    dominant_color: media.coverImage.color,
    format: media.format as AnimeRow["format"],
    status: media.status as AnimeRow["status"],
    episodes: media.episodes,
    duration: media.duration,
    season: media.season as AnimeRow["season"],
    season_year: media.seasonYear,
    genres: media.genres,
    studios: media.studios?.nodes?.map((s) => s.name) ?? [],
    source: media.source,
    anilist_score: media.averageScore ? media.averageScore / 10 : null,
    animelot_score: null,
    popularity: media.popularity,
    trailer_url: media.trailer?.site === "youtube" ? `https://www.youtube.com/watch?v=${media.trailer.id}` : null,
    external_links: externalLinks,
    next_airing_ep: media.nextAiringEpisode?.episode ?? null,
    next_airing_at: media.nextAiringEpisode
      ? new Date(media.nextAiringEpisode.airingAt * 1000).toISOString()
      : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function getCommunityRows(animeId: string) {
  if (!isUuid(animeId)) {
    return { reviews: [] as RatingWithUser[], comments: [] as CommentWithUser[] };
  }

  const supabase = await createClient();
  const [reviewsResult, commentsResult] = await Promise.all([
    supabase
      .from("ratings")
      .select("*, profiles(username, display_name, avatar_url, is_verified)")
      .eq("anime_id", animeId)
      .or("review.not.is.null,review_headline.not.is.null")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("comments")
      .select("*, profiles(username, display_name, avatar_url, is_verified)")
      .eq("parent_type", "anime")
      .eq("parent_id", animeId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return {
    reviews: (reviewsResult.data ?? []) as RatingWithUser[],
    comments: (commentsResult.data ?? []) as CommentWithUser[],
  };
}

// ── Fetch anime (prefer Supabase briefly, race AniList for speed) ────
const getAnime = cache(async (slug: string) => {
  const supabase = await createClient();

  const dbPromise = withTimeout(
    Promise.resolve(
      supabase.from("anime").select("*").eq("slug", slug).maybeSingle()
    ).then(({ data }) => data as AnimeRow | null),
    null,
    650
  );

  const aniListPromise = withTimeout(
    (async () => {
      const query = QUERIES.animeDetail(slug);
      const data = await anilistRequest<{ Media: AniListMedia }>(query);
      if (!data.Media) return null;
      return { anime: mapAniListToRow(data.Media), source: "anilist", raw: data.Media };
    })(),
    null,
    2800
  );

  const dbAnime = await dbPromise;
  if (dbAnime) return { anime: dbAnime, source: "db" };

  return aniListPromise;
});

// ── Dynamic metadata ──────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getAnime(slug);
  if (!result) return { title: "Anime Not Found | Animelot" };

  const { anime } = result;
  const title = getAnimeTitle(anime, "english");
  const desc = anime.synopsis
    ? truncate(anime.synopsis, 155)
    : `${title} — reviews, ratings, and discussion on Animelot.`;

  return {
    title: `${title} (${anime.season_year ?? "—"}) — Reviews & Ratings`,
    description: desc,
    openGraph: {
      title: `${title} | Animelot`,
      description: desc,
      images: [{ url: `/api/og/anime/${slug}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Animelot`,
      description: desc,
    },
  };
}

// ── Streaming service display map ─────────────────────────────
const STREAMING_LABELS: Record<string, string> = {
  crunchyroll: "Crunchyroll",
  netflix: "Netflix",
  "amazon prime video": "Prime Video",
  funimation: "Funimation",
  hidive: "HIDIVE",
  hulu: "Hulu",
  "disney plus": "Disney+",
  youtube: "YouTube",
};

// ── Metadata row item ─────────────────────────────────────────
function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--text-muted)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          color: "var(--text)",
          lineHeight: 1.4,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────
function StatusBadge({ status }: { status: string | null }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    RELEASING: { label: "Airing", color: "#15803d", bg: "#dcfce7" },
    FINISHED: { label: "Finished", color: "var(--text-muted)", bg: "var(--border)" },
    NOT_YET_RELEASED: { label: "Upcoming", color: "#1d4ed8", bg: "#dbeafe" },
    HIATUS: { label: "On Hiatus", color: "#b45309", bg: "#fef3c7" },
    CANCELLED: { label: "Cancelled", color: "#991b1b", bg: "#fee2e2" },
  };
  const c = config[status ?? ""] ?? { label: status ?? "Unknown", color: "var(--text-muted)", bg: "var(--border)" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "var(--radius-full)",
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "var(--font-body)",
        color: c.color,
        background: c.bg,
      }}
    >
      {c.label}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default async function AnimePage({ params }: Props) {
  const { slug } = await params;
  const result = await getAnime(slug);

  if (!result) notFound();

  const { anime, raw } = result as { anime: AnimeRow; source: string; raw?: AniListMedia };
  const title = getAnimeTitle(anime, "english");
  const score = anime.animelot_score ?? anime.anilist_score;
  const canSyncCommunity = isUuid(anime.id);
  const community = await getCommunityRows(anime.id);
  const animeSeed = animeToSeedPayload(anime);

  // Related anime from AniList raw data
  const relatedAnime: AnimeRow[] = raw?.relations?.edges
    ?.filter((e) => ["SEQUEL", "PREQUEL", "SIDE_STORY", "ALTERNATIVE"].includes(e.relationType))
    .map((e) => ({
      id: `anilist-${e.node.id}`,
      anilist_id: e.node.id,
      slug: (e.node.title.english || e.node.title.romaji)
        .toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-"),
      title_romaji: e.node.title.romaji,
      title_english: e.node.title.english,
      title_native: null,
      synopsis: null,
      cover_image: e.node.coverImage.large,
      banner_image: null,
      dominant_color: null,
      format: e.node.format as AnimeRow["format"],
      status: e.node.status as AnimeRow["status"],
      episodes: null,
      duration: null,
      season: null,
      season_year: null,
      genres: [],
      studios: [],
      source: null,
      anilist_score: null,
      animelot_score: null,
      popularity: 0,
      trailer_url: null,
      external_links: {},
      next_airing_ep: null,
      next_airing_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })) ?? [];

  const externalLinks = anime.external_links as Record<string, string>;

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": anime.format === "MOVIE" ? "Movie" : "TVSeries",
    name: title,
    alternateName: anime.title_native,
    description: anime.synopsis,
    image: anime.cover_image,
    numberOfEpisodes: anime.episodes,
    genre: anime.genres,
    ...(score && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: score.toFixed(1),
        bestRating: "10",
        worstRating: "0",
      },
    }),
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Banner */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "clamp(180px, 28vw, 340px)",
          background: anime.dominant_color ?? "var(--misty-sage)",
          overflow: "hidden",
        }}
      >
        {anime.banner_image && (
          <Image
            src={anime.banner_image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ opacity: 0.85 }}
          />
        )}
        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(32,28,24,0.1) 0%, rgba(32,28,24,0.6) 100%)",
          }}
        />
        {/* Breadcrumb */}
        <div
          style={{ position: "absolute", bottom: 16, left: 24, display: "flex", gap: 6, alignItems: "center" }}
        >
          <Link href="/" style={{ color: "rgba(255,249,235,0.7)", fontSize: "var(--text-xs)", fontFamily: "var(--font-body)" }}>
            Home
          </Link>
          <span style={{ color: "rgba(255,249,235,0.4)", fontSize: "var(--text-xs)" }}>/</span>
          <Link href="/browse" style={{ color: "rgba(255,249,235,0.7)", fontSize: "var(--text-xs)", fontFamily: "var(--font-body)" }}>
            Browse
          </Link>
          <span style={{ color: "rgba(255,249,235,0.4)", fontSize: "var(--text-xs)" }}>/</span>
          <span style={{ color: "rgba(255,249,235,0.9)", fontSize: "var(--text-xs)", fontFamily: "var(--font-body)" }}>
            {title}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="container" style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-16)" }}>
        <div
          className="anime-detail-layout"
        >
          {/* ── LEFT SIDEBAR ─────────────────────────────── */}
          <aside className="anime-sidebar">
            {/* Cover art + HankoStamp */}
            <div style={{ position: "relative", marginBottom: "var(--space-5)" }}>
              <div
                style={{
                  width: "100%",
                  aspectRatio: "3/4",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  background: anime.dominant_color ?? "var(--misty-sage)",
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                {anime.cover_image && (
                  <Image
                    src={anime.cover_image}
                    alt={`${title} cover art`}
                    fill
                    sizes="240px"
                    className="object-cover"
                    priority
                  />
                )}
              </div>
              {/* HankoStamp — bottom right of cover */}
              <div style={{ position: "absolute", bottom: -16, right: -12, zIndex: 10 }}>
                <HankoStamp score={score} id={anime.id} size="lg" animate />
              </div>
            </div>

            {/* Metadata */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-5)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
              }}
            >
              <MetaRow label="Format" value={anime.format?.replace("_", " ")} />
              <MetaRow label="Episodes" value={formatEpisodes(anime.episodes)} />
              <MetaRow label="Duration" value={formatDuration(anime.duration)} />
              <MetaRow label="Season" value={formatSeason(anime.season, anime.season_year)} />
              <MetaRow label="Status" value={<StatusBadge status={anime.status} />} />
              {anime.studios.length > 0 && (
                <MetaRow
                  label="Studio"
                  value={
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {anime.studios.map((s) => (
                        <Link
                          key={s}
                          href={`/studio/${s.toLowerCase().replace(/\s+/g, "-")}`}
                          style={{
                            color: "var(--bloodstone)",
                            fontFamily: "var(--font-body)",
                            fontSize: "var(--text-sm)",
                          }}
                        >
                          {s}
                        </Link>
                      ))}
                    </div>
                  }
                />
              )}
              <MetaRow label="Source" value={anime.source?.replace("_", " ")} />
            </div>

            {/* Where to Watch */}
            {Object.keys(externalLinks).length > 0 && (
              <div style={{ marginTop: "var(--space-5)" }}>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  Where to Watch
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {Object.entries(externalLinks).slice(0, 5).map(([site, url]) => {
                    const label = STREAMING_LABELS[site] ?? site;
                    return (
                      <a
                        key={site}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-2)",
                          padding: "var(--space-2) var(--space-3)",
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-sm)",
                          color: "var(--text)",
                          transition: "border-color var(--transition-fast)",
                        }}
                      >
                        <ExternalLink size={12} color="var(--text-muted)" />
                        {label}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trailer */}
            {anime.trailer_url && (
              <a
                href={anime.trailer_url}
                target="_blank"
                rel="noopener noreferrer"
                id="trailer-link"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "var(--space-2)",
                  marginTop: "var(--space-4)",
                  height: 40,
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  color: "var(--text)",
                  background: "var(--surface)",
                }}
              >
                <Play size={14} color="var(--bloodstone)" />
                Watch Trailer
              </a>
            )}
          </aside>

          {/* ── RIGHT MAIN CONTENT ────────────────────────── */}
          <main>
            {/* Title */}
            <div style={{ marginBottom: "var(--space-6)" }}>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-4xl)",
                  fontWeight: 700,
                  fontStyle: "italic",
                  color: "var(--text)",
                  lineHeight: 1.1,
                  letterSpacing: 0,
                  marginBottom: "var(--space-2)",
                }}
              >
                {title}
              </h1>
              {anime.title_native && (
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-muted)",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  {anime.title_native}
                </p>
              )}
              {/* Genre chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                {anime.genres.map((genre) => (
                  <Link key={genre} href={`/genre/${genre.toLowerCase().replace(/\s+/g, "-")}`} className="genre-chip">
                    {genre}
                  </Link>
                ))}
              </div>
            </div>

            {/* Synopsis */}
            {anime.synopsis && (
              <section style={{ marginBottom: "var(--space-8)" }}>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-xl)",
                    fontWeight: 600,
                    color: "var(--text)",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  Synopsis
                </h2>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-base)",
                    color: "var(--text)",
                    lineHeight: 1.75,
                    opacity: 0.85,
                    maxWidth: 680,
                  }}
                >
                  {anime.synopsis}
                </p>
              </section>
            )}

            <AnimeInteractionPanel
              animeId={anime.id}
              animeSeed={animeSeed}
              animeSlug={anime.slug}
              animeTitle={title}
              episodeCount={anime.episodes}
              communityScore={score}
            />

            <OtakuQuizCard
              animeTitle={title}
              genres={anime.genres}
              studios={anime.studios}
              episodes={anime.episodes}
              format={anime.format}
              seasonYear={anime.season_year}
            />

            {/* Related anime */}
            {relatedAnime.length > 0 && (
              <section style={{ marginBottom: "var(--space-8)" }}>
                <SeasonRail title="Related Anime" anime={relatedAnime} size="sm" />
              </section>
            )}

            <AnimeCommunityPanel
              animeId={anime.id}
              animeTitle={title}
              initialReviews={community.reviews}
              initialComments={community.comments}
              canSync={canSyncCommunity}
            />
          </main>
        </div>
      </div>
    </>
  );
}
