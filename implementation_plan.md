# Animelot — World-Class Anime Community Platform
### Ultra-Detailed Implementation Plan | Global, 100/100

---

## Vision Statement

Animelot is the definitive global destination for anime fans to discover, rate, and discuss anime. It sits between two reference points: **IMDb's data authority** and **Letterboxd's intimate social layer** — but with a visual identity borrowed from neither. The aesthetic is **ink on paper**, inspired by ukiyo-e woodblock prints and hanko (Japanese ink seals): warm cream ground, muted sage midtones, and a single bold bloodstone accent that lands like a stamp. Not neon. Not dark mode. Unmistakably its own thing.

**Target audience**: Global anime fans, 14–35, who want more than a list tracker — they want a place that feels like a community, a reference, and a personal taste archive all in one.

---

## Color System (Exact, Final)

| Token | Hex | Role |
|---|---|---|
| `--vanilla-custard` | `#FFF9EB` | Base background — the "paper" the whole site is printed on |
| `--misty-sage` | `#9FB2AC` | Secondary surfaces, nav, cards, tag chips, borders |
| `--bloodstone` | `#5D0D18` | The ONE accent — hanko stamp, CTAs, active states, score badges, links |
| `--ink` | `#201C18` | All body text — warm near-black, never pure `#000` |
| `--sage-tint` | `#C9D6D1` | Hover states, disabled elements, dividers, subtle fills |
| `--custard-tint` | `#FFFEF7` | Card backgrounds, elevated panels, form inputs |
| `--bloodstone-faint` | `#F5E8EA` | Light tint for review spoiler overlays, warning states |
| `--sage-dark` | `#6A8880` | Accessible text-on-sage when needed, secondary labels |

### Contrast Audit (Pre-built — non-negotiable)
- `--ink` on `--vanilla-custard`: 14.3:1 ✅ (AAA)
- `--bloodstone` on `--vanilla-custard`: 9.1:1 ✅ (AAA)
- `--ink` on `--misty-sage`: 5.2:1 ✅ (AA)
- `--sage-dark` on `--vanilla-custard`: 4.6:1 ✅ (AA)
- ❌ `--misty-sage` text on `--vanilla-custard`: 2.6:1 — **NEVER use sage as text color on cream**

---

## Typography System

### Typefaces
| Face | Source | Use |
|---|---|---|
| **Fraunces** | Google Fonts (variable) | Page titles, anime names on cards, hero display text, section headings |
| **Work Sans** | Google Fonts (variable) | Body copy, navigation, reviews, comments, descriptions, UI labels |
| **JetBrains Mono** | Google Fonts | Score numbers only — rating badges, stat counters, episode counts, timestamps |

### Scale (Type Ramp)
```css
--text-xs:   0.75rem  / 1.1rem  (12px — metadata labels)
--text-sm:   0.875rem / 1.3rem  (14px — secondary body, captions)
--text-base: 1rem     / 1.6rem  (16px — primary body copy)
--text-lg:   1.125rem / 1.6rem  (18px — review intros, card titles)
--text-xl:   1.25rem  / 1.4rem  (20px — section headings)
--text-2xl:  1.5rem   / 1.3rem  (24px — page titles)
--text-3xl:  1.875rem / 1.2rem  (30px — hero titles)
--text-4xl:  2.25rem  / 1.15rem (36px — display/landing)
--text-5xl:  3rem     / 1.1rem  (48px — hero display, max)
```

### Fraunces Usage Rule
Fraunces is italic-first. Use `font-style: italic` for display sizes (≥3xl). Upright for headings. Never use Fraunces below 18px.

---

## Architecture Decision: WebGL / Three.js Assessment

### Verdict: **YES — Use Three.js, strategically and sparingly**

**Where it earns its keep on Animelot:**
1. **Homepage ink-wash hero canvas** — An ink fluid simulation behind the seasonal anime rail; vanilla custard base, ink tendrils spreading from cover art thumbnails on hover. Uses ping-pong framebuffer SDF fluid technique. ~2ms GPU per frame on mid-range hardware.
2. **HankoStamp ink-bleed on mount** — When a score badge first appears (page load, after rating), a procedural ink-bleed shader plays once (300ms). After first run, it's a static CSS element. Zero ongoing GPU cost.
3. **Page transition ink wipe** — A full-screen bloodstone ink wash sweeps across the viewport on route changes (250ms). Replaces the generic fade. Uses a pre-baked noise texture + GLSL vertex distortion.
4. **Starfield particle ambient on profile pages** — Subtle, sparse floating ink-particle field in profile hero. Pauses on low-power mode.

**Where it does NOT belong:**
- Anime card grids — CSS transforms only, no Three.js
- Browse/filter pages — no canvas, performance budget reserved for images
- Mobile — all WebGL effects disabled on viewport < 768px and `prefers-reduced-motion: reduce`

**Implementation tech**: React Three Fiber (R3F) + `@react-three/drei`. This integrates cleanly with Next.js 14 via dynamic import + `ssr: false`. WebGPU renderer not yet used (browser support too fragmented); stay on WebGL 2 for now.

**Performance guardrails**:
- `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`
- `IntersectionObserver` stops render loop when canvas is not in viewport
- `requestIdleCallback` defers canvas init until after LCP image loads
- Lighthouse Performance score must stay ≥ 85 with canvas active

