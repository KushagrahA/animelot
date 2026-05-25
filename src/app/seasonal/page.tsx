import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock, Filter } from "lucide-react";
import { getHomeAnimeData } from "@/lib/anime/data";
import { formatEpisodes, formatScore, getAnimeTitle } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ongoing Anime — Airing Now",
  description: "Browse ongoing anime airing now, with scores, formats, episode counts, and quick links.",
};

export const revalidate = 3600;

export default async function SeasonalPage() {
  const { season, year, seasonalAnime } = await getHomeAnimeData();
  const seasonName = `${season.charAt(0)}${season.slice(1).toLowerCase()} ${year}`;

  return (
    <div className="landing-shell" style={{ padding: "var(--space-10) 0 var(--space-20)" }}>
      <div className="container">
        <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: "var(--space-5)", flexWrap: "wrap", marginBottom: "var(--space-8)" }}>
          <div>
            <p style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--bloodstone)", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <CalendarDays size={16} />
              Ongoing radar
            </p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-5xl)", fontStyle: "italic", fontWeight: 850, marginTop: "var(--space-3)" }}>
              {seasonName}
            </h1>
            <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "var(--text-base)", maxWidth: 620, marginTop: "var(--space-3)" }}>
              A compact chart for currently airing and upcoming titles, with score, format, episode, and quick watch-list signals.
            </p>
          </div>
          <Link href="/browse?status=RELEASING" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 var(--space-4)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text)", fontFamily: "var(--font-body)", fontWeight: 700 }}>
            <Filter size={16} />
            Filter airing
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--space-4)" }}>
          {seasonalAnime.slice(0, 36).map((anime) => {
            const title = getAnimeTitle(anime, "english");
            return (
              <Link key={anime.id} href={`/anime/${anime.slug}`} className="anime-tile" style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: "var(--space-3)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "var(--space-3)", color: "var(--text)" }}>
                <span style={{ position: "relative", width: 70, aspectRatio: "3/4", borderRadius: "var(--radius-sm)", overflow: "hidden", background: anime.dominant_color ?? "var(--misty-sage)" }}>
                  {anime.cover_image && <Image src={anime.cover_image} alt={`${title} cover art`} fill sizes="70px" className="object-cover" />}
                </span>
                <span style={{ minWidth: 0 }}>
                  <strong className="line-clamp-2" style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "var(--text-base)", lineHeight: 1.2 }}>
                    {title}
                  </strong>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", marginTop: 8 }}>
                    <Clock size={13} />
                    {formatEpisodes(anime.episodes)}
                  </span>
                  <span style={{ display: "block", color: "var(--bloodstone)", fontFamily: "var(--font-data)", fontSize: "var(--text-xs)", fontWeight: 800, marginTop: 8 }}>
                    {formatScore(anime.anilist_score)}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
