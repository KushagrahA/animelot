"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MessageCircle, Send, ShieldAlert, Star } from "lucide-react";
import type { CommentWithUser, RatingWithUser } from "@/lib/supabase/types";

interface AnimeCommunityPanelProps {
  animeId: string;
  animeTitle: string;
  initialReviews: RatingWithUser[];
  initialComments: CommentWithUser[];
  canSync: boolean;
}

function displayUser(profile: RatingWithUser["profiles"] | CommentWithUser["profiles"]) {
  return profile.display_name || profile.username || "Animelot user";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "A";
}

function relativeDate(value: string) {
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

export function AnimeCommunityPanel({
  animeId,
  animeTitle,
  initialReviews,
  initialComments,
  canSync,
}: AnimeCommunityPanelProps) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState<string | null>(canSync ? null : "Publish a rating first to attach this AniList title to the public discussion system.");

  const reviewCount = initialReviews.length;
  const commentsLabel = useMemo(() => {
    if (comments.length === 0) return "No discussion yet";
    if (comments.length === 1) return "1 comment";
    return `${comments.length} comments`;
  }, [comments.length]);

  const submitComment = async () => {
    const nextBody = body.trim();
    if (!nextBody || posting) return;

    setPosting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/anime/comment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ animeId, body: nextBody, spoiler }),
      });
      const payload = (await response.json().catch(() => ({}))) as { comment?: CommentWithUser; error?: string };

      if (!response.ok || !payload.comment) {
        setMessage(payload.error ?? "Could not publish that comment yet. Please try again in a moment.");
        return;
      }

      setComments((current) => [payload.comment as CommentWithUser, ...current]);
      setBody("");
      setSpoiler(false);
      router.refresh();
    } catch {
      setMessage("Could not publish that comment yet. Please try again in a moment.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="anime-community">
      <div className="anime-community-head">
        <div>
          <p className="community-kicker">Community</p>
          <h2>Reviews & discussion</h2>
        </div>
        <div className="community-counts" aria-label="Community counts">
          <span><Star size={14} /> {reviewCount} reviews</span>
          <span><MessageCircle size={14} /> {commentsLabel}</span>
        </div>
      </div>

      {message ? <p className="community-message">{message}</p> : null}

      <div className="review-stack">
        {initialReviews.length > 0 ? (
          initialReviews.slice(0, 6).map((review) => {
            const name = displayUser(review.profiles);
            return (
              <article key={review.id} className="review-card">
                <div className="community-avatar" aria-hidden="true">
                  {review.profiles.avatar_url ? (
                    <Image src={review.profiles.avatar_url} alt="" fill sizes="44px" />
                  ) : (
                    <span>{initials(name)}</span>
                  )}
                </div>
                <div className="review-body">
                  <div className="review-meta">
                    <strong>{name}</strong>
                    <span>{relativeDate(review.created_at)}</span>
                    {review.contains_spoilers ? <em><ShieldAlert size={13} /> spoilers</em> : null}
                  </div>
                  <div className="review-title-row">
                    <span className="review-score">{review.score?.toFixed(1) ?? "--"}</span>
                    <h3>{review.review_headline || `Rated ${animeTitle}`}</h3>
                  </div>
                  {review.review ? <p>{review.review}</p> : null}
                </div>
              </article>
            );
          })
        ) : (
          <div className="community-empty">
            <Star size={18} />
            <p>Publish a rating or review to start the community score for {animeTitle}.</p>
          </div>
        )}
      </div>

      <div className="discussion-panel">
        <div className="discussion-composer">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={`Talk about ${animeTitle}`}
            maxLength={2000}
            rows={4}
          />
          <div className="discussion-actions">
            <label>
              <input
                type="checkbox"
                checked={spoiler}
                onChange={(event) => setSpoiler(event.target.checked)}
              />
              Spoiler
            </label>
            <button type="button" onClick={submitComment} disabled={posting || !body.trim()} className="shader-button jelly-button">
              <Send size={15} />
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>

        <div className="comment-stack">
          {comments.length > 0 ? comments.map((comment) => {
            const name = displayUser(comment.profiles);
            return (
              <article key={comment.id} className="comment-card">
                <div className="community-avatar is-small" aria-hidden="true">
                  {comment.profiles.avatar_url ? (
                    <Image src={comment.profiles.avatar_url} alt="" fill sizes="34px" />
                  ) : (
                    <span>{initials(name)}</span>
                  )}
                </div>
                <div>
                  <div className="review-meta">
                    <strong>{name}</strong>
                    <span>{relativeDate(comment.created_at)}</span>
                    {comment.is_spoiler ? <em><ShieldAlert size={13} /> spoiler</em> : null}
                  </div>
                  <p>{comment.body}</p>
                </div>
              </article>
            );
          }) : (
            <div className="community-empty is-compact">
              <MessageCircle size={17} />
              <p>No thread yet. Start with a take, a question, or a recommendation.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