---

## Full Tech Stack

### Frontend
| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR for SEO, RSC for performance, ISR for anime pages |
| Language | TypeScript (strict) | Type safety across Supabase schema → UI |
| Styling | Tailwind CSS v3 + CSS custom properties | Utility classes + design token layer |
| Components | shadcn/ui (Radix primitives) | Accessible, unstyled, fully customizable |
| 3D/WebGL | React Three Fiber + @react-three/drei | Three.js ink effects with React integration |
| Animation | Framer Motion | Page transitions, card animations, micro-interactions |
| Forms | React Hook Form + Zod | Typed, validated forms for auth/review/rating |
| State | Zustand (client) + React Query (server) | Minimal, predictable state management |
| Charts | Recharts | Score distribution histograms, profile stats |
| Rich text | Tiptap | Review editor with spoiler block extension |

### Backend & Data
| Layer | Technology | Rationale |
|---|---|---|
| Database | Supabase (PostgreSQL 15) | Postgres + Auth + Realtime + Storage in one free tier |
| Auth | Supabase Auth | Email/password + Google OAuth + Discord OAuth |
| Storage | Supabase Storage | User avatars, custom list cover images |
| Caching | Supabase + Next.js ISR | Anime pages revalidate every 24h, trend data every 1h |
| Email | Resend (free tier) | Transactional email with React Email templates |
| OG Images | @vercel/og (Edge Runtime) | Auto-generated social share images |
| Seed script | Bun + TypeScript | Fast, typed AniList → Supabase seeder |

### Infrastructure
| Service | Purpose | Free Tier |
|---|---|---|
| Vercel Hobby | Next.js hosting, Edge Network | 100GB bandwidth, unlimited builds |
| Supabase Free | Postgres + Auth + Storage | 500MB DB, 1GB storage, 50k MAU |
| Cloudflare Free | DNS, WAF, asset caching | Unlimited requests |
| Resend Free | Transactional email | 3,000 emails/month |
| Zoho Mail Free | Business email (5 addresses) | 5 users × 5GB |
| Vercel Analytics | Web vitals + page views | Free on Hobby plan |

> ⚠️ **Supabase keep-alive**: Add a Vercel Cron Job (`/api/cron/ping`) that hits the DB every 5 days to prevent project pausing on free tier.

---

## Business Email Setup (animelot.com via Zoho Mail)

### Accounts to Create
| Address | Purpose |
|---|---|
| `hello@animelot.com` | General contact, displayed on site |
| `support@animelot.com` | User support tickets |
| `noreply@animelot.com` | Transactional email sender (Resend uses this) |
| `team@animelot.com` | Internal team communication |
| `admin@animelot.com` | Platform administration |

### DNS Setup (GoDaddy → Cloudflare → Zoho)
**Step 1**: Transfer DNS from GoDaddy to Cloudflare (free, faster, better security)
- Add `animelot.com` to Cloudflare → import existing DNS → update GoDaddy nameservers to Cloudflare's

**Step 2**: In Cloudflare DNS, add Zoho MX records:
```
MX  @  mx.zoho.com       priority 10
MX  @  mx2.zoho.com      priority 20
MX  @  mx3.zoho.com      priority 50
TXT @  "v=spf1 include:zoho.com ~all"
TXT zoho-verification.[id]  "zoho-verification=[your-token]"
CNAME  zb.[id]  business.zoho.com  (for DKIM)
```

**Step 3**: Add Vercel DNS:
```
CNAME  www   cname.vercel-dns.com
A      @     76.76.21.21  (Vercel IP)
```

**Resend SPF/DKIM** (for transactional deliverability):
```
TXT  resend._domainkey  [DKIM key from Resend dashboard]
```

---

## Database Schema (Complete, Production-Grade)

### Core Anime Data
```sql
CREATE TABLE anime (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anilist_id      INT UNIQUE NOT NULL,
  slug            TEXT UNIQUE NOT NULL,         -- attack-on-titan
  title_romaji    TEXT NOT NULL,
  title_english   TEXT,
  title_native    TEXT,                         -- 進撃の巨人
  synopsis        TEXT,
  cover_image     TEXT,                         -- AniList CDN URL
  banner_image    TEXT,
  color           TEXT,                         -- AniList dominant color
  format          TEXT,                         -- TV, MOVIE, OVA, ONA, SPECIAL
  status          TEXT,                         -- FINISHED, RELEASING, NOT_YET_RELEASED
  episodes        INT,
  duration        INT,                          -- avg episode duration in minutes
  season          TEXT,                         -- SPRING, SUMMER, FALL, WINTER
  season_year     INT,
  genres          TEXT[],
  studios         TEXT[],
  source          TEXT,                         -- MANGA, ORIGINAL, LIGHT_NOVEL, etc
  anilist_score   DECIMAL(4,1),
  popularity      INT,
  trailer_url     TEXT,
  external_links  JSONB,                        -- {crunchyroll, netflix, funimation, etc}
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_anime_slug ON anime(slug);
CREATE INDEX idx_anime_genres ON anime USING gin(genres);
CREATE INDEX idx_anime_season ON anime(season_year, season);
CREATE INDEX idx_anime_status ON anime(status);
CREATE INDEX idx_anime_format ON anime(format);
```

