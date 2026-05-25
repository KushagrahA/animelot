-- ============================================================
-- ANIMELOT — FULL DATABASE SCHEMA
-- Run this in Supabase SQL Editor (production project)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for full-text search on anime titles

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE watch_status_enum AS ENUM (
  'watching', 'completed', 'dropped', 'plan_to_watch', 'on_hold'
);

CREATE TYPE anime_format AS ENUM (
  'TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC'
);

CREATE TYPE anime_status AS ENUM (
  'FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS'
);

CREATE TYPE anime_season AS ENUM (
  'SPRING', 'SUMMER', 'FALL', 'WINTER'
);

CREATE TYPE activity_type AS ENUM (
  'rated', 'reviewed', 'list_add', 'status_change', 'followed',
  'battle_vote', 'vibe_tag_vote', 'article_comment'
);

CREATE TYPE comment_parent AS ENUM (
  'anime', 'rating', 'list', 'article', 'episode'
);

-- ============================================================
-- ANIME (seeded from AniList, curated by team)
-- ============================================================
CREATE TABLE anime (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anilist_id      INT UNIQUE NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  title_romaji    TEXT NOT NULL,
  title_english   TEXT,
  title_native    TEXT,
  synopsis        TEXT,
  cover_image     TEXT,
  banner_image    TEXT,
  dominant_color  TEXT,
  format          anime_format,
  status          anime_status,
  episodes        INT,
  duration        INT,
  season          anime_season,
  season_year     INT,
  genres          TEXT[] DEFAULT '{}',
  studios         TEXT[] DEFAULT '{}',
  source          TEXT,
  anilist_score   DECIMAL(4,1),
  animelot_score  DECIMAL(4,2),   -- computed from ratings table
  popularity      INT DEFAULT 0,
  trailer_url     TEXT,
  external_links  JSONB DEFAULT '{}',
  next_airing_ep  INT,
  next_airing_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_anime_slug        ON anime(slug);
CREATE INDEX idx_anime_genres      ON anime USING gin(genres);
CREATE INDEX idx_anime_season      ON anime(season_year, season);
CREATE INDEX idx_anime_status      ON anime(status);
CREATE INDEX idx_anime_format      ON anime(format);
CREATE INDEX idx_anime_score       ON anime(animelot_score DESC NULLS LAST);
CREATE INDEX idx_anime_popularity  ON anime(popularity DESC);
CREATE INDEX idx_anime_title_trgm  ON anime USING gin(title_romaji gin_trgm_ops);
CREATE INDEX idx_anime_title_en    ON anime USING gin(title_english gin_trgm_ops);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL CHECK (length(username) BETWEEN 3 AND 20 AND username ~ '^[a-zA-Z0-9_]+$'),
  display_name    TEXT CHECK (length(display_name) <= 50),
  avatar_url      TEXT,
  bio             TEXT CHECK (length(bio) <= 300),
  location        TEXT CHECK (length(location) <= 60),
  website         TEXT,
  accent_color    TEXT DEFAULT '#5D0D18',
  theme           TEXT DEFAULT 'paper' CHECK (theme IN ('paper', 'night-ink')),
  title_pref      TEXT DEFAULT 'english' CHECK (title_pref IN ('english', 'romaji', 'native')),
  is_verified     BOOL DEFAULT false,
  is_moderator    BOOL DEFAULT false,
  follower_count  INT DEFAULT 0,
  following_count INT DEFAULT 0,
  anime_count     INT DEFAULT 0,
  joined_at       TIMESTAMPTZ DEFAULT now(),
  last_active     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_username ON profiles(username);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_username TEXT;
  candidate_username TEXT;
  suffix TEXT;
  profile_display_name TEXT;
BEGIN
  profile_display_name := NULLIF(
    BTRIM(
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(COALESCE(NEW.email, ''), '@', 1),
        'Animelot User'
      )
    ),
    ''
  );

  base_username := LOWER(
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'preferred_username', ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      profile_display_name,
      'user'
    )
  );
  base_username := regexp_replace(base_username, '[^a-z0-9_]+', '_', 'g');
  base_username := regexp_replace(base_username, '^_+|_+$', '', 'g');
  base_username := LEFT(base_username, 15);

  IF length(base_username) < 3 THEN
    base_username := 'user';
  END IF;

  LOOP
    suffix := substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
    candidate_username := LEFT(base_username, 13) || '_' || suffix;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE username = candidate_username
    );
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    candidate_username,
    LEFT(COALESCE(profile_display_name, 'Animelot User'), 50),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- RATINGS & REVIEWS
