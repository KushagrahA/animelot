import Image from "next/image";
import Link from "next/link";
import { MessageCircle, ShieldAlert } from "lucide-react";
import type { CommunityPostWithUser } from "@/lib/supabase/types";
import { CommunityVoteButton } from "./CommunityVoteButton";
import { communityFlairs, displayUser, initials, relativeDate } from "./community-utils";

interface CommunityPostCardProps {
  post: CommunityPostWithUser;
  priority?: boolean;
}

export function CommunityPostCard({ post, priority = false }: CommunityPostCardProps) {
  const name = displayUser(post.profiles);
  const flair = communityFlairs.find((item) => item.value === post.flair)?.label ?? "General";
  const animeTitle = post.anime?.title_english || post.anime?.title_romaji;

  return (
    <article className="community-post-card">
      <CommunityVoteButton postId={post.id} initialScore={post.score_count} />
      <div className="community-post-main">
        <div className="community-post-meta">
          <span className="community-avatar is-small" aria-hidden="true">
            {post.profiles.avatar_url ? (
              <Image src={post.profiles.avatar_url} alt="" fill sizes="34px" priority={priority} />
            ) : (
              <span>{initials(name)}</span>
            )}
          </span>
          <strong>{name}</strong>
          <span>{relativeDate(post.created_at)}</span>
          <em>{flair}</em>
          {post.is_spoiler ? <em className="is-spoiler"><ShieldAlert size={13} /> spoiler</em> : null}
          {animeTitle ? <Link href={`/anime/${post.anime?.slug}`}>{animeTitle}</Link> : null}
        </div>
        <Link href={`/community/${post.slug}`} className="community-post-title">
          {post.title}
        </Link>
        <p className="community-post-preview">{post.body}</p>
        <div className="community-post-actions">
          <Link href={`/community/${post.slug}`}>
            <MessageCircle size={15} />
            {post.comment_count === 1 ? "1 reply" : `${post.comment_count} replies`}
          </Link>
        </div>
      </div>
    </article>
  );
}