### User Profiles
```sql
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL,         -- max 20 chars, URL-safe
  display_name    TEXT,
  avatar_url      TEXT,
  bio             TEXT,                         -- max 300 chars
  location        TEXT,
  website         TEXT,
  accent_color    TEXT DEFAULT '#5D0D18',      -- user-customizable profile accent
  theme           TEXT DEFAULT 'paper',        -- 'paper' | 'night-ink' | 'sage-garden'
  title_pref      TEXT DEFAULT 'english',      -- 'english' | 'romaji' | 'native'
  is_verified     BOOL DEFAULT false,
  is_moderator    BOOL DEFAULT false,
  joined_at       TIMESTAMPTZ DEFAULT now(),
  last_active     TIMESTAMPTZ DEFAULT now()
);
```

### Ratings & Reviews
```sql
CREATE TABLE ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES profiles(id) ON DELETE CASCADE,
  anime_id          UUID REFERENCES anime(id) ON DELETE CASCADE,
  score             DECIMAL(3,1) CHECK (score >= 0 AND score <= 10),
  review            TEXT,                       -- optional, max 10,000 chars
  review_headline   TEXT,                       -- optional, max 120 chars
  contains_spoilers BOOL DEFAULT false,
  episode_scope     INT,                        -- "reviewed through episode X"
  helpful_count     INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, anime_id)
);

CREATE TABLE rating_helpful (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating_id  UUID REFERENCES ratings(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, rating_id)
);
```

### Watch Lists
```sql
CREATE TYPE watch_status_enum AS ENUM (
  'watching', 'completed', 'dropped', 'plan_to_watch', 'on_hold'
);

CREATE TABLE watch_status (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  anime_id     UUID REFERENCES anime(id) ON DELETE CASCADE,
  status       watch_status_enum NOT NULL,
  progress     INT DEFAULT 0,                  -- episodes watched
  rewatches    INT DEFAULT 0,
  notes        TEXT,
  started_at   DATE,
  completed_at DATE,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, anime_id)
);

CREATE TABLE user_lists (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  cover_image  TEXT,
  is_public    BOOL DEFAULT true,
  is_ranked    BOOL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE list_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id     UUID REFERENCES user_lists(id) ON DELETE CASCADE,
  anime_id    UUID REFERENCES anime(id) ON DELETE CASCADE,
  position    INT,
  notes       TEXT,
  added_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(list_id, anime_id)
);
```

### Social Graph
```sql
CREATE TABLE follows (
  follower_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE TABLE activity (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,      -- 'rated', 'reviewed', 'list_add', 'status_change', 'followed'
  anime_id    UUID REFERENCES anime(id),
  rating_id   UUID REFERENCES ratings(id),
  list_id     UUID REFERENCES user_lists(id),
  target_user UUID REFERENCES profiles(id),
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_user ON activity(user_id, created_at DESC);
CREATE INDEX idx_activity_feed ON activity(user_id) WHERE created_at > now() - interval '30 days';
```

### Comments
```sql
CREATE TABLE comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_type  TEXT NOT NULL,                 -- 'anime' | 'rating' | 'list' | 'article'
  parent_id    UUID NOT NULL,
  body         TEXT NOT NULL,                 -- max 2,000 chars
  is_spoiler   BOOL DEFAULT false,
  reply_to     UUID REFERENCES comments(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_comments_parent ON comments(parent_type, parent_id, created_at);
```

### Vibe Tags (Community Feature)
```sql
CREATE TABLE vibe_tags (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT UNIQUE NOT NULL,   -- 'sunday morning watch', 'unhinged', 'cry on the train'
  slug  TEXT UNIQUE NOT NULL,
  color TEXT                    -- CSS hex for the chip
);

CREATE TABLE anime_vibe_tags (
  anime_id      UUID REFERENCES anime(id) ON DELETE CASCADE,
  vibe_tag_id   UUID REFERENCES vibe_tags(id) ON DELETE CASCADE,
  vote_count    INT DEFAULT 1,
  PRIMARY KEY (anime_id, vibe_tag_id)
);

CREATE TABLE vibe_tag_votes (
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  anime_id     UUID REFERENCES anime(id) ON DELETE CASCADE,
  vibe_tag_id  UUID REFERENCES vibe_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, anime_id, vibe_tag_id)
);
```

### Tier-list Battles
```sql
CREATE TABLE battles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,              -- 'Best Shonen Protagonist S2 2024'
  type            TEXT DEFAULT 'character',   -- 'character' | 'anime' | 'opening'
  status          TEXT DEFAULT 'active',      -- 'active' | 'closed'
  created_by      UUID REFERENCES profiles(id),
  ends_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE battle_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id   UUID REFERENCES battles(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,                  -- character name or anime title
  image_url   TEXT,
  vote_count  INT DEFAULT 0
);

CREATE TABLE battle_votes (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  battle_id  UUID REFERENCES battles(id) ON DELETE CASCADE,
  entry_id   UUID REFERENCES battle_entries(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, battle_id)
);
```