-- ============================================================
CREATE TABLE ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  anime_id          UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  score             DECIMAL(3,1) CHECK (score >= 0.5 AND score <= 10.0),
  review            TEXT CHECK (length(review) <= 10000),
  review_headline   TEXT CHECK (length(review_headline) <= 120),
  contains_spoilers BOOL DEFAULT false,
  episode_scope     INT,
  helpful_count     INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, anime_id)
);

CREATE INDEX idx_ratings_anime    ON ratings(anime_id, created_at DESC);
CREATE INDEX idx_ratings_user     ON ratings(user_id, created_at DESC);
CREATE INDEX idx_ratings_score    ON ratings(anime_id, score);

CREATE TABLE rating_helpful (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating_id  UUID REFERENCES ratings(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, rating_id)
);

-- Trigger: update animelot_score on anime when rating changes
CREATE OR REPLACE FUNCTION update_anime_score()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  target_anime UUID;
  rating_count INT;
  rating_avg NUMERIC;
  prior_mean NUMERIC := 7.0;
  prior_weight NUMERIC := 8.0;
BEGIN
  target_anime := COALESCE(NEW.anime_id, OLD.anime_id);

  SELECT COUNT(score)::INT, AVG(score)::NUMERIC
    INTO rating_count, rating_avg
  FROM ratings
  WHERE anime_id = target_anime
    AND score IS NOT NULL;

  UPDATE anime
  SET animelot_score = CASE
        WHEN rating_count = 0 THEN NULL
        ELSE ROUND(((rating_avg * rating_count) + (prior_mean * prior_weight)) / (rating_count + prior_weight), 2)
      END,
      updated_at = now()
  WHERE id = target_anime;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_rating_change
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_anime_score();

-- ============================================================
-- WATCH STATUS
-- ============================================================
CREATE TABLE watch_status (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  anime_id     UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  status       watch_status_enum NOT NULL,
  progress     INT DEFAULT 0 CHECK (progress >= 0),
  rewatches    INT DEFAULT 0,
  notes        TEXT CHECK (length(notes) <= 500),
  started_at   DATE,
  completed_at DATE,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, anime_id)
);

CREATE INDEX idx_watch_user   ON watch_status(user_id, status);
CREATE INDEX idx_watch_anime  ON watch_status(anime_id);

