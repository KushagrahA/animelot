import { NextResponse } from "next/server";
import { slugify } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { AnimeSeedPayload } from "@/lib/anime/seed";
import type { Database } from "@/lib/supabase/types";

type WatchStatus = Database["public"]["Tables"]["watch_status"]["Row"]["status"];

interface InteractionBody {
  animeId: string;
  animeSeed?: AnimeSeedPayload;
  score: number | null;
  status: WatchStatus;
  headline: string;
  review: string;
  episodeScope: number | null;
  containsSpoilers: boolean;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
const VALID_STATUSES = new Set<WatchStatus>(["watching", "completed", "dropped", "plan_to_watch", "on_hold"]);

function isUuid(value: string) {
  return UUID_RE.test(value);
}

function cleanScore(score: unknown) {
  if (score == null) return null;
  const next = Number(score);
  if (!Number.isFinite(next)) return null;
  return Math.min(10, Math.max(0.5, Math.round(next * 2) / 2));
}

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function normalizeSeed(seed: AnimeSeedPayload) {
  const slug = slugify(seed.slug || seed.title_english || seed.title_romaji || `anime-${seed.anilist_id}`);

  return {
    anilist_id: seed.anilist_id,
    slug,
    title_romaji: cleanText(seed.title_romaji, 300) || cleanText(seed.title_english, 300) || `Anime ${seed.anilist_id}`,
    title_english: cleanText(seed.title_english, 300) || null,
    title_native: cleanText(seed.title_native, 300) || null,
    synopsis: cleanText(seed.synopsis, 12000) || null,
    cover_image: cleanText(seed.cover_image, 1000) || null,
    banner_image: cleanText(seed.banner_image, 1000) || null,
    dominant_color: cleanText(seed.dominant_color, 20) || null,
    format: seed.format,
    status: seed.status,
    episodes: seed.episodes,
    duration: seed.duration,
    season: seed.season,
    season_year: seed.season_year,
    genres: Array.isArray(seed.genres) ? seed.genres.slice(0, 24) : [],
    studios: Array.isArray(seed.studios) ? seed.studios.slice(0, 12) : [],
    source: cleanText(seed.source, 100) || null,
    anilist_score: seed.anilist_score,
    animelot_score: null,
    popularity: seed.popularity ?? 0,
    trailer_url: cleanText(seed.trailer_url, 1000) || null,
    external_links: seed.external_links && typeof seed.external_links === "object" ? seed.external_links : {},
    next_airing_ep: seed.next_airing_ep,
    next_airing_at: seed.next_airing_at,
  };
}

async function ensureProfile(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  const username = `user_${user.id.replace(/-/g, "").slice(0, 10)}`;
  const displayName =
    cleanText(user.user_metadata?.full_name, 50) ||
    cleanText(user.user_metadata?.name, 50) ||
    cleanText(user.email?.split("@")[0], 50) ||
    "Animelot User";

  await admin.from("profiles").upsert(
    {
      id: user.id,
      username,
      display_name: displayName,
      avatar_url: cleanText(user.user_metadata?.avatar_url, 1000) || cleanText(user.user_metadata?.picture, 1000) || null,
      bio: null,
      location: null,
      website: null,
      accent_color: "#5D0D18",
      theme: "paper",
      title_pref: "english",
      is_verified: false,
      is_moderator: false,
    },
    { onConflict: "id" }
  );
}

async function resolveAnimeId(animeId: string, seed: AnimeSeedPayload | undefined) {
  if (isUuid(animeId)) return { animeId };

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      error: NextResponse.json(
        { error: "Catalog sync needs SUPABASE_SERVICE_ROLE_KEY before new AniList anime can publish public ratings." },
        { status: 409 }
      ),
    };
  }

  if (!seed || !Number.isInteger(seed.anilist_id) || seed.anilist_id <= 0) {
    return { error: NextResponse.json({ error: "Missing anime seed payload." }, { status: 400 }) };
  }

  const payload = normalizeSeed(seed);
  const { data, error } = await admin
    .from("anime")
    .upsert(payload, { onConflict: "anilist_id" })
    .select("id")
    .single();

  if (error || !data) {
    return { error: NextResponse.json({ error: "Could not prepare this anime for public ratings." }, { status: 500 }) };
  }

  return { animeId: data.id };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to publish ratings." }, { status: 401 });
  }

  const body = (await request.json()) as Partial<InteractionBody>;
  const status = VALID_STATUSES.has(body.status as WatchStatus) ? (body.status as WatchStatus) : "plan_to_watch";
  const score = cleanScore(body.score);
  const animeIdInput = cleanText(body.animeId, 80);

  if (!animeIdInput) {
    return NextResponse.json({ error: "Missing anime id." }, { status: 400 });
  }

  await ensureProfile(user);

  const resolved = await resolveAnimeId(animeIdInput, body.animeSeed);
  if (resolved.error) return resolved.error;

  const writer = getSupabaseAdmin() ?? supabase;
  const episodeScope = body.episodeScope == null ? null : Math.max(0, Math.floor(Number(body.episodeScope) || 0));
  const headline = cleanText(body.headline, 120);
  const review = cleanText(body.review, 10000);

  if (score != null) {
    const { error } = await writer.from("ratings").upsert(
      {
        user_id: user.id,
        anime_id: resolved.animeId,
        score,
        review: review.length > 0 ? review : null,
        review_headline: headline.length > 0 ? headline : null,
        contains_spoilers: Boolean(body.containsSpoilers),
        episode_scope: episodeScope,
      },
      { onConflict: "user_id,anime_id" }
    );
    if (error) {
      return NextResponse.json({ error: "Could not publish this rating yet." }, { status: 500 });
    }
  }

  const { error: watchError } = await writer.from("watch_status").upsert(
    {
      user_id: user.id,
      anime_id: resolved.animeId,
      status,
      progress: episodeScope ?? 0,
      rewatches: 0,
      notes: null,
      started_at: null,
      completed_at: null,
    },
    { onConflict: "user_id,anime_id" }
  );

  if (watchError) {
    return NextResponse.json({ error: "Could not save watch status yet." }, { status: 500 });
  }

  return NextResponse.json({
    animeId: resolved.animeId,
    message: score != null ? "Rating published to Animelot." : "Saved to your Animelot account.",
  });
}