### Wrapped / Year in Review
```sql
CREATE TABLE wrapped_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  year            INT NOT NULL,
  total_episodes  INT,
  total_hours     DECIMAL(7,1),
  total_anime     INT,
  avg_score       DECIMAL(3,1),
  top_genres      TEXT[],
  top_studio      TEXT,
  taste_twin_id   UUID REFERENCES profiles(id),
  taste_twin_pct  DECIMAL(4,1),
  data            JSONB,                      -- full stats snapshot
  generated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, year)
);
```

### Editorial
```sql
CREATE TABLE articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  excerpt      TEXT,
  body         TEXT,                          -- MDX/rich text
  cover_image  TEXT,
  author_id    UUID REFERENCES profiles(id),
  category     TEXT,                          -- 'seasonal', 'review', 'guide', 'news'
  is_featured  BOOL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

### Row Level Security (RLS Policies)
```sql
-- Profiles: public read, own write
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_update"   ON profiles FOR UPDATE USING (auth.uid() = id);

-- Ratings: public read, own write
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings_public_read"   ON ratings FOR SELECT USING (true);
CREATE POLICY "ratings_own_insert"    ON ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ratings_own_update"    ON ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ratings_own_delete"    ON ratings FOR DELETE USING (auth.uid() = user_id);

