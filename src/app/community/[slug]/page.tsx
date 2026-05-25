import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CommunityThread } from "@/components/community/CommunityThread";
import { CommunityVoteButton } from "@/components/community/CommunityVoteButton";
import { communityFlairs, displayUser, relativeDate } from "@/components/community/community-utils";
import type { CommentWithUser, CommunityPostWithUser } from "@/lib/supabase/types";

interface CommunityThreadPageProps {
  params: Promise<{ slug: string }>;
}

const postSelect = "*, profiles!community_posts_user_id_fkey(username, display_name, avatar_url, is_verified)";

async function findCommunityPost(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
  const { data: exactPost } = await supabase.from("community_posts").select(postSelect).eq("slug", slug).maybeSingle();

  if (exactPost) return exactPost;

  const fallbackBase = slug.match(/^(.*)-[a-f0-9]{6}$/i)?.[1];
  if (!fallbackBase) return null;

  const { data: fallbackPost } = await supabase
    .from("community_posts")
    .select(postSelect)
    .ilike("slug", `${fallbackBase}-%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return fallbackPost;
}

export async function generateMetadata({ params }: CommunityThreadPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("community_posts").select("title, body, slug").eq("slug", slug).maybeSingle();

  if (!data) {
    return { title: "Community Thread Not Found | Animelot" };
  }

  return {
    title: `${data.title} — Anime Community`,
    description: data.body.slice(0, 150),
    alternates: {
      canonical: `https://animelot.com/community/${data.slug}`,
    },
  };
}

export default async function CommunityThreadPage({ params }: CommunityThreadPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const postData = await findCommunityPost(supabase, slug);

  if (!postData) notFound();

  const post = postData as CommunityPostWithUser;
  const { data: commentData } = await supabase
    .from("comments")
    .select("*, profiles(username, display_name, avatar_url, is_verified)")
    .eq("parent_type", "article")
    .eq("parent_id", post.id)
    .order("created_at", { ascending: true })
    .limit(100);

  const comments = (commentData ?? []) as CommentWithUser[];
  const name = displayUser(post.profiles);
  const flair = communityFlairs.find((item) => item.value === post.flair)?.label ?? "General";

  return (
    <main className="community-page">
      <div className="community-thread-layout">
        <Link href="/community" className="community-back-link">
          <ArrowLeft size={16} />
          Community
        </Link>

        <article className="community-thread-post">
          <CommunityVoteButton postId={post.id} initialScore={post.score_count} compact />
          <div>
            <div className="community-post-meta">
              <strong>{name}</strong>
              <span>{relativeDate(post.created_at)}</span>
              <em>{flair}</em>
              {post.is_spoiler ? <em className="is-spoiler"><ShieldAlert size={13} /> spoiler</em> : null}
            </div>
            <h1>{post.title}</h1>
            <p>{post.body}</p>
            <div className="community-post-actions">
              <span>
                <MessageCircle size={15} />
                {comments.length === 1 ? "1 reply" : `${comments.length} replies`}
              </span>
            </div>
          </div>
        </article>

        <CommunityThread postId={post.id} initialComments={comments} />
      </div>
    </main>
  );
}
