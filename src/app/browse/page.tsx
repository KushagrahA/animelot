"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { anilistRequest } from "@/lib/anilist/client";
import { browseFallbackAnime } from "@/lib/anime/fallback";
import { Grid2X2, List, SlidersHorizontal, X } from "lucide-react";
import type { AnimeRow } from "@/lib/supabase/types";

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
  "Mecha", "Music", "Mystery", "Psychological", "Romance", "Sci-Fi",
  "Slice of Life", "Sports", "Supernatural", "Thriller",
  "Shounen", "Shoujo", "Seinen", "Josei", "Ecchi", "Isekai",
];

const FORMATS = ["TV", "MOVIE", "OVA", "ONA", "SPECIAL", "MUSIC"];
const STATUSES = ["RELEASING", "FINISHED", "NOT_YET_RELEASED"];
const SORT_OPTIONS = [
  { value: "POPULARITY_DESC", label: "Most Popular" },
  { value: "SCORE_DESC", label: "Highest Rated" },
  { value: "TRENDING_DESC", label: "Trending" },
  { value: "START_DATE_DESC", label: "Newest" },
  { value: "TITLE_ROMAJI", label: "A – Z" },
];

function getFallbackResults(searchTerm: string) {
  if (!searchTerm) return browseFallbackAnime;
  const normalized = searchTerm.toLowerCase();
  return browseFallbackAnime.filter((anime) => {
    const haystack = `${anime.title_english ?? ""} ${anime.title_romaji} ${anime.genres.join(" ")}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

interface AniListMedia {
  id: number;
  title: { romaji: string; english: string | null; native: string | null };
  coverImage: { extraLarge: string; large: string; color: string | null };
  bannerImage: string | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  duration: number | null;
  season: string | null;
  seasonYear: number | null;
  genres: string[];
  averageScore: number | null;
  popularity: number;
  studios: { nodes: { name: string }[] };
  nextAiringEpisode: { episode: number; airingAt: number } | null;
}

function mapToRow(media: AniListMedia): AnimeRow {
  const baseTitle = media.title.english || media.title.romaji;
  return {
    id: `anilist-${media.id}`,
    anilist_id: media.id,
    slug: baseTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-"),
    title_romaji: media.title.romaji,
    title_english: media.title.english,
    title_native: media.title.native,
    synopsis: null,
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
    source: null,
    anilist_score: media.averageScore ? media.averageScore / 10 : null,
    animelot_score: null,
    popularity: media.popularity,
    trailer_url: null,
    external_links: {},
    next_airing_ep: media.nextAiringEpisode?.episode ?? null,
    next_airing_at: media.nextAiringEpisode ? new Date(media.nextAiringEpisode.airingAt * 1000).toISOString() : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ paddingTop: "var(--space-8)" }}>
        <div className="skeleton" style={{ width: 300, height: 48, borderRadius: "var(--radius-md)", marginBottom: "var(--space-8)" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "var(--space-5)" }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ width: "100%", aspectRatio: "3/4", borderRadius: "var(--radius-lg)" }} />
          ))}
        </div>
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}

function BrowseContent() {
  const searchParams = useSearchParams();
  const searchTerm = (searchParams.get("q") ?? searchParams.get("search"))?.trim() ?? "";

  const [anime, setAnime] = useState<AnimeRow[]>(() => getFallbackResults(searchTerm));
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const loaderRef = useRef<HTMLDivElement>(null);

  // Filter state from URL params
  const [sort, setSort] = useState(searchParams.get("sort") || "POPULARITY_DESC");
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    searchParams.get("genres")?.split(",").filter(Boolean) ?? []
  );
  const [selectedFormat, setSelectedFormat] = useState(searchParams.get("format") || "");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "");

  const fetchAnime = useCallback(async (pg: number, reset = false) => {
    setLoading(true);
    try {
      const genreFilter = selectedGenres.length > 0 ? selectedGenres.join(", ") : null;
      const query = `
        query BrowseAnime($page: Int, $sort: [MediaSort], $genre_in: [String], $format: MediaFormat, $status: MediaStatus, $search: String) {
          Page(page: $page, perPage: 24) {
            pageInfo { hasNextPage }
            media(
              type: ANIME
              sort: $sort
              search: $search
              genre_in: $genre_in
              format: $format
              status: $status
              isAdult: false
            ) {
              id
              title { romaji english native }
              coverImage { extraLarge large color }
              bannerImage
              format status episodes duration season seasonYear genres averageScore popularity
              studios(isMain: true) { nodes { name } }
              nextAiringEpisode { episode airingAt }
            }
          }
        }
      `;
      const data = await anilistRequest<{ Page: { pageInfo: { hasNextPage: boolean }; media: AniListMedia[] } }>({
        query,
        variables: {
          page: pg,
          sort: [sort],
          search: searchTerm || undefined,
          genre_in: genreFilter ? selectedGenres : undefined,
          format: selectedFormat || undefined,
          status: selectedStatus || undefined,
        },
      });

      const newAnime = data.Page.media.map(mapToRow);
      if (newAnime.length > 0) {
        setAnime((prev) => reset ? newAnime : [...prev, ...newAnime]);
      } else if (reset) {
        setAnime(getFallbackResults(searchTerm));
      }
      setHasMore(data.Page.pageInfo.hasNextPage);
    } catch (err) {
      console.error("Browse fetch error:", err);
      if (reset) {
        setAnime(getFallbackResults(searchTerm));
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  }, [sort, selectedGenres, selectedFormat, selectedStatus, searchTerm]);

  // Reset and refetch when filters change — use ref to avoid setState-in-effect cascade
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchAnime(1, true);
      return;
    }
    setPage(1);
    setAnime(getFallbackResults(searchTerm));
    fetchAnime(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, selectedGenres, selectedFormat, selectedStatus, searchTerm]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = loaderRef.current;
    if (!el || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchAnime(nextPage);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchAnime]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedFormat("");
    setSelectedStatus("");
    setSort("POPULARITY_DESC");
  };

  const hasActiveFilters = selectedGenres.length > 0 || selectedFormat || selectedStatus || sort !== "POPULARITY_DESC" || searchTerm.length > 0;

  return (
    <div className="container" style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-16)" }}>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-8)",
          flexWrap: "wrap",
          gap: "var(--space-4)",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-4xl)",
              fontWeight: 700,
              fontStyle: "italic",
              color: "var(--text)",
              lineHeight: 1.1,
            }}
          >
            {searchTerm ? `Search: ${searchTerm}` : "Browse Anime"}
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-muted)", marginTop: 4 }}>
            {searchTerm ? "Search across titles, genres, scores, and formats" : "Discover your next favourite series"}
          </p>
          {searchTerm ? (
            <Link href="/browse" style={{ display: "inline-flex", marginTop: "var(--space-2)", color: "var(--bloodstone)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", fontWeight: 800 }}>
              Clear search
            </Link>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
          <div
            aria-label="View mode"
            style={{
              display: "flex",
              alignItems: "center",
              padding: 3,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              style={{
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: 0,
                borderRadius: "var(--radius-sm)",
                background: view === "grid" ? "var(--bloodstone)" : "transparent",
                color: view === "grid" ? "#FFF9EB" : "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              <Grid2X2 size={15} />
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              style={{
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: 0,
                borderRadius: "var(--radius-sm)",
                background: view === "list" ? "var(--bloodstone)" : "transparent",
                color: view === "list" ? "#FFF9EB" : "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              <List size={16} />
            </button>
          </div>

          {/* Sort */}
          <select
            id="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              height: 40,
              padding: "0 var(--space-4)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              background: "var(--surface)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Filter toggle */}
          <button
            id="filter-toggle-btn"
            onClick={() => setFiltersOpen(!filtersOpen)}
            style={{
              height: 40,
              padding: "0 var(--space-4)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              border: `1px solid ${hasActiveFilters ? "var(--bloodstone)" : "var(--border)"}`,
              borderRadius: "var(--radius-md)",
              background: hasActiveFilters ? "var(--accent-faint)" : "var(--surface)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              color: hasActiveFilters ? "var(--bloodstone)" : "var(--text)",
              cursor: "pointer",
              fontWeight: hasActiveFilters ? 600 : 400,
            }}
          >
            <SlidersHorizontal size={15} />
            Filters
            {hasActiveFilters && (
              <span
                style={{
                  background: "var(--bloodstone)",
                  color: "#FFF9EB",
                  borderRadius: "var(--radius-full)",
                  width: 18,
                  height: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {selectedGenres.length + (selectedFormat ? 1 : 0) + (selectedStatus ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-6)",
            marginBottom: "var(--space-8)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-5)" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 600 }}>
              Filters
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-xs)",
                  color: "var(--bloodstone)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                <X size={12} /> Clear all
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-6)" }}>
            {/* Format */}
            <div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
                Format
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFormat(selectedFormat === f ? "" : f)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-full)",
                      border: `1px solid ${selectedFormat === f ? "var(--bloodstone)" : "var(--border)"}`,
                      background: selectedFormat === f ? "var(--accent-faint)" : "var(--bg)",
                      color: selectedFormat === f ? "var(--bloodstone)" : "var(--text-muted)",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-xs)",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
                Status
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {STATUSES.map((s) => (
                  <label key={s} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="status"
                      checked={selectedStatus === s}
                      onChange={() => setSelectedStatus(selectedStatus === s ? "" : s)}
                      style={{ accentColor: "var(--bloodstone)" }}
                    />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text)" }}>
                      {s === "RELEASING" ? "Airing" : s === "FINISHED" ? "Finished" : "Upcoming"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Genres */}
            <div style={{ gridColumn: "1 / -1" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
                Genres
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                {GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={selectedGenres.includes(g) ? "" : "genre-chip"}
                    style={{
                      padding: "3px 12px",
                      borderRadius: "var(--radius-full)",
                      border: `1px solid ${selectedGenres.includes(g) ? "var(--bloodstone)" : "var(--border)"}`,
                      background: selectedGenres.includes(g) ? "var(--bloodstone)" : "var(--sage-tint)",
                      color: selectedGenres.includes(g) ? "#FFF9EB" : "var(--text)",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-xs)",
                      fontWeight: selectedGenres.includes(g) ? 600 : 500,
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            view === "grid"
              ? "repeat(auto-fill, minmax(150px, 1fr))"
              : "1fr",
          gap: view === "grid" ? "var(--space-5)" : "var(--space-3)",
          minHeight: 400,
        }}
      >
        {anime.map((a) => (
          view === "grid" ? (
            <AnimeCard key={a.id} anime={a} size="md" />
          ) : (
            <Link
              key={a.id}
              href={`/anime/${a.slug}`}
              className="anime-tile"
              style={{
                display: "grid",
                gridTemplateColumns: "64px 1fr auto",
                alignItems: "center",
                gap: "var(--space-4)",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-3)",
                color: "var(--text)",
              }}
            >
              <span
                style={{
                  width: 64,
                  aspectRatio: "3/4",
                  borderRadius: "var(--radius-sm)",
                  background: a.dominant_color ?? "var(--misty-sage)",
                  backgroundImage: a.cover_image ? `url(${a.cover_image})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <span style={{ minWidth: 0 }}>
                <strong className="truncate" style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "var(--text-lg)" }}>
                  {a.title_english || a.title_romaji}
                </strong>
                <span style={{ display: "block", color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)" }}>
                  {a.format?.replace("_", " ") ?? "Anime"} · {a.season_year ?? "Year TBA"}
                </span>
              </span>
              <span style={{ color: "var(--bloodstone)", fontFamily: "var(--font-data)", fontWeight: 800 }}>
                {a.anilist_score ? a.anilist_score.toFixed(1) : "—"}
              </span>
            </Link>
          )
        ))}
        {loading && anime.length === 0 &&
          Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`skel-${i}`}
              className="skeleton"
              style={{ width: "100%", aspectRatio: "3/4", borderRadius: "var(--radius-lg)" }}
            />
          ))}
      </div>

      {/* Infinite scroll loader */}
      {!loading && hasMore && (
        <div ref={loaderRef} style={{ height: 64 }} />
      )}

      {!loading && anime.length === 0 && (
        <div style={{ textAlign: "center", padding: "var(--space-16) 0" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", color: "var(--text-muted)" }}>
            No results found
          </p>
          <button
            onClick={clearFilters}
            style={{ marginTop: "var(--space-4)", fontFamily: "var(--font-body)", color: "var(--bloodstone)", background: "none", border: "none", cursor: "pointer" }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