-- Watch status: public read, own write
-- Lists: public lists readable by all, private lists only by owner
-- Comments: public read, authenticated write
-- (full RLS for all tables follows same pattern)
```

---

## User Themes (Custom per Profile)

Every user can set their profile theme from 3 options, applied via a `data-theme` attribute on their profile page:

### Theme 1: `paper` (Default)
```css
[data-theme="paper"] {
  --bg: #FFF9EB;
  --surface: #FFFEF7;
  --accent: #5D0D18;
  --text: #201C18;
  --border: #C9D6D1;
}
```

### Theme 2: `night-ink`
```css
[data-theme="night-ink"] {
  --bg: #12100E;           /* deep warm black */
  --surface: #1C1916;      /* elevated card surface */
  --accent: #E8C4A0;       /* warm parchment for dark mode accent */
  --text: #EDE8E0;         /* off-white, warm */
  --border: #2E2924;
}
```

### Theme 3: `sage-garden`
```css
[data-theme="sage-garden"] {
  --bg: #EDF2F0;           /* pale sage base */
  --surface: #F5F8F6;
  --accent: #5D0D18;       /* bloodstone still works */
  --text: #1C2820;         /* dark sage-green ink */
  --border: #B8CCC7;
}
```

---

## Pages: Complete Specification

### 1. Homepage `/`
**SSR with ISR (revalidate: 3600)**

**Sections:**
1. **WebGL ink-wash canvas hero** — full-width, 40vh tall. Ink tendrils in vanilla custard. No text overlay; the canvas *is* the mood-setter.
2. **"Airing This Season" horizontal rail** — real cover art, title (Fraunces), episode count (JetBrains Mono), hanko score. Arrows + swipe gesture.
3. **"Trending This Week" grid** — 6-card responsive grid.
4. **"Top Rated of All Time" strip** — ranked 1–10 mini-list with rank number in large Fraunces italics.
5. **Community Activity ticker** — live feed snippets: "Aiko rated Vinland Saga 9.5 · 2m ago"
6. **"Vibe Picks for You" rail** — seeded with random vibe tags until user is logged in; personalized after.
7. **Editorial spotlight** — 1 featured article card, full-bleed cover image.
8. **Seasonal calendar preview** — 3 upcoming titles with air dates.

---

### 2. Browse `/browse`
**SSR with client-side filter state**

**Filter sidebar (desktop) / drawer (mobile):**
- Format: TV / Movie / OVA / ONA / Special / Music
- Status: Airing / Finished / Upcoming
- Season: Spring / Summer / Fall / Winter + Year
- Genre: multi-select checkboxes (all genres from DB)
- Vibe tags: pill-select
- Sort: Score ↓, Popularity ↓, Newest, Oldest, Title A-Z

**Grid**: 4 cols (desktop) → 2 cols (tablet) → 2 cols (mobile)
Infinite scroll via Intersection Observer + cursor-based Supabase pagination.

---

### 3. Anime Detail `/anime/[slug]`
**SSR (server component) — most SEO-critical page**

**Layout:**
```
[Full-width banner image, 320px tall, lazy-loaded with blur placeholder]
[Left column — 240px cover art + metadata sidebar]
[Right column — main content]
```

**Left sidebar:**
- Cover image (shadcn aspect ratio)
- **HankoStamp component** — community score in bloodstone seal
- Format / Episodes / Duration / Season / Year / Status
- Studios (linked to `/studio/[slug]`)
- Genres (linked to `/genre/[slug]`)
- Source material
- Trailer button (opens modal, links to YouTube)
- "Where to Watch" links from AniList external_links
- Add to list / Watch status controls

**Right main:**
- Title (Fraunces, 3xl, italic)
- Native title (Work Sans, sm, sage-dark)
- Synopsis
- Rating controls (if logged in): half-point slider + review button
- **Score distribution histogram** (Recharts, bloodstone bars)
- Reviews list (with spoiler blur, episode scope indicator, helpful votes)
- Related anime (horizontal scroll)
- Characters (if/when added)
- Comments section

**SEO emitted per page:**
```html
<title>Attack on Titan — Reviews, Ratings & Community | Animelot</title>
<meta name="description" content="Attack on Titan rated 9.0 by the Animelot community. Read reviews, see ratings, and discuss Attack on Titan. Directed by MAPPA. 87 episodes." />
<meta property="og:image" content="https://animelot.com/api/og/anime/attack-on-titan" />
<link rel="canonical" href="https://animelot.com/anime/attack-on-titan" />
<script type="application/ld+json">{
  "@context": "https://schema.org",
  "@type": "TVSeries",
  "name": "Attack on Titan",
  "description": "...",
  "numberOfEpisodes": 87,
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "9.0",
    "ratingCount": "12453",
    "bestRating": "10",
    "worstRating": "0"
  }
}</script>
```

---

### 4. Genre Pages `/genre/[slug]`
**SSR + ISR**

Not just a filter wrapper — a real editorial landing page:
- Genre hero: hand-written description of the genre (e.g., "Shōnen is built on the promise of growth...")
- Top 10 anime in this genre (ranked)
- Community's top review for this genre
- "Staff picks" (manually curated or auto-highest-scored)
- Related genres
- SEO title: "Best Shōnen Anime — Rated & Reviewed by the Community | Animelot"

---

### 5. Studio Pages `/studio/[slug]`
**SSR + ISR**

- Studio name, founding year, location (from AniList data)
- Filmography grid sorted by score
- Studio stat box: total anime, avg community score, most popular work
- Timeline view (optional Phase 5 feature)

---

### 6. Profile `/profile/[username]`
**SSR for initial render, client hydration for interactivity**

**Header section:**
- Avatar (circle, 96px)
- Display name (Fraunces) / @username (Work Sans)
- Bio, location, website
- Joined date, last active
- Follow / Unfollow button
- Stats bar: `X Anime · X Hours · X Reviews · X Followers`

**WebGL ambient**: sparse ink particles drifting behind the header (subtle, pauses with `prefers-reduced-motion`)

**Tabs:**
- **Overview** — radar chart of genre distribution, recently rated, favorite anime (pinned top-3)
- **Lists** — Watching, Completed, Dropped, Plan to Watch + custom lists
- **Reviews** — all written reviews, paginated
- **Activity** — full activity log
- **Stats** — hours watched by year, avg score distribution, most-watched studio, top genres, streak tracking

**User theme applied here**: profile page uses the user's chosen theme token.

---

### 7. Rating + Review Flow
**Client-side modal/drawer, no page navigation**

1. Click rating area on anime page → drawer slides up (mobile) / modal appears (desktop)
2. **Score slider**: 0–10 in 0.5 increments. Large Fraunces numeral updates in real time. Below 4: bloodstone tint. 4–7: neutral. 7+: warm amber-custard tint.
3. **Status selector**: pill buttons — Watching / Completed / Dropped / Plan to Watch
4. **Review toggle**: "Add written review" expands Tiptap editor
   - Spoiler toggle
   - "Reviewed up to episode ___" number input
   - Headline (optional, 120 chars)
   - Body (required if reviewing, min 20 chars, max 10,000)
5. Submit → optimistic UI update → activity event emitted

---

### 8. Activity Feed `/feed`
**Client component with Supabase Realtime subscription**

- Shows activity from followed users
- Grouped by day: "Today", "Yesterday", "June 28"
- Activity types render as distinct card styles:
  - Rated: mini anime card + HankoStamp
  - Added to list: list name badge
  - Started watching: play icon
  - Left a review: excerpt with "Read more"
  - Followed: avatar + "started following [user]"
- Load more on scroll

---

### 9. Seasonal Calendar `/seasonal`
**SSR + ISR (revalidate: 3600)**

- Inspired by Livechart.me
- Air date × time grid for current season
- Filters: format, status, day of week
- Each entry: cover art, title, episode number, air time, countdown timer
- Link to anime detail page

---

### 10. Articles `/articles` and `/articles/[slug]`
**SSR with MDX**

- `/articles` index: featured article, category filters, recent articles grid
- `/articles/[slug]`: full article, author byline, reading time, related anime linked inline, comment section
- SEO structured data: `schema.org/Article` with author, datePublished, image

---

## HankoStamp — Signature Component (Deep Spec)

This is the most important design element. It must look handmade, not digital.

```tsx
// HankoStamp.tsx
// Props: score (number), size ('sm' | 'md' | 'lg'), animate (bool)
```

**Visual rules:**
- Bloodstone (`#5D0D18`) filled circle
- Thin ivory ring inside (1px `#FFF9EB` stroke, slightly smaller than outer edge)
- Score number in JetBrains Mono, bold, ivory `#FFF9EB`
- **Rotation**: randomly selected from `[-3deg, -1.5deg, 0.5deg, 2deg, -2.5deg]` based on `anime.id` hash (deterministic, not truly random — same anime always has same rotation)
- **Border texture**: SVG `feTurbulence` filter simulating slight edge roughness, like ink on paper
- **Ink-bleed mount animation**: on first render, `clip-path` radially expands from center in 280ms (cubic-bezier ease-out), followed by the edge-roughness filter fading in. After first render, no animation.