-- ============================================================
-- LISTS
-- ============================================================
CREATE TABLE user_lists (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  description  TEXT CHECK (length(description) <= 500),
  cover_image  TEXT,
  is_public    BOOL DEFAULT true,
  is_ranked    BOOL DEFAULT false,
  entry_count  INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lists_user ON user_lists(user_id, created_at DESC);

CREATE TABLE list_entries (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id   UUID NOT NULL REFERENCES user_lists(id) ON DELETE CASCADE,
  anime_id  UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  position  INT,
  notes     TEXT CHECK (length(notes) <= 300),
  added_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(list_id, anime_id)
);

CREATE INDEX idx_list_entries ON list_entries(list_id, position);

-- ============================================================
-- SOCIAL GRAPH
-- ============================================================
CREATE TABLE follows (
  follower_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower  ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- Trigger: maintain follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE profiles SET follower_count  = follower_count  + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    UPDATE profiles SET follower_count  = follower_count  - 1 WHERE id = OLD.following_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- ============================================================
-- ACTIVITY FEED
-- ============================================================
CREATE TABLE activity (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         activity_type NOT NULL,
  anime_id     UUID REFERENCES anime(id) ON DELETE CASCADE,
  rating_id    UUID REFERENCES ratings(id) ON DELETE SET NULL,
  list_id      UUID REFERENCES user_lists(id) ON DELETE SET NULL,
  target_user  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_user    ON activity(user_id, created_at DESC);
CREATE INDEX idx_activity_recent  ON activity(created_at DESC);

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_type  comment_parent NOT NULL,
  parent_id    UUID NOT NULL,
  body         TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  is_spoiler   BOOL DEFAULT false,
  reply_to     UUID REFERENCES comments(id) ON DELETE SET NULL,
  like_count   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_comments_parent ON comments(parent_type, parent_id, created_at);
CREATE INDEX idx_comments_user   ON comments(user_id, created_at DESC);

-- ============================================================
-- COMMUNITY POSTS (Reddit-style anime threads)
-- Replies use comments(parent_type='article', parent_id=community_posts.id)
-- ============================================================
CREATE TABLE community_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  anime_id      UUID REFERENCES anime(id) ON DELETE SET NULL,
  title         TEXT NOT NULL CHECK (length(title) BETWEEN 4 AND 160),
  slug          TEXT UNIQUE NOT NULL CHECK (length(slug) BETWEEN 6 AND 220),
  body          TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 8000),
  flair         TEXT DEFAULT 'general' CHECK (flair IN ('general', 'recommendations', 'episode-talk', 'hot-takes', 'fan-theory', 'help')),
  is_spoiler    BOOL DEFAULT false,
  score_count   INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE community_post_votes (
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  vote       SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_community_posts_recent ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_flair  ON community_posts(flair, created_at DESC);
CREATE INDEX idx_community_posts_score  ON community_posts(score_count DESC, created_at DESC);
CREATE INDEX idx_community_posts_anime  ON community_posts(anime_id, created_at DESC);
CREATE INDEX idx_community_votes_post   ON community_post_votes(post_id);

CREATE OR REPLACE FUNCTION set_community_post_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION refresh_community_post_score()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE community_posts
  SET score_count = COALESCE((SELECT SUM(vote)::INT FROM community_post_votes WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)), 0)
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION refresh_community_post_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF COALESCE(NEW.parent_type, OLD.parent_type) = 'article' THEN
    UPDATE community_posts
    SET comment_count = (
      SELECT COUNT(*)::INT
      FROM comments
      WHERE parent_type = 'article'
        AND parent_id = COALESCE(NEW.parent_id, OLD.parent_id)
    )
    WHERE id = COALESCE(NEW.parent_id, OLD.parent_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER set_community_post_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION set_community_post_updated_at();

CREATE TRIGGER refresh_community_post_score
  AFTER INSERT OR UPDATE OR DELETE ON community_post_votes
  FOR EACH ROW EXECUTE FUNCTION refresh_community_post_score();

CREATE TRIGGER refresh_community_post_comment_count
  AFTER INSERT OR UPDATE OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION refresh_community_post_comment_count();

-- ============================================================
-- VIBE TAGS
-- ============================================================
CREATE TABLE vibe_tags (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT UNIQUE NOT NULL CHECK (length(name) <= 50),
  slug  TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#9FB2AC'
);

CREATE TABLE anime_vibe_tags (
  anime_id      UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  vibe_tag_id   UUID NOT NULL REFERENCES vibe_tags(id) ON DELETE CASCADE,
  vote_count    INT DEFAULT 1,
  PRIMARY KEY (anime_id, vibe_tag_id)
);

CREATE TABLE vibe_tag_votes (
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  anime_id     UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  vibe_tag_id  UUID NOT NULL REFERENCES vibe_tags(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, anime_id, vibe_tag_id)
);

-- ============================================================
-- TIER-LIST BATTLES
-- ============================================================
CREATE TABLE battles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL CHECK (length(title) <= 200),
  description TEXT,
  type        TEXT DEFAULT 'character' CHECK (type IN ('character', 'anime', 'opening', 'studio')),
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'upcoming')),
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ends_at     TIMESTAMPTZ,
  total_votes INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE battle_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id   UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  image_url   TEXT,
  anime_id    UUID REFERENCES anime(id) ON DELETE SET NULL,
  vote_count  INT DEFAULT 0,
  "rank"      INT
);

