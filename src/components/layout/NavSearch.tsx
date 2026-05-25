"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { anilistRequest, QUERIES } from "@/lib/anilist/client";
import { browseFallbackAnime } from "@/lib/anime/fallback";
import { slugify } from "@/lib/utils";

interface SearchResult {
  id: number;
  title: { romaji: string; english: string | null };
  coverImage: { medium: string | null };
  format: string | null;
  seasonYear: number | null;
  averageScore: number | null;
}

function fallbackToResult(anime: (typeof browseFallbackAnime)[number]): SearchResult {
  return {
    id: anime.anilist_id,
    title: { romaji: anime.title_romaji, english: anime.title_english },
    coverImage: { medium: anime.cover_image },
    format: anime.format,
    seasonYear: anime.season_year,
    averageScore: anime.anilist_score ? Math.round(anime.anilist_score * 10) : null,
  };
}

function getLocalResults(query: string) {
  const normalized = query.toLowerCase();
  return browseFallbackAnime
    .filter((anime) => {
      const title = `${anime.title_english ?? ""} ${anime.title_romaji} ${anime.genres.join(" ")}`.toLowerCase();
      return title.includes(normalized);
    })
    .slice(0, 6)
    .map(fallbackToResult);
}

export function NavSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [inlineFocused, setInlineFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmedQuery = useMemo(() => query.trim(), [query]);
  const displayedResults = trimmedQuery.length < 2 ? [] : results;
  const popularResults = useMemo(() => browseFallbackAnime.slice(0, 5).map(fallbackToResult), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open || trimmedQuery.length < 2) {
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      const localResults = getLocalResults(trimmedQuery);
      setResults(localResults);
      setLoading(true);
      try {
        const data = await anilistRequest<{ Page: { media: SearchResult[] } }>(
          QUERIES.search(trimmedQuery)
        );
        if (!cancelled) setResults(data.Page.media.length > 0 ? data.Page.media : localResults);
      } catch {
        if (!cancelled) setResults(localResults);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [open, trimmedQuery]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    const nextQuery = value.trim();
    if (nextQuery.length < 2) {
      setResults([]);
    } else {
      setResults(getLocalResults(nextQuery));
    }
  };

  const submitSearch = (value = query) => {
    const search = value.trim();
    if (search.length < 2) return;
    setOpen(false);
    setInlineFocused(false);
    router.push(`/browse?q=${encodeURIComponent(search)}`);
  };

  const renderResult = (result: SearchResult, compact = false) => {
    const title = result.title.english || result.title.romaji;
    return (
      <Link
        key={result.id}
        href={`/anime/${slugify(title)}`}
        onClick={() => {
          setOpen(false);
          setInlineFocused(false);
        }}
        style={{
          display: "grid",
          gridTemplateColumns: compact ? "34px minmax(0, 1fr) auto" : "42px minmax(0, 1fr) auto",
          alignItems: "center",
          gap: "var(--space-3)",
          padding: compact ? "7px 8px" : "var(--space-2)",
          borderRadius: "var(--radius-md)",
          color: "var(--text)",
        }}
        className="hover:bg-[var(--bg)]"
      >
        <span
          style={{
            position: "relative",
            width: compact ? 34 : 42,
            height: compact ? 44 : 56,
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
            background: "var(--misty-sage)",
          }}
        >
            {result.coverImage.medium ? (
            <Image src={result.coverImage.medium} alt="" fill sizes={compact ? "34px" : "42px"} className="object-cover" />
          ) : null}
        </span>
        <span style={{ minWidth: 0 }}>
          <span
            style={{
              display: "block",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-display)",
              fontSize: compact ? "var(--text-sm)" : "var(--text-base)",
              fontWeight: 700,
            }}
          >
            {title}
          </span>
          <span
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xs)",
            }}
          >
            {result.format?.replace("_", " ") ?? "Anime"}
            {result.seasonYear ? ` · ${result.seasonYear}` : ""}
          </span>
        </span>
        <span
          style={{
            color: "var(--bloodstone)",
            fontFamily: "var(--font-data)",
            fontSize: "var(--text-xs)",
            fontWeight: 700,
          }}
        >
          {result.averageScore ? (result.averageScore / 10).toFixed(1) : "--"}
        </span>
      </Link>
    );
  };

  return (
    <>
      <div
        className="nav-search-cluster"
        onBlur={() => {
          window.setTimeout(() => setInlineFocused(false), 120);
        }}
      >
        <form
          className="nav-search-inline"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const input = event.currentTarget.elements.namedItem("anime-search") as HTMLInputElement | null;
            submitSearch(input?.value ?? query);
          }}
        >
          <Search size={15} aria-hidden="true" />
          <input
            name="anime-search"
            value={query}
            onFocus={() => setInlineFocused(true)}
            onChange={(event) => handleQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitSearch(event.currentTarget.value);
              }
            }}
            placeholder="Search anime"
            aria-label="Search anime"
            autoComplete="off"
          />
          <button type="submit" aria-label="Search">
            <ArrowRight size={14} />
          </button>
        </form>

        {inlineFocused && trimmedQuery.length >= 2 ? (
          <div className="nav-search-suggestions" role="listbox" aria-label="Anime suggestions">
            <div className="nav-search-suggestions-list">
              {displayedResults.length > 0 ? displayedResults.slice(0, 5).map((result) => renderResult(result, true)) : (
                <div className="nav-search-empty">{loading ? "Searching..." : "No quick matches"}</div>
              )}
            </div>
            <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => submitSearch()} className="nav-search-all">
              Search all for &quot;{trimmedQuery}&quot;
              <ArrowRight size={14} />
            </button>
          </div>
        ) : null}
      </div>

      <button
        id="navbar-search-btn"
        type="button"
        className="nav-search-trigger hover:border-[var(--bloodstone)] hover:text-[var(--bloodstone)]"
        onClick={() => setOpen(true)}
        aria-label="Search anime"
        style={{
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          background: "var(--surface)",
          color: "var(--text-muted)",
          cursor: "pointer",
          transition: "all var(--transition-fast)",
        }}
      >
        <Search size={16} />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search anime"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(32,28,24,0.58)",
            backdropFilter: "blur(2px)",
            display: "flex",
            justifyContent: "center",
            padding: "9vh var(--space-4) var(--space-4)",
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            style={{
              width: "min(620px, 100%)",
              maxHeight: "78vh",
              background: "var(--vanilla-custard)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "0 28px 90px rgba(20,16,14,0.34)",
              overflow: "hidden",
            }}
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const input = event.currentTarget.elements.namedItem("anime-search") as HTMLInputElement | null;
                submitSearch(input?.value ?? query);
              }}
              style={{ position: "relative", borderBottom: "1px solid var(--border)" }}
            >
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: 18,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                ref={inputRef}
                name="anime-search"
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submitSearch(event.currentTarget.value);
                  }
                }}
                placeholder="Search anime..."
                style={{
                  width: "100%",
                  height: 58,
                  border: 0,
                  outline: 0,
                  background: "transparent",
                  padding: "0 56px 0 48px",
                  color: "var(--text)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-base)",
                }}
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close search"
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 30,
                  height: 30,
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg)",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={15} />
              </button>
            </form>

            <div style={{ padding: "var(--space-3)", overflowY: "auto", maxHeight: "calc(78vh - 59px)" }}>
              {trimmedQuery.length < 2 ? (
                <div style={{ display: "grid", gap: "var(--space-2)" }}>
                  <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", padding: "var(--space-2) var(--space-2) var(--space-1)" }}>
                    Search by title, genre, or mood.
                  </p>
                  {popularResults.map((result) => renderResult(result))}
                </div>
              ) : loading ? (
                <div style={{ display: "grid", gap: "var(--space-2)" }}>
                  {displayedResults.length > 0 ? displayedResults.map((result) => renderResult(result)) : Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="skeleton" style={{ height: 64, borderRadius: "var(--radius-md)" }} />
                  ))}
                </div>
              ) : displayedResults.length > 0 ? (
                <div style={{ display: "grid", gap: "var(--space-2)" }}>
                  {displayedResults.map((result) => renderResult(result))}
                  <button
                    type="button"
                    onClick={() => submitSearch()}
                    className="jelly-button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                      minHeight: 44,
                      padding: "0 var(--space-3)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      background: "var(--bg)",
                      color: "var(--bloodstone)",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-sm)",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {`Search all results for "${trimmedQuery}"`}
                    <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", padding: "var(--space-4)" }}>
                  No matches found.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