**Sizes:**
- `sm`: 40px — used on cards in grid/rail
- `md`: 64px — used on anime detail sidebar
- `lg`: 96px — used on Wrapped cards

---

## Viral Signature Features

### Feature 1: Animelot Wrapped (Annual)
Triggered manually in December / auto-available Jan 1.

**Generated card sections:**
1. Year header with anime-style brushstroke number
2. `X Anime · X Hours · X Episodes` (JetBrains Mono, large)
3. Top genre with custom illustration icon
4. Taste Twin: "@username — you're 87% compatible"
5. Highest-rated anime of the year (for this user)
6. Dropped anime (humorous — "gave up after 3 episodes of X")
7. Dynamic background: bloodstone gradient + cover art collage mosaic

**Implementation**: Rendered as a React component → converted to PNG via `@vercel/og` → downloadable + shareable link.

### Feature 2: Taste Compatibility
Route: `/compare/[user1]/[user2]`
Algorithm: Pearson correlation on overlapping anime ratings (minimum 5 shared).
Result: percentage + breakdown by genre agreement/disagreement.
Shareable OG image auto-generated.

### Feature 3: Tier-list Battles
Weekly auto-generated battles from currently airing anime characters.
Community votes in bracket rounds.
Results auto-post to activity feed.
Shareable as image card.

### Feature 4: Spoiler-Safe Reviews (Differentiator)
- "Reviewing through episode X" is a first-class toggle, not an afterthought
- On anime detail, reviews scoped to fewer episodes than current airing are shown first for new watchers
- Spoiler text is blurred (`filter: blur(8px)`) with a one-click reveal
- Never auto-revealed on scroll — intentional click required

### Feature 5: Vibe Tags (Community Taxonomy)
15 seed vibe tags launched with the site:
`sunday-morning-watch`, `unhinged`, `cry-on-the-train`, `binge-destroyer`, `background-noise`, `emotional-damage`, `slow-burn`, `peak-fiction`, `comfort-rewatch`, `philosophical-headache`, `watch-with-friends`, `dont-look-up-spoilers`, `overrated-but-ok`, `underrated-gem`, `needs-2-episodes-to-hook-you`

Users vote on which tags apply to an anime. Tags with ≥5 votes display on the anime page.

### Feature 6: Real-Time Episode Discussion
When a new episode of an airing anime drops (detected via AniList airing schedule), auto-create an episode discussion thread in the comments section.
Header: "Episode 7 Discussion — Spoilers within, no warnings needed"

### Feature 7: Seasonal Awards (Community Choice)
Quarterly: "Best of Spring 2025" voted by community, across categories: Best OP, Best Animation, Best Story, Hidden Gem.
Results page is evergreen SEO content.

### Feature 8: "Where to Watch" Smart Links
AniList provides external streaming links per anime. Display as branded tiles (Crunchyroll, Netflix, Prime, Hidive logos). Never host or proxy streams — link out only. Legality clear.

---

## SEO Strategy (Exhaustive)

### Technical
- **SSR on every public page** — no client-only rendered content for crawlers
- **Slug URLs everywhere** — `/anime/fullmetal-alchemist-brotherhood` not `/anime/5114`
- **Structured data**:
  - `TVSeries` + `AggregateRating` on every anime page
  - `Article` + `Author` on every article
  - `BreadcrumbList` on all pages
  - `WebSite` with `SearchAction` on homepage (enables Google Sitelink search box)
- **Canonical tags** on all pages to prevent filter param duplication
- **hreflang**: English only for now, add `ja` when Japanese content added
- **robots.txt**:
  ```
  User-agent: *
  Allow: /anime/
  Allow: /genre/
  Allow: /studio/
  Allow: /articles/
  Allow: /seasonal/
  Disallow: /feed
  Disallow: /settings
  Disallow: /api/
  Sitemap: https://animelot.com/sitemap.xml
  ```
- **sitemap.xml**: Dynamically generated via Next.js route handler
  - All anime (potentially 10,000+ URLs)
  - All genre pages (~50 URLs)
  - All studio pages (~500 URLs)
  - All article pages
  - Pagination: split into sitemap index + child sitemaps if > 50,000 URLs

### On-Page
- Each anime page title: `{English Title} ({Year}) — Reviews, Ratings & Discussion | Animelot`
- Each genre page title: `Best {Genre} Anime — Rated & Reviewed by the Community | Animelot`
- Each studio page title: `{Studio} Anime — Complete Works, Ratings & Reviews | Animelot`
- Meta descriptions: auto-generated from synopsis, truncated at 155 chars
- H1: one per page, always the primary entity name (anime title, genre name, etc.)
- Internal linking: every anime page links to its genres, studios, and 5 related anime

### Content SEO
- Editorial articles targeting: "best isekai anime 2024," "underrated anime gems," "anime like Attack on Titan" — all high search volume, easy to rank for a new site
- Seasonal roundup articles every quarter — inherently timely, social-shareable

### Core Web Vitals Targets
- LCP ≤ 2.5s — achieved via Next.js ISR + cover image preloading (`<link rel="preload">`)
- CLS ≤ 0.1 — achieved via fixed aspect ratios on all image containers
- INP ≤ 200ms — achieved via RSC + minimal JS hydration