CREATE INDEX idx_battle_entries ON battle_entries(battle_id, vote_count DESC);

CREATE TABLE battle_votes (
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  battle_id  UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  entry_id   UUID NOT NULL REFERENCES battle_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, battle_id)
);

CREATE TABLE match_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode       TEXT NOT NULL CHECK (mode IN ('worlds', 'date')),
  matchup_id TEXT NOT NULL CHECK (length(matchup_id) BETWEEN 3 AND 180),
  choice_id  TEXT NOT NULL CHECK (length(choice_id) BETWEEN 2 AND 180),
  voter_key  TEXT NOT NULL CHECK (length(voter_key) BETWEEN 16 AND 160),
  user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mode, matchup_id, voter_key)
);

CREATE INDEX idx_match_votes_matchup ON match_votes(mode, matchup_id, choice_id);
CREATE INDEX idx_match_votes_user ON match_votes(user_id, created_at DESC);

-- ============================================================
-- WRAPPED SNAPSHOTS
-- ============================================================
CREATE TABLE wrapped_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year            INT NOT NULL,
  total_episodes  INT DEFAULT 0,
  total_hours     DECIMAL(8,1) DEFAULT 0,
  total_anime     INT DEFAULT 0,
  avg_score       DECIMAL(3,1),
  top_genres      TEXT[] DEFAULT '{}',
  top_studio      TEXT,
  taste_twin_id   UUID REFERENCES profiles(id),
  taste_twin_pct  DECIMAL(4,1),
  data            JSONB DEFAULT '{}',
  generated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, year)
);

-- ============================================================
-- EDITORIAL ARTICLES
-- ============================================================
CREATE TABLE articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  excerpt      TEXT CHECK (length(excerpt) <= 300),
  body         TEXT,
  cover_image  TEXT,
  author_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category     TEXT DEFAULT 'general' CHECK (category IN ('seasonal', 'review', 'guide', 'news', 'general')),
  is_featured  BOOL DEFAULT false,
  view_count   INT DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_articles_published ON articles(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_articles_category  ON articles(category, published_at DESC);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,   -- 'new_follower' | 'comment_reply' | 'review_helpful' | 'battle_result'
  actor_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  entity_type  TEXT,
  entity_id    UUID,
  message      TEXT,
  is_read      BOOL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Anime: public read only
ALTER TABLE anime ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anime_public_read" ON anime FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anime_service_write" ON anime FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Profiles: public read, own write
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read"  ON profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "profiles_own_update"   ON profiles FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Ratings: public read, own write
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings_public_read"   ON ratings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ratings_own_insert"    ON ratings FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "ratings_own_update"    ON ratings FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "ratings_own_delete"    ON ratings FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

ALTER TABLE rating_helpful ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rating_helpful_own_read" ON rating_helpful FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "rating_helpful_own_insert" ON rating_helpful FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "rating_helpful_own_delete" ON rating_helpful FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- Watch status: authenticated read own, public read list
ALTER TABLE watch_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watch_public_read"  ON watch_status FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "watch_own_insert"   ON watch_status FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "watch_own_update"   ON watch_status FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "watch_own_delete"   ON watch_status FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- Lists: public lists readable by all, private only by owner
ALTER TABLE user_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lists_public_read"  ON user_lists FOR SELECT TO anon, authenticated
  USING (is_public = true OR (select auth.uid()) = user_id);
CREATE POLICY "lists_own_insert"   ON user_lists FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "lists_own_update"   ON user_lists FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "lists_own_delete"   ON user_lists FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

ALTER TABLE list_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entries_read"   ON list_entries FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM user_lists WHERE id = list_id AND (is_public = true OR user_id = (select auth.uid())))
);
CREATE POLICY "entries_insert" ON list_entries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_lists WHERE id = list_id AND user_id = (select auth.uid())));
CREATE POLICY "entries_update" ON list_entries FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_lists WHERE id = list_id AND user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM user_lists WHERE id = list_id AND user_id = (select auth.uid())));
CREATE POLICY "entries_delete" ON list_entries FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_lists WHERE id = list_id AND user_id = (select auth.uid())));

