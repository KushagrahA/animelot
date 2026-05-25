#!/usr/bin/env node
/**
 * Animelot — AniList → Supabase Seed Script
 *
 * Run with: npx ts-node --esm scripts/seed.ts
 * Or after adding to package.json scripts: npm run seed
 *
 * Rate limit: AniList allows 90 req/min → we wait 700ms between requests.
 * Seed passes:
 *   Pass 1: Top 1000 by popularity
 *   Pass 2: Current + next season (all)
 *   Pass 3: Top 200 by score
 *   Pass 4: Key studios (MAPPA, Ufotable, etc.)
 */

import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANILIST_URL = "https://graphql.anilist.co";
const DELAY_MS = 750; // safe under 90 req/min

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Slugify ───────────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100); // max 100 chars
}

// ── AniList request with backoff ──────────────────────────────
async function anilistReq(query: string, variables: Record<string, unknown> = {}): Promise<unknown> {
  let retries = 3;
  while (retries > 0) {
    try {
      const res = await fetch(ANILIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query, variables }),
      });

      if (res.status === 429) {
        const resetHeader = res.headers.get("X-RateLimit-Reset");
        const waitMs = resetHeader ? (parseInt(resetHeader) * 1000 - Date.now() + 500) : 60000;
        console.warn(`  ⏳ Rate limited. Waiting ${Math.round(waitMs / 1000)}s...`);
        await sleep(Math.min(waitMs, 65000));
        retries--;
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0]?.message);
      return json.data;
    } catch (err) {
      retries--;
      if (retries === 0) throw err;
      await sleep(2000);
    }
  }
  throw new Error("Max retries exceeded");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Map AniList media → DB row ────────────────────────────────
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
  externalLinks: { site: string; url: string }[];
  nextAiringEpisode: { episode: number; airingAt: number } | null;
}

function mapToDbRow(media: AniListMedia) {
  const baseTitle = (media.title.english || media.title.romaji);
  const slug = slugify(baseTitle);

  const externalLinks: Record<string, string> = {};
  media.externalLinks?.forEach(({ site, url }) => {
    externalLinks[site.toLowerCase()] = url;
  });

  let trailerUrl: string | null = null;
  if (media.trailer?.site === "youtube") {
    trailerUrl = `https://www.youtube.com/watch?v=${media.trailer.id}`;
  }

  return {
    anilist_id: media.id,
    slug,
    title_romaji: media.title.romaji,
    title_english: media.title.english ?? null,
    title_native: media.title.native ?? null,
    synopsis: media.description?.replace(/<[^>]+>/g, "") ?? null, // strip HTML
    cover_image: media.coverImage.extraLarge || media.coverImage.large || null,
    banner_image: media.bannerImage ?? null,
    dominant_color: media.coverImage.color ?? null,
    format: media.format ?? null,
    status: media.status ?? null,
    episodes: media.episodes ?? null,
    duration: media.duration ?? null,
    season: media.season ?? null,
    season_year: media.seasonYear ?? null,
    genres: media.genres ?? [],
    studios: media.studios?.nodes?.map((s: { name: string }) => s.name) ?? [],
    source: media.source ?? null,
    anilist_score: media.averageScore ? media.averageScore / 10 : null,
    popularity: media.popularity ?? 0,
    trailer_url: trailerUrl,
    external_links: externalLinks,
    next_airing_ep: media.nextAiringEpisode?.episode ?? null,
    next_airing_at: media.nextAiringEpisode
      ? new Date(media.nextAiringEpisode.airingAt * 1000).toISOString()
      : null,
  };
}

// ── GraphQL fragment ──────────────────────────────────────────
const FIELDS = `
  id
  title { romaji english native }
  coverImage { extraLarge large color }
  bannerImage
  description(asHtml: false)
  format
  status
  episodes
  duration
  season
  seasonYear
  genres
  averageScore
  popularity
  source
  studios(isMain: true) { nodes { name } }
  trailer { id site }
  externalLinks { site url }
  nextAiringEpisode { episode airingAt }
`;

// ── Upsert batch to Supabase ──────────────────────────────────
async function upsertBatch(rows: ReturnType<typeof mapToDbRow>[], passLabel: string) {
  if (rows.length === 0) return;

  const { error } = await supabase
    .from("anime")
    .upsert(rows, { onConflict: "anilist_id", ignoreDuplicates: false });

  if (error) {
    console.error(`  ❌ Upsert error in ${passLabel}:`, error.message);
  } else {
    console.log(`  ✅ Upserted ${rows.length} rows (${passLabel})`);
  }
}

