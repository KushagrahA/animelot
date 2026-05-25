// Supabase Database type definitions
// After setting up your Supabase project, replace this with the generated output from:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      anime: {
        Row: {
          id: string;
          anilist_id: number;
          slug: string;
          title_romaji: string;
          title_english: string | null;
          title_native: string | null;
          synopsis: string | null;
          cover_image: string | null;
          banner_image: string | null;
          dominant_color: string | null;
          format: "TV" | "TV_SHORT" | "MOVIE" | "SPECIAL" | "OVA" | "ONA" | "MUSIC" | null;
          status: "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS" | null;
          episodes: number | null;
          duration: number | null;
          season: "SPRING" | "SUMMER" | "FALL" | "WINTER" | null;
          season_year: number | null;
          genres: string[];
          studios: string[];
          source: string | null;
          anilist_score: number | null;
          animelot_score: number | null;
          popularity: number;
          trailer_url: string | null;
          external_links: Json;
          next_airing_ep: number | null;
          next_airing_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["anime"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["anime"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          location: string | null;
          website: string | null;
          accent_color: string;
          theme: "paper" | "night-ink";
          title_pref: "english" | "romaji" | "native";
          is_verified: boolean;
          is_moderator: boolean;
          follower_count: number;
          following_count: number;
          anime_count: number;
          joined_at: string;
          last_active: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "follower_count" | "following_count" | "anime_count" | "joined_at" | "last_active">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      ratings: {
        Row: {
          id: string;
          user_id: string;
          anime_id: string;
          score: number | null;
          review: string | null;
          review_headline: string | null;
          contains_spoilers: boolean;
          episode_scope: number | null;
          helpful_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ratings"]["Row"], "id" | "helpful_count" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["ratings"]["Insert"]>;
        Relationships: [];
      };
      watch_status: {
        Row: {
          id: string;
          user_id: string;
          anime_id: string;
          status: "watching" | "completed" | "dropped" | "plan_to_watch" | "on_hold";
          progress: number;
          rewatches: number;
          notes: string | null;
          started_at: string | null;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["watch_status"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["watch_status"]["Insert"]>;
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          parent_type: "anime" | "rating" | "list" | "article" | "episode";
          parent_id: string;
          body: string;
          is_spoiler: boolean;
          reply_to: string | null;
          like_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["comments"]["Row"], "id" | "like_count" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>;
        Relationships: [];
      };
      community_posts: {
        Row: {
          id: string;
          user_id: string;
          anime_id: string | null;
          title: string;
          slug: string;
          body: string;
          flair: "general" | "recommendations" | "episode-talk" | "hot-takes" | "fan-theory" | "help";
          is_spoiler: boolean;
          score_count: number;
          comment_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["community_posts"]["Row"], "id" | "score_count" | "comment_count" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["community_posts"]["Insert"]>;
        Relationships: [];
      };
      community_post_votes: {
        Row: {
          user_id: string;
          post_id: string;
          vote: -1 | 1;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["community_post_votes"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["community_post_votes"]["Insert"]>;
        Relationships: [];
      };
      match_votes: {
        Row: {
          id: string;
          mode: "worlds" | "date";
          matchup_id: string;
          choice_id: string;
          voter_key: string;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["match_votes"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["match_votes"]["Insert"]>;
        Relationships: [];
      };
      user_lists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          cover_image: string | null;
          is_public: boolean;
          is_ranked: boolean;
          entry_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_lists"]["Row"], "id" | "entry_count" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["user_lists"]["Insert"]>;
        Relationships: [];
      };
      vibe_tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
          color: string;
        };
        Insert: Omit<Database["public"]["Tables"]["vibe_tags"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["vibe_tags"]["Insert"]>;
        Relationships: [];
      };
      articles: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          body: string | null;
          cover_image: string | null;
          author_id: string | null;
          category: "seasonal" | "review" | "guide" | "news" | "general";
          is_featured: boolean;
          view_count: number;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["articles"]["Row"], "id" | "view_count" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["articles"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      watch_status_enum: "watching" | "completed" | "dropped" | "plan_to_watch" | "on_hold";
      anime_format: "TV" | "TV_SHORT" | "MOVIE" | "SPECIAL" | "OVA" | "ONA" | "MUSIC";
      anime_status: "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";
      anime_season: "SPRING" | "SUMMER" | "FALL" | "WINTER";
    };
  };
};

// ── Convenience row types ──────────────────────────────────
export type AnimeRow = Database["public"]["Tables"]["anime"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type RatingRow = Database["public"]["Tables"]["ratings"]["Row"];
export type WatchStatusRow = Database["public"]["Tables"]["watch_status"]["Row"];
export type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
export type CommunityPostRow = Database["public"]["Tables"]["community_posts"]["Row"];
export type CommunityPostVoteRow = Database["public"]["Tables"]["community_post_votes"]["Row"];
export type MatchVoteRow = Database["public"]["Tables"]["match_votes"]["Row"];
export type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
export type VibeTagRow = Database["public"]["Tables"]["vibe_tags"]["Row"];

// ── Enriched types (joined queries) ───────────────────────
export type AnimeWithRating = AnimeRow & {
  ratings: Pick<RatingRow, "score">[];
  _count?: { ratings: number };
};

export type RatingWithUser = RatingRow & {
  profiles: Pick<ProfileRow, "username" | "display_name" | "avatar_url" | "is_verified">;
};

export type CommentWithUser = CommentRow & {
  profiles: Pick<ProfileRow, "username" | "display_name" | "avatar_url" | "is_verified">;
};

export type CommunityPostWithUser = CommunityPostRow & {
  profiles: Pick<ProfileRow, "username" | "display_name" | "avatar_url" | "is_verified">;
  anime?: Pick<AnimeRow, "slug" | "title_english" | "title_romaji" | "cover_image"> | null;
};

export type RatingWithAnime = RatingRow & {
  anime: Pick<AnimeRow, "slug" | "title_english" | "title_romaji" | "cover_image">;
};
