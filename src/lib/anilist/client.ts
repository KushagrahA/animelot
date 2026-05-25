const ANILIST_API = "https://graphql.anilist.co";

interface AniListRequestOptions {
  query: string;
  variables?: Record<string, unknown>;
}

export async function anilistRequest<T>(options: AniListRequestOptions): Promise<T> {
  const response = await fetch(ANILIST_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(options),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`AniList GraphQL error: ${data.errors[0]?.message}`);
  }

  return data.data as T;
}

// ── Fragments ───────────────────────────────────────────────
const ANIME_CARD_FIELDS = `
  id
  title { romaji english native }
  coverImage { large extraLarge color }
  bannerImage
  format
  status
  episodes
  duration
  season
  seasonYear
  genres
  averageScore
  popularity
  studios(isMain: true) { nodes { name } }
  nextAiringEpisode { episode airingAt }
`;

// ── Queries ──────────────────────────────────────────────────
export const QUERIES = {
  seasonal: (season: string, year: number) => ({
    query: `
      query SeasonalAnime($season: MediaSeason, $year: Int) {
        Page(page: 1, perPage: 50) {
          media(season: $season, seasonYear: $year, type: ANIME, sort: POPULARITY_DESC) {
            ${ANIME_CARD_FIELDS}
          }
        }
      }
    `,
    variables: { season, year },
  }),

  trending: () => ({
    query: `
      query TrendingAnime {
        Page(page: 1, perPage: 20) {
          media(type: ANIME, sort: TRENDING_DESC) {
            ${ANIME_CARD_FIELDS}
          }
        }
      }
    `,
  }),

  topRated: () => ({
    query: `
      query TopRatedAnime {
        Page(page: 1, perPage: 20) {
          media(type: ANIME, sort: SCORE_DESC, averageScore_greater: 70) {
            ${ANIME_CARD_FIELDS}
          }
        }
      }
    `,
  }),

  animeDetail: (slug: string) => ({
    query: `
      query AnimeDetail($search: String) {
        Media(search: $search, type: ANIME) {
          ${ANIME_CARD_FIELDS}
          description(asHtml: false)
          source
          trailer { id site }
          externalLinks { site url }
          relations {
            edges {
              relationType
              node { id title { romaji english } coverImage { large } format status }
            }
          }
          recommendations(perPage: 10) {
            nodes {
              mediaRecommendation {
                id title { romaji english } coverImage { large } averageScore
              }
            }
          }
        }
      }
    `,
    variables: { search: slug.replace(/-/g, " ") },
  }),

  search: (query: string) => ({
    query: `
      query SearchAnime($search: String) {
        Page(page: 1, perPage: 10) {
          media(search: $search, type: ANIME) {
            id
            title { romaji english }
            coverImage { medium }
            format
            seasonYear
            averageScore
          }
        }
      }
    `,
    variables: { search: query },
  }),

  seedBatch: (page: number, perPage = 50, sort = "POPULARITY_DESC") => ({
    query: `
      query SeedBatch($page: Int, $perPage: Int, $sort: [MediaSort]) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { hasNextPage currentPage }
          media(type: ANIME, sort: $sort) {
            ${ANIME_CARD_FIELDS}
            description(asHtml: false)
            source
            trailer { id site }
            externalLinks { site url }
          }
        }
      }
    `,
    variables: { page, perPage, sort: [sort] },
  }),
};
