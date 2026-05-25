import type { CommentWithUser, CommunityPostWithUser, ProfileRow, RatingWithUser } from "@/lib/supabase/types";

type DisplayProfile =
  | Pick<ProfileRow, "username" | "display_name" | "avatar_url" | "is_verified">
  | RatingWithUser["profiles"]
  | CommentWithUser["profiles"]
  | CommunityPostWithUser["profiles"];

export const communityFlairs = [
  { value: "general", label: "General" },
  { value: "recommendations", label: "Recommendations" },
  { value: "episode-talk", label: "Episode Talk" },
  { value: "hot-takes", label: "Hot Takes" },
  { value: "fan-theory", label: "Fan Theory" },
  { value: "help", label: "Help Me Find" },
] as const;

export type CommunityFlair = (typeof communityFlairs)[number]["value"];

export function displayUser(profile: DisplayProfile) {
  return profile.display_name || profile.username || "Animelot user";
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "A"
  );
}

export function relativeDate(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function slugifyPostTitle(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 130);

  return base || "community-post";
}