-- Follows: public read, auth write
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_public_read"  ON follows FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "follows_own_insert"   ON follows FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = follower_id);
CREATE POLICY "follows_own_delete"   ON follows FOR DELETE TO authenticated
  USING ((select auth.uid()) = follower_id);

-- Activity: public read
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_public_read"  ON activity FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "activity_own_insert"   ON activity FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Comments: public read, auth write
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_public_read" ON comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "comments_own_insert"  ON comments FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "comments_own_update"  ON comments FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "comments_own_delete"  ON comments FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- Community posts: public read, owner write, authenticated voting
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_posts_public_read" ON community_posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "community_posts_own_insert" ON community_posts FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "community_posts_own_update" ON community_posts FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "community_posts_own_delete" ON community_posts FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_votes_own_read" ON community_post_votes FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "community_votes_own_insert" ON community_post_votes FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "community_votes_own_update" ON community_post_votes FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "community_votes_own_delete" ON community_post_votes FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

GRANT SELECT ON community_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON community_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON community_post_votes TO authenticated;

-- Vibe tags: public read, auth write votes
ALTER TABLE vibe_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vibe_tags_public_read" ON vibe_tags FOR SELECT TO anon, authenticated USING (true);
ALTER TABLE anime_vibe_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anime_vibe_public_read" ON anime_vibe_tags FOR SELECT TO anon, authenticated USING (true);
ALTER TABLE vibe_tag_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vibe_votes_own_read"   ON vibe_tag_votes FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "vibe_votes_own_write"  ON vibe_tag_votes FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "vibe_votes_own_delete" ON vibe_tag_votes FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- Battles: public read, auth vote
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "battles_public_read" ON battles FOR SELECT TO anon, authenticated USING (true);
ALTER TABLE battle_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "battle_entries_public_read" ON battle_entries FOR SELECT TO anon, authenticated USING (true);
ALTER TABLE battle_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "battle_votes_own"    ON battle_votes FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "battle_votes_insert" ON battle_votes FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

ALTER TABLE match_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "match_votes_public_read" ON match_votes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "match_votes_public_insert" ON match_votes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "match_votes_public_update" ON match_votes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON match_votes TO anon, authenticated;

-- Notifications: own only
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_own_read"   ON notifications FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "notif_own_update" ON notifications FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Articles: public read
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "articles_public_read" ON articles FOR SELECT TO anon, authenticated
  USING (published_at IS NOT NULL AND published_at <= now());
CREATE POLICY "articles_service_write" ON articles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Wrapped snapshots: own only
ALTER TABLE wrapped_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wrapped_own_read" ON wrapped_snapshots FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "wrapped_own_insert" ON wrapped_snapshots FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "wrapped_own_update" ON wrapped_snapshots FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "wrapped_own_delete" ON wrapped_snapshots FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- SEED: Initial Vibe Tags
-- ============================================================
INSERT INTO vibe_tags (name, slug, color) VALUES
  ('Sunday Morning Watch',   'sunday-morning-watch',    '#9FB2AC'),
  ('Unhinged',               'unhinged',                '#5D0D18'),
  ('Cry on the Train',       'cry-on-the-train',        '#6A8880'),
  ('Binge Destroyer',        'binge-destroyer',         '#5D0D18'),
  ('Background Noise',       'background-noise',        '#C9D6D1'),
  ('Emotional Damage',       'emotional-damage',        '#5D0D18'),
  ('Slow Burn',              'slow-burn',               '#9FB2AC'),
  ('Peak Fiction',           'peak-fiction',            '#201C18'),
  ('Comfort Rewatch',        'comfort-rewatch',         '#9FB2AC'),
  ('Philosophical Headache', 'philosophical-headache',  '#6A8880'),
  ('Watch With Friends',     'watch-with-friends',      '#9FB2AC'),
  ('Don''t Look Up Spoilers','dont-look-up-spoilers',   '#5D0D18'),
  ('Underrated Gem',         'underrated-gem',          '#6A8880'),
  ('Needs 2 Episodes',       'needs-2-episodes',        '#9FB2AC'),
  ('Overrated But OK',       'overrated-but-ok',        '#C9D6D1');
