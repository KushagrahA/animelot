import type { Metadata } from "next";
import Link from "next/link";
import { Flame, MessageCircle, Sparkles, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CommunityComposer } from "@/components/community/CommunityComposer";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { communityFlairs, type CommunityFlair } from "@/components/community/community-utils";
import type { CommunityPostWithUser } from "@/lib/supabase/types";

interface CommunityPageProps {
  searchParams?: Promise<{
    flair?: string;
    sort?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Anime Community — Discussions, Recommendations & Theories",
  description:
    "Join Animelot's anime community: post discussion threads, ask for recommendations, debate theories, and reply like a clean anime subreddit.",
  alternates: {
    canonical: "https://animelot.com/community",
  },
};

const promptCards = [
  "What anime deserves a second chance after a weak first episode?",
  "Which ending still lives rent-free in your head?",
  "Drop a recommendation for someone who just finished Frieren.",
];

function isFlair(value: string | undefined): value is CommunityFlair {
  return Boolean(value && communityFlairs.some((item) => item.value === value));
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const params = (await searchParams) ?? {};
  const selectedFlair = isFlair(params.flair) ? params.flair : "all";
  const sort = params.sort === "top" ? "top" : "new";
  const supabase = await createClient();

  let query = supabase
    .from("community_posts")
    .select("*, profiles!community_posts_user_id_fkey(username, display_name, avatar_url, is_verified)")
    .limit(30);

  if (selectedFlair !== "all") {
    query = query.eq("flair", selectedFlair);
  }

  const { data, error } =
    sort === "top"
      ? await query.order("score_count", { ascending: false }).order("created_at", { ascending: false })
      : await query.order("created_at", { ascending: false });

  const posts = error ? [] : ((data ?? []) as CommunityPostWithUser[]);

  return (
    <main className="community-page">
      <section className="community-hero">
        <div>
          <p className="community-kicker">Animelot Community</p>
          <h1>Anime discussion that feels like a great subreddit, without the mess.</h1>
          <p>
            Post theories, ask for watch-order help, debate finales, and find recommendations from people who actually care
            about taste.
          </p>
          <div className="community-hero-actions">
            <a href="#start-thread" className="shader-button jelly-button">
              <Sparkles size={16} />
              Start a thread
            </a>
            <Link href="/browse">
              <MessageCircle size={16} />
              Find anime to discuss
            </Link>
          </div>
        </div>
        <aside className="community-pulse-card" aria-label="Community pulse">
          <span><Flame size={16} /> Live pulse</span>
          <strong>{posts.length}</strong>
          <p>{posts.length === 1 ? "thread is live" : "threads are live"} right now</p>
        </aside>
      </section>

      <div className="community-layout">
        <section className="community-feed" aria-label="Community feed">
          <div className="community-toolbar">
            <div className="community-tabs" aria-label="Sort community posts">
              <Link className={sort === "new" ? "is-active" : ""} href={`/community${selectedFlair === "all" ? "" : `?flair=${selectedFlair}`}`}>
                New
              </Link>
              <Link className={sort === "top" ? "is-active" : ""} href={`/community?sort=top${selectedFlair === "all" ? "" : `&flair=${selectedFlair}`}`}>
                <TrendingUp size={14} />
                Top
              </Link>
            </div>
            <div className="community-flairs" aria-label="Filter community posts">
              <Link className={selectedFlair === "all" ? "is-active" : ""} href={`/community${sort === "top" ? "?sort=top" : ""}`}>
                All
              </Link>
              {communityFlairs.map((item) => (
                <Link
                  key={item.value}
                  className={selectedFlair === item.value ? "is-active" : ""}
                  href={`/community?flair=${item.value}${sort === "top" ? "&sort=top" : ""}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {posts.length > 0 ? (
            <div className="community-post-stack">
              {posts.map((post, index) => (
                <CommunityPostCard key={post.id} post={post} priority={index < 3} />
              ))}
            </div>
          ) : (
            <div className="community-empty is-community-feed">
              <MessageCircle size={20} />
              <p>No threads yet. Start with a recommendation, a theory, or a question worth answering.</p>
            </div>
          )}
        </section>

        <aside className="community-sidebar">
          <div id="start-thread">
            <CommunityComposer />
          </div>
          <section className="community-side-card">
            <p className="community-kicker">Thread Starters</p>
            <div className="community-prompt-stack">
              {promptCards.map((prompt) => (
                <span key={prompt}>{prompt}</span>
              ))}
            </div>
          </section>
          <section className="community-side-card">
            <p className="community-kicker">House Style</p>
            <ul>
              <li>Mark spoilers before the twist, not after.</li>
              <li>Use recommendations for “what should I watch next?”</li>
              <li>Make disagreement useful, specific, and watchable.</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
