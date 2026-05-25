import type { AnimeRow } from "@/lib/supabase/types";
import { slugify } from "@/lib/utils";

export interface AniListMediaCard {
  id: number;
  title: { romaji: string; english: string | null; native: string | null };
  coverImage: { extraLarge?: string | null; large?: string | null; color: string | null };
  bannerImage: string | null;
  description?: string | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  duration: number | null;
  season: string | null;
  seasonYear: number | null;
  genres: string[];
  averageScore: number | null;
  popularity: number;
  source?: string | null;
  studios?: { nodes: { name: string }[] };
  trailer?: { id: string; site: string } | null;
  externalLinks?: { site: string; url: string }[];
  nextAiringEpisode: { episode: number; airingAt: number } | null;
}

export function mapAniListToAnimeRow(media: AniListMediaCard): AnimeRow {
  const baseTitle = media.title.english || media.title.romaji;
  const externalLinks: Record<string, string> = {};

  media.externalLinks?.forEach(({ site, url }) => {
    externalLinks[site.toLowerCase()] = url;
  });

  return {
    id: `anilist-${media.id}`,
    anilist_id: media.id,
    slug: slugify(baseTitle),
    title_romaji: media.title.romaji,
    title_english: media.title.english,
    title_native: media.title.native,
    synopsis: media.description?.replace(/<[^>]+>/g, "") ?? null,
    cover_image: media.coverImage.extraLarge || media.coverImage.large || null,
    banner_image: media.bannerImage,
    dominant_color: media.coverImage.color,
    format: media.format as AnimeRow["format"],
    status: media.status as AnimeRow["status"],
    episodes: media.episodes,
    duration: media.duration,
    season: media.season as AnimeRow["season"],
    season_year: media.seasonYear,
    genres: media.genres,
    studios: media.studios?.nodes.map((s) => s.name) ?? [],
    source: media.source ?? null,
    anilist_score: media.averageScore ? media.averageScore / 10 : null,
    animelot_score: null,
    popularity: media.popularity,
    trailer_url:
      media.trailer?.site === "youtube"
        ? `https://www.youtube.com/watch?v=${media.trailer.id}`
        : null,
    external_links: externalLinks,
    next_airing_ep: media.nextAiringEpisode?.episode ?? null,
    next_airing_at: media.nextAiringEpisode
      ? new Date(media.nextAiringEpisode.airingAt * 1000).toISOString()
      : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
