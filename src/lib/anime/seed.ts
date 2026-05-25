import type { AnimeRow, Json } from "@/lib/supabase/types";

export interface AnimeSeedPayload {
  anilist_id: number;
  slug: string;
  title_romaji: string;
  title_english: string | null;
  title_native: string | null;
  synopsis: string | null;
  cover_image: string | null;
  banner_image: string | null;
  dominant_color: string | null;
  format: AnimeRow["format"];
  status: AnimeRow["status"];
  episodes: number | null;
  duration: number | null;
  season: AnimeRow["season"];
  season_year: number | null;
  genres: string[];
  studios: string[];
  source: string | null;
  anilist_score: number | null;
  popularity: number;
  trailer_url: string | null;
  external_links: Json;
  next_airing_ep: number | null;
  next_airing_at: string | null;
}

export function animeToSeedPayload(anime: AnimeRow): AnimeSeedPayload {
  return {
    anilist_id: anime.anilist_id,
    slug: anime.slug,
    title_romaji: anime.title_romaji,
    title_english: anime.title_english,
    title_native: anime.title_native,
    synopsis: anime.synopsis,
    cover_image: anime.cover_image,
    banner_image: anime.banner_image,
    dominant_color: anime.dominant_color,
    format: anime.format,
    status: anime.status,
    episodes: anime.episodes,
    duration: anime.duration,
    season: anime.season,
    season_year: anime.season_year,
    genres: anime.genres,
    studios: anime.studios,
    source: anime.source,
    anilist_score: anime.anilist_score,
    popularity: anime.popularity,
    trailer_url: anime.trailer_url,
    external_links: anime.external_links,
    next_airing_ep: anime.next_airing_ep,
    next_airing_at: anime.next_airing_at,
  };
}