// ── Pass 1: Top by popularity (paginated) ─────────────────────
async function seedByPopularity(maxPages = 20) {
  console.log("\n📦 Pass 1: Top anime by popularity...");
  let total = 0;

  for (let page = 1; page <= maxPages; page++) {
    const data = await anilistReq(
      `query($page: Int) {
        Page(page: $page, perPage: 50) {
          pageInfo { hasNextPage }
          media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) { ${FIELDS} }
        }
      }`,
      { page }
    ) as { Page: { pageInfo: { hasNextPage: boolean }; media: AniListMedia[] } };

    const rows = data.Page.media.map(mapToDbRow);
    await upsertBatch(rows, `Page ${page}`);
    total += rows.length;

    if (!data.Page.pageInfo.hasNextPage) break;
    await sleep(DELAY_MS);
    process.stdout.write(`  Progress: ${total} anime\r`);
  }

  console.log(`\n  Total pass 1: ${total} anime`);
}

// ── Pass 2: Current + next season ────────────────────────────
async function seedSeasonal() {
  console.log("\n📅 Pass 2: Seasonal anime...");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  let season = "WINTER";
  if (month >= 4 && month <= 6) season = "SPRING";
  else if (month >= 7 && month <= 9) season = "SUMMER";
  else if (month >= 10 && month <= 12) season = "FALL";

  const seasons = [
    { season, year },
  ];

  for (const { season: s, year: y } of seasons) {
    let page = 1;
    let hasNext = true;
    let count = 0;

    while (hasNext) {
      const data = await anilistReq(
        `query($season: MediaSeason, $year: Int, $page: Int) {
          Page(page: $page, perPage: 50) {
            pageInfo { hasNextPage }
            media(season: $season, seasonYear: $year, type: ANIME, sort: POPULARITY_DESC) { ${FIELDS} }
          }
        }`,
        { season: s, year: y, page }
      ) as { Page: { pageInfo: { hasNextPage: boolean }; media: AniListMedia[] } };

      const rows = data.Page.media.map(mapToDbRow);
      await upsertBatch(rows, `${s} ${y} p${page}`);
      count += rows.length;
      hasNext = data.Page.pageInfo.hasNextPage;
      page++;
      await sleep(DELAY_MS);
    }

    console.log(`  ${s} ${y}: ${count} anime`);
  }
}

// ── Pass 3: Top by score ──────────────────────────────────────
async function seedByScore(maxPages = 4) {
  console.log("\n⭐ Pass 3: Top scored anime...");
  let total = 0;

  for (let page = 1; page <= maxPages; page++) {
    const data = await anilistReq(
      `query($page: Int) {
        Page(page: $page, perPage: 50) {
          pageInfo { hasNextPage }
          media(type: ANIME, sort: SCORE_DESC, averageScore_greater: 75, isAdult: false) { ${FIELDS} }
        }
      }`,
      { page }
    ) as { Page: { pageInfo: { hasNextPage: boolean }; media: AniListMedia[] } };

    const rows = data.Page.media.map(mapToDbRow);
    await upsertBatch(rows, `Score page ${page}`);
    total += rows.length;

    if (!data.Page.pageInfo.hasNextPage) break;
    await sleep(DELAY_MS);
  }

  console.log(`  Total pass 3: ${total} anime`);
}

// ── Pass 4: Key studios ───────────────────────────────────────
async function seedByStudios() {
  console.log("\n🏢 Pass 4: Key studio anime...");

  const studioIds = [
    21,    // Kyoto Animation
    1,     // TMS Entertainment
    4,     // Bones
    11,    // Madhouse
    14,    // Sunrise
    561,   // J.C. Staff
    858,   // Ufotable
    1836,  // MAPPA
    2614,  // Wit Studio
    7314,  // Trigger
  ];

  for (const studioId of studioIds) {
    const data = await anilistReq(
      `query($id: Int) {
        Studio(id: $id) {
          name
          media(sort: POPULARITY_DESC, perPage: 25, type: ANIME) {
            nodes { ${FIELDS} }
          }
        }
      }`,
      { id: studioId }
    ) as { Studio: { name: string; media: { nodes: AniListMedia[] } } };

    const rows = data.Studio.media.nodes.map(mapToDbRow);
    await upsertBatch(rows, data.Studio.name);
    await sleep(DELAY_MS);
  }
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log("🌸 Animelot Seed Script Starting...");
  console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 Service key: ${SUPABASE_SERVICE_KEY ? "✅ Present" : "❌ MISSING"}\n`);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
    process.exit(1);
  }

  const start = Date.now();

  await seedByPopularity(20);  // ~1000 anime
  await seedSeasonal();
  await seedByScore(4);        // ~200 additional
  await seedByStudios();       // Key studios

  const { count } = await supabase.from("anime").select("*", { count: "exact", head: true });
  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);

  console.log("\n═══════════════════════════════");
  console.log(`✨ Seed complete in ${elapsed}min`);
  console.log(`📊 Total anime in DB: ${count}`);
  console.log("═══════════════════════════════");
}

main().catch(console.error);