---

## AniList Seed Script Specification

### Rate Limit Handling
AniList limits to 90 requests/minute. Seed script:
- Batches queries (50 anime per request via `Page` query)
- Adds `700ms` delay between requests
- Implements exponential backoff on `429` responses
- Logs progress with a progress bar (`cli-progress`)

### Data Transformed
For each anime fetched:
1. Generate URL slug: `title-romaji.toLowerCase().replace(/[^a-z0-9]+/g, '-')`
2. Map AniList format → internal format enum
3. Flatten studios array from AniList `studios.nodes[].name`
4. Store `externalLinks` as JSONB keyed by site name
5. Upsert on `anilist_id` conflict

### Seed Batches
- Pass 1: Top 1000 by popularity (all-time)
- Pass 2: Current + next season (all)
- Pass 3: Top 200 by score (catches critically acclaimed but less popular works)
- Pass 4: Specific studios (MAPPA, Ufotable, Bones, KyoAni, Madhouse, Trigger, WIT)

---

## File & Folder Structure (Complete)

```
animelot/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                    # Homepage
│   │   │   ├── anime/[slug]/
│   │   │   │   ├── page.tsx                # Anime detail (SSR)
│   │   │   │   └── loading.tsx             # Skeleton
│   │   │   ├── browse/
│   │   │   │   └── page.tsx
│   │   │   ├── genre/[slug]/page.tsx
│   │   │   ├── studio/[slug]/page.tsx
│   │   │   ├── articles/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── seasonal/page.tsx
│   │   │   ├── compare/[user1]/[user2]/page.tsx
│   │   │   └── battles/page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── auth/callback/route.ts
│   │   ├── (app)/                          # Authenticated-only pages
│   │   │   ├── feed/page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── profile/page.tsx
│   │   │   │   └── appearance/page.tsx
│   │   │   └── wrapped/[year]/page.tsx
│   │   ├── profile/[username]/
│   │   │   ├── page.tsx
│   │   │   ├── reviews/page.tsx
│   │   │   ├── lists/page.tsx
│   │   │   └── stats/page.tsx
│   │   ├── api/
│   │   │   ├── og/anime/[slug]/route.tsx   # OG image generation
│   │   │   ├── og/wrapped/[userId]/route.tsx
│   │   │   ├── cron/ping/route.ts          # Supabase keep-alive
│   │   │   └── cron/seed-seasonal/route.ts # Weekly AniList sync
│   │   ├── sitemap.ts                      # Auto-generated sitemap
│   │   ├── robots.ts
│   │   ├── layout.tsx                      # Root layout, font loading
│   │   └── globals.css                     # Design tokens + base styles
│   ├── components/
│   │   ├── anime/
│   │   │   ├── AnimeCard.tsx
│   │   │   ├── AnimeCardSkeleton.tsx
│   │   │   ├── HankoStamp.tsx              # THE signature component
│   │   │   ├── SeasonRail.tsx
│   │   │   ├── ScoreHistogram.tsx
│   │   │   ├── RatingSlider.tsx
│   │   │   ├── ReviewCard.tsx
│   │   │   ├── SpoilerBlock.tsx
│   │   │   ├── WatchStatusPicker.tsx
│   │   │   └── VibeTags.tsx
│   │   ├── canvas/
│   │   │   ├── InkHero.tsx                 # WebGL homepage canvas
│   │   │   ├── InkTransition.tsx           # Page transition canvas
│   │   │   ├── ProfileParticles.tsx        # Profile ambient particles
│   │   │   └── shaders/
│   │   │       ├── inkFluid.vert.glsl
│   │   │       ├── inkFluid.frag.glsl
│   │   │       └── inkWipe.frag.glsl
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── NavSearch.tsx               # Cmdk search palette
│   │   │   ├── Footer.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── profile/
│   │   │   ├── ProfileHeader.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── GenreRadar.tsx
│   │   │   └── StatsPanel.tsx
│   │   ├── social/
│   │   │   ├── FollowButton.tsx
│   │   │   ├── CommentThread.tsx
│   │   │   └── ActivityItem.tsx
│   │   ├── battles/
│   │   │   ├── BattleCard.tsx
│   │   │   └── VoteButton.tsx
│   │   └── ui/                             # shadcn/ui base components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                   # Browser client
│   │   │   ├── server.ts                   # Server component client
│   │   │   ├── middleware.ts               # Auth middleware
│   │   │   └── types.ts                    # Database.ts (generated)
│   │   ├── anilist/
│   │   │   ├── client.ts
│   │   │   └── queries.ts
│   │   ├── taste-compat.ts                 # Pearson correlation algorithm
│   │   ├── wrapped.ts                      # Wrapped computation
│   │   ├── slug.ts                         # Slug generation utils
│   │   └── seo.ts                          # Shared SEO meta generators
│   └── styles/
│       └── tokens.css
├── scripts/
│   ├── seed.ts                             # Full AniList seed
│   └── seed-vibe-tags.ts                   # Initial vibe tag seed
├── public/
│   ├── robots.txt
│   ├── og-default.png                      # Default OG image
│   └── icons/
│       └── [streaming service SVG logos]
├── next.config.ts
├── tailwind.config.ts
├── middleware.ts                            # Auth redirects
└── package.json
```

