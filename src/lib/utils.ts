import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a URL-safe slug from a string.
 * "Attack on Titan" → "attack-on-titan"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Pick preferred title from an anime row based on user preference.
 */
export function getAnimeTitle(
  anime: { title_english: string | null; title_romaji: string; title_native: string | null },
  pref: "english" | "romaji" | "native" = "english"
): string {
  if (pref === "english") return anime.title_english || anime.title_romaji;
  if (pref === "native") return anime.title_native || anime.title_romaji;
  return anime.title_romaji;
}

/**
 * Format a score number for display.
 * 9.5 → "9.5", 10 → "10"
 */
export function formatScore(score: number | null | undefined): string {
  if (score == null) return "—";
  return score % 1 === 0 ? score.toFixed(0) : score.toFixed(1);
}

/**
 * Format episode count.
 */
export function formatEpisodes(episodes: number | null): string {
  if (!episodes) return "? eps";
  return episodes === 1 ? "1 ep" : `${episodes} eps`;
}

/**
 * Format duration in minutes to human-readable.
 * 24 → "24 min", 90 → "1h 30m"
 */
export function formatDuration(minutes: number | null): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Format hours watched from total episodes × avg duration.
 */
export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 100) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours)}h`;
}

/**
 * Format a date relative to now.
 * "2 hours ago", "3 days ago", etc.
 */
export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return d.getFullYear().toString();
}

/**
 * Format a calendar date.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Truncate text to a given length with ellipsis.
 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

/**
 * Get the season label from a season enum.
 */
export function formatSeason(season: string | null, year: number | null): string {
  if (!season || !year) return "—";
  const labels: Record<string, string> = {
    SPRING: "Spring",
    SUMMER: "Summer",
    FALL: "Fall",
    WINTER: "Winter",
  };
  return `${labels[season] || season} ${year}`;
}

/**
 * Deterministic rotation for HankoStamp based on anime ID.
 * Always returns the same value for the same ID.
 */
export function deterministicRotation(id: string): number {
  const options = [-3, -1.5, 0.5, 2, -2.5];
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return options[hash % options.length];
}

/**
 * Convert a hex color to RGBA.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
