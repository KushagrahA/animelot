import { anilistRequest, QUERIES } from "@/lib/anilist/client";
import { createClient } from "@/lib/supabase/server";
import type { AnimeRow } from "@/lib/supabase/types";
import { mapAniListToAnimeRow, type AniListMediaCard } from "./mapper";

type AnimeSeason = NonNullable<AnimeRow["season"]>;

export interface HomeAnimeData {
  season: AnimeSeason;
  year: number;
  seasonalAnime: AnimeRow[];
  trendingAnime: AnimeRow[];
  topRatedAnime: AnimeRow[];
  source: "supabase" | "anilist" | "mixed";
}

export function getCurrentSeason(): { season: AnimeSeason; year: number } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  let season: AnimeSeason = "WINTER";

  if (month >= 4 && month <= 6) season = "SPRING";
  else if (month >= 7 && month <= 9) season = "SUMMER";
  else if (month >= 10 && month <= 12) season = "FALL";

  return { season, year };
}

async function withTimeout<T>(promise: Promise<T>, fallback: T, ms = 2500): Promise<T> {
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

function hasSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      !url.includes("your-project") &&
      !key.includes("your-anon-key")
  );
}

async function getDbSeasonalAnime(season: AnimeSeason, year: number) {
  if (!hasSupabaseConfig()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anime")
      .select("*")
      .eq("season", season)
      .eq("season_year", year)
      .order("popularity", { ascending: false })
      .limit(24)
      .returns<AnimeRow[]>();

    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

async function getDbTrendingAnime() {
  if (!hasSupabaseConfig()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anime")
      .select("*")
      .order("popularity", { ascending: false })
      .limit(16)
      .returns<AnimeRow[]>();

    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

async function getDbTopRatedAnime() {
  if (!hasSupabaseConfig()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anime")
      .select("*")
      .order("animelot_score", { ascending: false, nullsFirst: false })
      .order("anilist_score", { ascending: false, nullsFirst: false })
      .limit(12)
      .returns<AnimeRow[]>();

    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

async function getAniListSeasonalAnime(season: AnimeSeason, year: number) {
  try {
    const data = await anilistRequest<{ Page: { media: AniListMediaCard[] } }>(
      QUERIES.seasonal(season, year)
    );
    return data.Page.media.map(mapAniListToAnimeRow);
  } catch {
    return [];
  }
}

async function getAniListTrendingAnime() {
  try {
    const data = await anilistRequest<{ Page: { media: AniListMediaCard[] } }>(
      QUERIES.trending()
    );
    return data.Page.media.map(mapAniListToAnimeRow);
  } catch {
    return [];
  }
}

async function getAniListTopRatedAnime() {
  try {
    const data = await anilistRequest<{ Page: { media: AniListMediaCard[] } }>(
      QUERIES.topRated()
    );
    return data.Page.media.map(mapAniListToAnimeRow);
  } catch {
    return [];
  }
}

export async function getHomeAnimeData(): Promise<HomeAnimeData> {
  const { season, year } = getCurrentSeason();

  const [dbSeasonal, dbTrending, dbTopRated] = await Promise.all([
    withTimeout(getDbSeasonalAnime(season, year), []),
    withTimeout(getDbTrendingAnime(), []),
    withTimeout(getDbTopRatedAnime(), []),
  ]);

  const [seasonalAnime, trendingAnime, topRatedAnime] = await Promise.all([
    dbSeasonal.length > 0 ? dbSeasonal : withTimeout(getAniListSeasonalAnime(season, year), []),
    dbTrending.length > 0 ? dbTrending : withTimeout(getAniListTrendingAnime(), []),
    dbTopRated.length > 0 ? dbTopRated : withTimeout(getAniListTopRatedAnime(), []),
  ]);

  const dbHits = [dbSeasonal, dbTrending, dbTopRated].filter((rows) => rows.length > 0).length;
  const source = dbHits === 3 ? "supabase" : dbHits === 0 ? "anilist" : "mixed";

  return {
    season,
    year,
    seasonalAnime,
    trendingAnime,
    topRatedAnime,
    source,
  };
}
