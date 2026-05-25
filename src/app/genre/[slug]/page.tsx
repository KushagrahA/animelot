import { anilistRequest } from "@/lib/anilist/client";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { SeasonRail } from "@/components/anime/SeasonRail";
import type { Metadata } from "next";
import type { AnimeRow } from "@/lib/supabase/types";
import { notFound } from "next/navigation";

export const revalidate = 86400;

interface Props {
  params: Promise<{ slug: string }>;
}

// Genre display names and descriptions
const GENRE_INFO: Record<string, { name: string; description: string }> = {
  action: { name: "Action", description: "High-octane battles, intense confrontations, and heart-pounding sequences define the action genre. From supernatural fights to physical showdowns, action anime keeps you on the edge of your seat." },
  adventure: { name: "Adventure", description: "Epic journeys across fantastical worlds, discovering ancient ruins, and forging bonds with allies along the way. Adventure anime is about the thrill of the unknown." },
  comedy: { name: "Comedy", description: "Whether through absurdist humor, clever wordplay, or chaotic situational comedy, these anime will have you laughing out loud — and often when you least expect it." },
  drama: { name: "Drama", description: "Raw human emotion at its most authentic. Drama anime explores the full complexity of life — grief, love, ambition, and the quiet moments in between." },
  fantasy: { name: "Fantasy", description: "Magic systems, mythological creatures, and worlds where the impossible is everyday reality. Fantasy anime ranges from grand epic tales to intimate personal journeys." },
  horror: { name: "Horror", description: "Dread, terror, and the uncanny. Horror anime masterfully builds atmosphere and delivers scares through psychological tension, body horror, or pure supernatural menace." },
  romance: { name: "Romance", description: "Love confessions, slow burns, and the ache of unspoken feelings. Romance anime captures the beautiful, painful, and transformative experience of falling in love." },
  "sci-fi": { name: "Sci-Fi", description: "Cyberpunk cities, space operas, artificial intelligence, and what it means to be human in a technological future. Sci-Fi anime asks the big questions." },
  "slice-of-life": { name: "Slice of Life", description: "The gentle art of finding meaning in the everyday. Slice of life anime finds the extraordinary in ordinary moments — club activities, family meals, small-town summers." },
  psychological: { name: "Psychological", description: "Mind-bending narratives that blur reality, question identity, and explore the darkest corners of the human psyche. Not for the faint of heart." },
  supernatural: { name: "Supernatural", description: "Ghosts, demons, divine powers, and forces beyond human comprehension. Supernatural anime traverses the boundary between the living world and what lies beyond." },
  sports: { name: "Sports", description: "The rush of competition, the weight of teamwork, and the personal growth that comes through pushing past your limits. Sports anime is never just about the game." },
  mecha: { name: "Mecha", description: "Towering robots, political intrigue, and pilots who carry the weight of the world. Mecha anime is a genre that has shaped modern animation history." },
  isekai: { name: "Isekai", description: "Transported to another world — classic isekai formula, but endlessly reinvented. From overpowered protagonists to careful world-building, this genre has something for everyone." },
  shounen: { name: "Shōnen", description: "Friendship, perseverance, and the relentless drive to become stronger. Shōnen anime is built on the promise of growth — and the most beloved titles in the medium live here." },
  shoujo: { name: "Shōjo", description: "Romance, self-discovery, and the inner emotional lives of young protagonists. Shōjo anime is rich, character-driven, and often more visually innovative than any other genre." },
  seinen: { name: "Seinen", description: "Mature, complex narratives written for adult audiences. Seinen anime tackles morally grey characters, philosophical depth, and the complicated realities of adult life." },
  josei: { name: "Josei", description: "Romance and relationships told with adult emotional nuance. Josei anime doesn't shy away from the messiness of real love, careers, and personal identity." },
  mystery: { name: "Mystery", description: "Whodunits, locked-room puzzles, and conspiracies that unravel across entire seasons. Mystery anime rewards careful attention and a suspicious mind." },
  thriller: { name: "Thriller", description: "Tension that never lets up. Thriller anime weaponizes plot twists, time pressure, and moral ambiguity to create stories you can't look away from." },
};

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

async function getGenreAnime(genreName: string) {
  const data = await anilistRequest<{ Page: { media: AniListMedia[] } }>({
    query: `
      query($genre: String) {
        Page(page: 1, perPage: 50) {
          media(type: ANIME, genre: $genre, sort: SCORE_DESC, averageScore_greater: 60, isAdult: false) {
            id
            title { romaji english native }
            coverImage { extraLarge large color }
            bannerImage format status episodes duration season seasonYear genres averageScore popularity
            studios(isMain: true) { nodes { name } }
            nextAiringEpisode { episode airingAt }
          }
        }
      }
    `,
    variables: { genre: genreName },
  });
  return data.Page.media.map(mapToRow);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const info = GENRE_INFO[slug];
  if (!info) return { title: "Genre Not Found | Animelot" };
  return {
    title: `Best ${info.name} Anime — Rated & Reviewed by the Community`,
    description: `Discover the highest-rated ${info.name} anime, rated and reviewed by the Animelot community. ${info.description.slice(0, 100)}...`,
    openGraph: {
      title: `Best ${info.name} Anime | Animelot`,
      description: info.description,
    },
  };
}

export default async function GenrePage({ params }: Props) {
  const { slug } = await params;
  const info = GENRE_INFO[slug];
  if (!info) notFound();

  const anime = await getGenreAnime(info.name);
  const topAnime = anime.slice(0, 10);
  const restAnime = anime.slice(10);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Best ${info.name} Anime`,
    description: info.description,
    url: `https://animelot.com/genre/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Genre Hero */}
      <div
        style={{
          background: "var(--misty-sage)",
          borderBottom: "1px solid var(--border)",
          padding: "var(--space-12) 0 var(--space-10)",
        }}
      >
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--ink)", opacity: 0.5 }}>
              Genre
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-5xl)",
              fontWeight: 800,
              fontStyle: "italic",
              color: "var(--ink)",
              lineHeight: 1.05,
              letterSpacing: 0,
              marginBottom: "var(--space-5)",
            }}
          >
            {info.name}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-lg)",
              color: "var(--ink)",
              opacity: 0.75,
              maxWidth: 680,
              lineHeight: 1.65,
            }}
          >
            {info.description}
          </p>
          <p
            style={{
              fontFamily: "var(--font-data)",
              fontSize: "var(--text-sm)",
              color: "var(--bloodstone)",
              marginTop: "var(--space-4)",
              fontWeight: 700,
            }}
          >
            {anime.length} titles rated by the community
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: "var(--space-10)", paddingBottom: "var(--space-16)" }}>
        {/* Top 10 */}
        <section style={{ marginBottom: "var(--space-12)" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-2xl)",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "var(--space-6)",
            }}
          >
            Top {info.name} Anime
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "var(--space-5)",
            }}
          >
            {topAnime.map((a, i) => (
              <AnimeCard key={a.id} anime={a} size="md" rank={i + 1} />
            ))}
          </div>
        </section>

        {/* More in genre */}
        {restAnime.length > 0 && (
          <SeasonRail title={`More ${info.name} Anime`} anime={restAnime} size="sm" />
        )}
      </div>
    </>
  );
}