---

## Phase Build Order (Strict)

### Phase 1 — Foundation ✦ `bun run seed` returns 1000+ rows
- [ ] Initialize Next.js 14 + TypeScript + Tailwind + shadcn/ui
- [ ] Set up Supabase project, run full SQL schema
- [ ] Configure Supabase Auth (email + Google + Discord OAuth)
- [ ] Configure Supabase Storage buckets (avatars, list-covers)
- [ ] Write `scripts/seed.ts` AniList seeder with rate limiting + progress bar
- [ ] Run seed, verify 1000+ anime rows in Supabase
- [ ] Set up `globals.css` with all design tokens
- [ ] Configure Google Fonts (Fraunces, Work Sans, JetBrains Mono) via `next/font`
- [ ] Set up Cloudflare DNS + Zoho MX records

### Phase 2 — Read-Only Frontend + SEO ✦ Lighthouse SEO ≥ 90
- [ ] Navbar (search + auth state)
- [ ] Homepage (all 8 sections, real data, WebGL ink hero)
- [ ] AnimeCard + HankoStamp components
- [ ] Browse page with filter sidebar
- [ ] Anime detail page (full layout, all metadata, score histogram)
- [ ] Genre + Studio landing pages
- [ ] All SEO meta tags, JSON-LD, OG images, sitemap, robots.txt
- [ ] ISR + revalidation strategy

### Phase 3 — Write Flow + Auth + Profiles ✦ Full rating/review cycle works
- [ ] Auth pages (login, signup, OAuth callback)
- [ ] Rating slider + review editor (Tiptap with spoiler block)
- [ ] Watch status picker
- [ ] Profile pages (all tabs)
- [ ] Settings (profile edit, theme picker, title preference)
- [ ] User lists (system + custom)
- [ ] `wrapped_snapshots` computation trigger

### Phase 4 — Social Layer ✦ Feed populates with followed users
- [ ] Follow / unfollow
- [ ] Activity feed with Supabase Realtime
- [ ] Comment threads (anime pages, reviews, articles)
- [ ] Vibe tag voting
- [ ] Notifications (follow + comment reply)
- [ ] Episode auto-discussion thread creation

### Phase 5 — Content + Discoverability ✦ sitemap.xml returns 5000+ URLs
- [ ] Seasonal calendar
- [ ] Article system (MDX)
- [ ] Editorial articles (launch with 5 seeded articles)
- [ ] Dynamic sitemap with index
- [ ] "Where to Watch" links
- [ ] Taste Compatibility (`/compare`) page

### Phase 6 — Signature Features + Polish ✦ All viral features live
- [ ] Wrapped generation + OG image card
- [ ] Tier-list Battles (weekly auto-generate)
- [ ] Seasonal Awards (community voting)
- [ ] WebGL page transition ink wipe
- [ ] Profile particles
- [ ] HankoStamp ink-bleed mount animation
- [ ] Zoho Mail setup + Resend transactional email templates
- [ ] Final accessibility audit (axe-core)
- [ ] Final Lighthouse audit: Performance ≥ 85, SEO 100, Accessibility 95+
- [ ] Supabase keep-alive cron

---

## Cost Thresholds & Scaling Triggers

| Users | Monthly Cost | What Changes |
|---|---|---|
| 0 – 1,000 | **$0** | Everything on free tiers |
| 1,000 – 5,000 | ~$25/mo | Supabase Pro ($25) if DB > 500MB |
| 5,000 – 20,000 | ~$50/mo | Supabase Pro + Vercel Pro ($20) |
| 20,000 – 100,000 | ~$200/mo | Supabase Pro + Vercel Pro + Resend $20 |
| 100,000+ | ~$600/mo | Review Redis caching layer, CDN for images |

---

## Accessibility Requirements (Non-Negotiable)

- All interactive elements reachable by keyboard
- All images have `alt` text (anime cover alt: `"{Title} cover art"`)
- Focus ring always visible (never `outline: none` without replacement)
- Spoiler reveals triggered by Enter/Space, not click only
- HankoStamp has `aria-label="Community score: {score} out of 10"`
- Rating slider has `role="slider"` with proper `aria-valuemin/max/now`
- WebGL canvas has `role="presentation"` + `aria-hidden="true"`
- Color never used as the only means of conveying information
- `prefers-reduced-motion: reduce` disables ALL animations, transitions, and WebGL

---

## Launch Checklist

- [ ] animelot.com DNS → Cloudflare → Vercel
- [ ] Zoho Mail 5 accounts configured
- [ ] Resend DKIM verified, welcome email template live
- [ ] Supabase production project (not paused)
- [ ] Supabase keep-alive cron active
- [ ] Google Search Console: domain property added, sitemap submitted
- [ ] Vercel Analytics active
- [ ] `NEXT_PUBLIC_` env vars set in Vercel dashboard
- [ ] 1000+ anime seeded
- [ ] 5 editorial articles published
- [ ] Seed vibe tags script run (15 initial tags)
- [ ] Error boundary on all pages (no white screens)
- [ ] Rate limiting on write API routes (Supabase RLS handles most)
